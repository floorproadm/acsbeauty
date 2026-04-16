import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  date: string; // YYYY-MM-DD
  service_duration_minutes: number;
  staff_id?: string; // optional — filters by staff calendar & hours
}

interface TimeSlot {
  start: string;
  end: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, service_duration_minutes, staff_id } = await req.json() as AvailabilityRequest;
    
    if (!date || !service_duration_minutes) {
      throw new Error('Missing required parameters: date and service_duration_minutes');
    }

    console.log(`Checking availability for ${date}, duration: ${service_duration_minutes} minutes, staff: ${staff_id || 'global'}`);

    // Get Google credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get calendar configuration — staff-specific or global fallback
    let calendarConfig: { calendar_id: string; timezone: string } | null = null;

    if (staff_id) {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('calendar_id, timezone')
        .eq('staff_id', staff_id)
        .eq('provider', 'google')
        .eq('is_active', true)
        .maybeSingle();
      calendarConfig = data;
    }

    // Fallback to global calendar (staff_id IS NULL)
    if (!calendarConfig) {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('calendar_id, timezone')
        .is('staff_id', null)
        .eq('provider', 'google')
        .eq('is_active', true)
        .maybeSingle();
      calendarConfig = data;
    }

    const calendarId = calendarConfig?.calendar_id || 'primary';
    const timezone = calendarConfig?.timezone || 'America/New_York';

    // Get scheduling settings
    const { data: settings } = await supabase
      .from('scheduling_settings')
      .select('*')
      .single();

    const slotInterval = settings?.slot_interval_minutes || 30;
    const buffer = settings?.buffer_minutes || 10;

    // Get business hours for the day — staff-specific or global fallback
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    let businessHours: any = null;

    if (staff_id) {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('staff_id', staff_id)
        .maybeSingle();
      businessHours = data;
    }

    // Fallback to global hours
    if (!businessHours) {
      const { data } = await supabase
        .from('business_hours')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .is('staff_id', null)
        .maybeSingle();
      businessHours = data;
    }

    if (!businessHours?.is_open) {
      console.log(`Day ${dayOfWeek} is closed for staff ${staff_id || 'global'}`);
      return new Response(JSON.stringify({ 
        available_slots: [],
        message: 'Closed on this day'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openTime = businessHours.open_time;
    const closeTime = businessHours.close_time;

    const dayStart = parseLocalTime(date, openTime, timezone);
    const dayEnd = parseLocalTime(date, closeTime, timezone);

    // Get existing holds — filter by staff if provided
    let holdsQuery = supabase
      .from('booking_holds')
      .select('start_time, end_time')
      .gte('expires_at', new Date().toISOString());

    if (staff_id) {
      holdsQuery = holdsQuery.eq('staff_id', staff_id);
    }

    const { data: holds } = await holdsQuery;

    // Query Google Calendar FreeBusy API
    const freeBusyResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          timeZone: timezone,
          items: [{ id: calendarId }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      const errorText = await freeBusyResponse.text();
      console.error('FreeBusy API error:', errorText);
      throw new Error(`Google Calendar API error: ${freeBusyResponse.status}`);
    }

    const freeBusyData = await freeBusyResponse.json();
    const busyBlocks = freeBusyData.calendars?.[calendarId]?.busy || [];
    
    console.log('Busy blocks from Google:', busyBlocks);

    // Generate time slots
    const availableSlots: TimeSlot[] = [];
    const serviceDuration = service_duration_minutes;
    const totalSlotTime = serviceDuration + buffer;

    let currentSlot = new Date(dayStart);
    const now = new Date();

    while (currentSlot < dayEnd) {
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
      const slotEndWithBuffer = new Date(currentSlot.getTime() + totalSlotTime * 60000);

      if (currentSlot <= now) {
        currentSlot = new Date(currentSlot.getTime() + slotInterval * 60000);
        continue;
      }

      if (slotEnd > dayEnd) {
        break;
      }

      let isBusy = false;
      for (const busy of busyBlocks) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        if (currentSlot < busyEnd && slotEndWithBuffer > busyStart) {
          isBusy = true;
          break;
        }
      }

      if (!isBusy && holds) {
        for (const hold of holds) {
          const holdStart = new Date(hold.start_time);
          const holdEnd = new Date(hold.end_time);
          if (currentSlot < holdEnd && slotEndWithBuffer > holdStart) {
            isBusy = true;
            break;
          }
        }
      }

      if (!isBusy) {
        availableSlots.push({
          start: currentSlot.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      currentSlot = new Date(currentSlot.getTime() + slotInterval * 60000);
    }

    console.log(`Found ${availableSlots.length} available slots`);

    return new Response(JSON.stringify({ 
      available_slots: availableSlots,
      timezone,
      business_hours: {
        open: openTime,
        close: closeTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calendar-availability:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      available_slots: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseLocalTime(dateStr: string, timeStr: string, timezone: string): Date {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const year = parseInt(dateStr.split('-')[0]);
  const month = parseInt(dateStr.split('-')[1]) - 1;
  const day = parseInt(dateStr.split('-')[2]);
  
  const tempDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  
  const localHourAtNoonUTC = parseInt(formatter.format(tempDate));
  const offsetHours = localHourAtNoonUTC - 12;
  const utcHours = hours - offsetHours;
  
  return new Date(Date.UTC(year, month, day, utcHours, minutes, seconds || 0));
}

async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp, iat: now,
  };

  const encoder = new TextEncoder();
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
    encoder.encode(signatureInput)
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

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange error:', errorText);
    throw new Error('Failed to get Google access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
