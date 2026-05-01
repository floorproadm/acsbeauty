import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate caller — must be admin_owner or staff
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin_owner', 'staff'])
      .limit(1)
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      throw new Error('Missing booking_id');
    }

    console.log(`Approving booking ${booking_id}`);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(name), packages(name)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    if (!['requested', 'whatsapp_pending'].includes(booking.status)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Booking is already ${booking.status}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cleanup booking_holds reference if present (whatsapp_pending bookings carry hold_id)
    if (booking.hold_id) {
      await supabase.from('booking_holds').delete().eq('id', booking.hold_id);
    }

    // Get Google credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Get calendar configuration
    const { data: calendarConfig } = await supabase
      .from('calendar_integrations')
      .select('calendar_id, timezone')
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    const calendarId = calendarConfig?.calendar_id || 'primary';
    const timezone = calendarConfig?.timezone || 'America/New_York';

    // Check availability via FreeBusy
    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: booking.start_time,
          timeMax: booking.end_time,
          timeZone: timezone,
          items: [{ id: calendarId }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      throw new Error('Failed to verify availability');
    }

    const freeBusyData = await freeBusyResponse.json();
    const busyBlocks = freeBusyData.calendars?.[calendarId]?.busy || [];

    if (busyBlocks.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This time slot is no longer available. Consider rescheduling.',
        code: 'SLOT_UNAVAILABLE',
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Google Calendar event
    const eventTitle = booking.services?.name || booking.packages?.name || 'Booking';
    const calendarEvent = {
      summary: `${eventTitle} - ${booking.client_name}`,
      description: `Cliente: ${booking.client_name}\nTelefone: ${booking.client_phone || ''}${booking.notes ? `\nNotas: ${booking.notes}` : ''}`,
      start: { dateTime: booking.start_time, timeZone: timezone },
      end: { dateTime: booking.end_time, timeZone: timezone },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const createEventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarEvent),
      }
    );

    if (!createEventResponse.ok) {
      const errorText = await createEventResponse.text();
      console.error('Failed to create calendar event:', errorText);
      throw new Error('Failed to create calendar event');
    }

    const createdEvent = await createEventResponse.json();
    console.log('Created Google Calendar event:', createdEvent.id);

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        google_calendar_event_id: createdEvent.id,
      })
      .eq('id', booking_id);

    if (updateError) {
      // Cleanup calendar event on failure
      try {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${createdEvent.id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
      } catch (e) {
        console.error('Failed to cleanup calendar event:', e);
      }
      throw updateError;
    }

    console.log('Booking approved successfully:', booking_id);

    return new Response(JSON.stringify({
      success: true,
      booking_id,
      google_event_id: createdEvent.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calendar-approve-booking:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
