import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  date: string; // YYYY-MM-DD
  service_duration_minutes: number;
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
    const { date, service_duration_minutes } = await req.json() as AvailabilityRequest;
    
    if (!date || !service_duration_minutes) {
      throw new Error('Missing required parameters: date and service_duration_minutes');
    }

    console.log(`Checking availability for ${date}, duration: ${service_duration_minutes} minutes`);

    // Get Google credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('Google Service Account not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Get access token using JWT
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get calendar configuration
    const { data: calendarConfig, error: configError } = await supabase
      .from('calendar_integrations')
      .select('calendar_id, timezone')
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    if (configError || !calendarConfig?.calendar_id) {
      console.log('No active calendar integration found, using defaults');
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
    const maxAdvanceDays = settings?.max_advance_days || 60;

    // Get business hours for the day
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday

    const { data: businessHours } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!businessHours?.is_open) {
      console.log(`Day ${dayOfWeek} is closed`);
      return new Response(JSON.stringify({ 
        available_slots: [],
        message: 'Closed on this day'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openTime = businessHours.open_time; // e.g., "09:00:00"
    const closeTime = businessHours.close_time; // e.g., "18:00:00"

    // Build start and end times for the day in the correct timezone
    // We need to create dates that represent the local time in the business timezone
    // For America/New_York, we calculate the offset and create proper ISO strings
    const dayStart = parseLocalTime(date, openTime, timezone);
    const dayEnd = parseLocalTime(date, closeTime, timezone);

    // Get existing holds
    const { data: holds } = await supabase
      .from('booking_holds')
      .select('start_time, end_time')
      .gte('expires_at', new Date().toISOString());

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

      // Skip if slot is in the past
      if (currentSlot <= now) {
        currentSlot = new Date(currentSlot.getTime() + slotInterval * 60000);
        continue;
      }

      // Check if slot end exceeds business hours
      if (slotEnd > dayEnd) {
        break;
      }

      // Check against Google Calendar busy blocks
      let isBusy = false;
      for (const busy of busyBlocks) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        
        // Check for overlap
        if (currentSlot < busyEnd && slotEndWithBuffer > busyStart) {
          isBusy = true;
          break;
        }
      }

      // Check against existing holds
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

// Helper function to parse local time in a timezone
function parseLocalTime(dateStr: string, timeStr: string, timezone: string): Date {
  // Create a date string and use timezone offset calculation
  // For EST (America/New_York), offset is -05:00 in winter, -04:00 in summer
  const dateTime = new Date(`${dateStr}T${timeStr}`);
  
  // Get the timezone offset for this specific date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Create a reference date to calculate offset
  const refDate = new Date(`${dateStr}T12:00:00Z`);
  const parts = formatter.formatToParts(refDate);
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  const tzYear = parseInt(getPart('year'));
  const tzMonth = parseInt(getPart('month')) - 1;
  const tzDay = parseInt(getPart('day'));
  const tzHour = parseInt(getPart('hour'));
  
  // Calculate offset: difference between UTC and local time
  const utcDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, 0, 0));
  const offsetMs = utcDate.getTime() - refDate.getTime();
  
  // Parse the target time
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const targetUtc = new Date(Date.UTC(
    parseInt(dateStr.split('-')[0]),
    parseInt(dateStr.split('-')[1]) - 1,
    parseInt(dateStr.split('-')[2]),
    hours,
    minutes,
    seconds || 0
  ));
  
  // Adjust for timezone offset
  return new Date(targetUtc.getTime() - offsetMs);
}

// Helper function to get Google access token using service account
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat: now,
  };

  const encoder = new TextEncoder();
  
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${claimB64}`;

  // Import the private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
