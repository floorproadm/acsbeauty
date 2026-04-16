import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface HoldRequest {
  start_time: string;
  end_time: string;
  service_id?: string;
  package_id?: string;
  staff_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const rateLimitKey = `${clientIp}:calendar-hold`;

    supabase.rpc('cleanup_old_rate_limits').then(() => {}).catch(() => {});

    const { data: allowed, error: rlError } = await supabase.rpc('check_rate_limit', {
      _key: rateLimitKey,
      _max_requests: 10,
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

    const { start_time, end_time, service_id, package_id, staff_id } = await req.json() as HoldRequest;

    if (!start_time || !end_time) {
      throw new Error('Missing required parameters: start_time and end_time');
    }

    console.log(`Creating hold for ${start_time} to ${end_time}, staff: ${staff_id || 'global'}`);

    // Get calendar configuration — staff-specific or global fallback
    let calendarId = 'primary';

    if (staff_id) {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('calendar_id')
        .eq('staff_id', staff_id)
        .eq('provider', 'google')
        .eq('is_active', true)
        .maybeSingle();
      if (data?.calendar_id) calendarId = data.calendar_id;
    }

    if (calendarId === 'primary') {
      const { data } = await supabase
        .from('calendar_integrations')
        .select('calendar_id')
        .is('staff_id', null)
        .eq('provider', 'google')
        .eq('is_active', true)
        .maybeSingle();
      if (data?.calendar_id) calendarId = data.calendar_id;
    }

    // Get hold duration from settings
    const { data: settings } = await supabase
      .from('scheduling_settings')
      .select('hold_duration_minutes')
      .single();

    const holdDuration = settings?.hold_duration_minutes || 5;

    await supabase.rpc('cleanup_expired_holds');

    const holdKey = `${calendarId}:${start_time}:${end_time}`;
    const expiresAt = new Date(Date.now() + holdDuration * 60000).toISOString();

    const { data: hold, error: holdError } = await supabase
      .from('booking_holds')
      .insert({
        hold_key: holdKey,
        start_time,
        end_time,
        expires_at: expiresAt,
        service_id: service_id || null,
        package_id: package_id || null,
        staff_id: staff_id || null,
        calendar_id: calendarId,
      })
      .select()
      .single();

    if (holdError) {
      if (holdError.code === '23505') {
        console.log('Slot already held by another user');
        return new Response(JSON.stringify({
          success: false,
          error: 'Slot is currently being booked by another user. Please choose a different time.',
          code: 'SLOT_HELD'
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw holdError;
    }

    console.log('Hold created successfully:', hold.id);

    return new Response(JSON.stringify({
      success: true,
      hold_id: hold.id,
      expires_at: expiresAt,
      hold_duration_minutes: holdDuration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calendar-hold:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
