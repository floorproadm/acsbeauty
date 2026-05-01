import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Cutoff: bookings with whatsapp_pending older than 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: stale, error: fetchError } = await supabase
      .from('bookings')
      .select('id, google_calendar_event_id, hold_id, client_name, start_time')
      .eq('status', 'whatsapp_pending')
      .lt('created_at', cutoff);

    if (fetchError) throw fetchError;

    console.log(`[cleanup-whatsapp-pending] Found ${stale?.length ?? 0} stale leads`);

    if (!stale || stale.length === 0) {
      return new Response(
        JSON.stringify({ success: true, expired: 0, message: 'No stale whatsapp_pending bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get GCal config once
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    let accessToken: string | null = null;
    let calendarId = 'primary';

    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        accessToken = await getGoogleAccessToken(serviceAccount);

        const { data: calendarConfig } = await supabase
          .from('calendar_integrations')
          .select('calendar_id')
          .eq('provider', 'google')
          .eq('is_active', true)
          .maybeSingle();

        if (calendarConfig?.calendar_id) calendarId = calendarConfig.calendar_id;
      } catch (e) {
        console.error('[cleanup-whatsapp-pending] GCal auth failed:', e);
      }
    }

    let calendarFreed = 0;
    let holdsFreed = 0;
    const expiredIds: string[] = [];

    for (const booking of stale) {
      // 1. Delete GCal hold event if any
      if (booking.google_calendar_event_id && accessToken) {
        try {
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${booking.google_calendar_event_id}`,
            { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
          if (res.ok || res.status === 404) calendarFreed++;
          else console.error(`GCal delete failed for ${booking.id}:`, await res.text());
        } catch (e) {
          console.error(`GCal delete error for ${booking.id}:`, e);
        }
      }

      // 2. Free booking_hold
      if (booking.hold_id) {
        const { error: holdErr } = await supabase
          .from('booking_holds')
          .delete()
          .eq('id', booking.hold_id);
        if (!holdErr) holdsFreed++;
      }

      expiredIds.push(booking.id);
    }

    // 3. Mark bookings as expired
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .in('id', expiredIds);

    if (updateErr) throw updateErr;

    // 4. Bonus: cleanup orphan booking_holds past expires_at
    await supabase.rpc('cleanup_expired_holds').catch(() => {});

    const summary = {
      success: true,
      expired: expiredIds.length,
      calendar_events_freed: calendarFreed,
      holds_freed: holdsFreed,
    };
    console.log('[cleanup-whatsapp-pending] Done:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cleanup-whatsapp-pending] Error:', error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp, iat: now,
  };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${claimB64}`;
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signatureInput)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signatureInput}.${signatureB64}`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenResponse.ok) throw new Error('Failed to get Google access token');
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
