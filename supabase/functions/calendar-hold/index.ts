import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HoldRequest {
  start_time: string;
  end_time: string;
  service_id?: string;
  package_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_time, end_time, service_id, package_id } = await req.json() as HoldRequest;

    if (!start_time || !end_time) {
      throw new Error('Missing required parameters: start_time and end_time');
    }

    console.log(`Creating hold for ${start_time} to ${end_time}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get calendar configuration
    const { data: calendarConfig } = await supabase
      .from('calendar_integrations')
      .select('calendar_id')
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    const calendarId = calendarConfig?.calendar_id || 'primary';

    // Get hold duration from settings
    const { data: settings } = await supabase
      .from('scheduling_settings')
      .select('hold_duration_minutes')
      .single();

    const holdDuration = settings?.hold_duration_minutes || 5;

    // Clean up expired holds first
    await supabase.rpc('cleanup_expired_holds');

    // Create unique hold key
    const holdKey = `${calendarId}:${start_time}:${end_time}`;
    const expiresAt = new Date(Date.now() + holdDuration * 60000).toISOString();

    // Try to create the hold
    const { data: hold, error: holdError } = await supabase
      .from('booking_holds')
      .insert({
        hold_key: holdKey,
        start_time,
        end_time,
        expires_at: expiresAt,
        service_id: service_id || null,
        package_id: package_id || null,
        calendar_id: calendarId,
      })
      .select()
      .single();

    if (holdError) {
      // Check if it's a unique constraint violation
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
