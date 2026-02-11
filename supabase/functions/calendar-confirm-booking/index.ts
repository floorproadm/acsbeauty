import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ConfirmBookingRequest {
  hold_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_instagram?: string;
  service_id?: string;
  package_id?: string;
  offer_id?: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── RATE LIMITING ──
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const rateLimitKey = `${clientIp}:calendar-confirm`;

    supabase.rpc('cleanup_old_rate_limits').then(() => {}).catch(() => {});

    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      _key: rateLimitKey,
      _max_requests: 5,
      _window_seconds: 60,
    });

    if (rlError) {
      console.error('Rate limit check error:', rlError);
    } else if (allowed === false) {
      console.log(`Rate limited: ${rateLimitKey}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
      });
    }

    // ── BUSINESS LOGIC ──
    const body = await req.json() as ConfirmBookingRequest;
    const { 
      hold_id, client_name, client_phone, client_email, client_instagram,
      service_id, package_id, offer_id, start_time, end_time, notes 
    } = body;

    if (!hold_id || !client_name || !client_phone || !start_time || !end_time) {
      throw new Error('Missing required parameters');
    }

    console.log(`Confirming booking for hold ${hold_id}`);

    // Get Google credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Validate hold exists and is not expired
    const { data: hold, error: holdError } = await supabase
      .from('booking_holds')
      .select('*')
      .eq('id', hold_id)
      .single();

    if (holdError || !hold) {
      console.log('Hold not found or expired');
      return new Response(JSON.stringify({
        success: false,
        error: 'Your reservation has expired. Please select a new time slot.',
        code: 'HOLD_EXPIRED'
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(hold.expires_at) < new Date()) {
      await supabase.from('booking_holds').delete().eq('id', hold_id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Your reservation has expired. Please select a new time slot.',
        code: 'HOLD_EXPIRED'
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get calendar configuration
    const { data: calendarConfig } = await supabase
      .from('calendar_integrations')
      .select('calendar_id, timezone')
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    const calendarId = calendarConfig?.calendar_id || 'primary';
    const timezone = calendarConfig?.timezone || 'America/New_York';

    // Double-check availability with FreeBusy API
    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: start_time,
          timeMax: end_time,
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
      await supabase.from('booking_holds').delete().eq('id', hold_id);
      return new Response(JSON.stringify({
        success: false,
        error: 'This time slot is no longer available. Please select a different time.',
        code: 'SLOT_UNAVAILABLE'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get service name for calendar event
    let eventTitle = 'Booking';
    if (service_id) {
      const { data: service } = await supabase.from('services').select('name').eq('id', service_id).single();
      if (service) eventTitle = service.name;
    } else if (package_id) {
      const { data: pkg } = await supabase.from('packages').select('name').eq('id', package_id).single();
      if (pkg) eventTitle = pkg.name;
    }

    // Create Google Calendar event
    const calendarEvent = {
      summary: `${eventTitle} - ${client_name}`,
      description: `Cliente: ${client_name}\nTelefone: ${client_phone}${client_instagram ? `\nInstagram: ${client_instagram}` : ''}${notes ? `\nNotas: ${notes}` : ''}`,
      start: { dateTime: start_time, timeZone: timezone },
      end: { dateTime: end_time, timeZone: timezone },
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

    // Upsert client by phone
    const { data: existingClient } = await supabase
      .from('clients').select('id').eq('phone', client_phone).single();

    let clientId: string;
    
    if (existingClient) {
      clientId = existingClient.id;
      await supabase.from('clients').update({
        name: client_name,
        email: client_email || null,
        instagram: client_instagram || null,
        last_visit_at: new Date().toISOString(),
      }).eq('id', clientId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients').insert({
          name: client_name,
          phone: client_phone,
          email: client_email || null,
          instagram: client_instagram || null,
        }).select().single();
      if (clientError) throw clientError;
      clientId = newClient.id;
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        client_id: clientId,
        client_name,
        client_phone,
        client_email: client_email || `${client_phone.replace(/\D/g, '')}@placeholder.com`,
        service_id: service_id || null,
        package_id: package_id || null,
        start_time,
        end_time,
        timezone,
        status: 'confirmed',
        google_calendar_event_id: createdEvent.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      try {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${createdEvent.id}`,
          { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
      } catch (e) {
        console.error('Failed to cleanup calendar event:', e);
      }
      throw bookingError;
    }

    // Delete the hold
    await supabase.from('booking_holds').delete().eq('id', hold_id);

    // Fetch service/package details for confirmation
    let serviceData = null;
    let packageData = null;
    
    if (service_id) {
      const { data } = await supabase.from('services').select('id, name, duration_minutes, price, promo_price').eq('id', service_id).single();
      serviceData = data;
    }
    if (package_id) {
      const { data } = await supabase.from('packages').select('id, name, total_price, sessions_qty').eq('id', package_id).single();
      packageData = data;
    }

    console.log('Booking confirmed successfully:', booking.id);

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        client_name,
        start_time,
        end_time,
        timezone,
        status: 'confirmed',
        services: serviceData,
        packages: packageData,
      },
      google_event_id: createdEvent.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calendar-confirm-booking:', error);
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
