import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RescheduleBookingRequest {
  booking_id: string;
  new_start_time: string;
  new_end_time: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── AUTH CHECK ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: hasAdminRole } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin_owner' });
    const { data: hasStaffRole } = await supabase.rpc('has_role', { _user_id: userId, _role: 'staff' });

    if (!hasAdminRole && !hasStaffRole) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: insufficient role' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── BUSINESS LOGIC ──
    const { booking_id, new_start_time, new_end_time } = await req.json() as RescheduleBookingRequest;

    if (!booking_id || !new_start_time || !new_end_time) {
      throw new Error('Missing required parameters');
    }

    console.log(`Rescheduling booking ${booking_id} to ${new_start_time} by user ${userId}`);

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
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

    // If there's a Google Calendar event, update it
    if (booking.google_calendar_event_id) {
      const getEventResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${booking.google_calendar_event_id}`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (getEventResponse.ok) {
        const existingEvent = await getEventResponse.json();

        const updateEventResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${booking.google_calendar_event_id}`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...existingEvent,
              start: { dateTime: new_start_time, timeZone: timezone },
              end: { dateTime: new_end_time, timeZone: timezone },
            }),
          }
        );

        if (!updateEventResponse.ok) {
          const errorText = await updateEventResponse.text();
          console.error('Failed to update Google Calendar event:', errorText);
          throw new Error('Failed to update calendar event');
        }
        console.log('Google Calendar event updated successfully');
      } else if (getEventResponse.status === 404) {
        console.log('Original event not found, creating new one');

        let eventTitle = 'Booking';
        if (booking.service_id) {
          const { data: service } = await supabase.from('services').select('name').eq('id', booking.service_id).single();
          if (service) eventTitle = service.name;
        }

        const newEventResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: `${eventTitle} - ${booking.client_name}`,
              description: `Cliente: ${booking.client_name}\nTelefone: ${booking.client_phone}`,
              start: { dateTime: new_start_time, timeZone: timezone },
              end: { dateTime: new_end_time, timeZone: timezone },
            }),
          }
        );

        if (newEventResponse.ok) {
          const newEvent = await newEventResponse.json();
          await supabase.from('bookings').update({ google_calendar_event_id: newEvent.id }).eq('id', booking_id);
        }
      }
    }

    // Update booking in database
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ start_time: new_start_time, end_time: new_end_time, updated_at: new Date().toISOString() })
      .eq('id', booking_id);

    if (updateError) throw updateError;

    console.log('Booking rescheduled successfully');

    return new Response(JSON.stringify({
      success: true, message: 'Booking rescheduled successfully', new_start_time, new_end_time,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calendar-reschedule-booking:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
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
