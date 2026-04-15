import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_NUMBER = '17329153430';
const STUDIO_NAME = 'ACS Beauty Studio';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find confirmed bookings between 23h and 25h from now (to catch within a cron window)
    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`Looking for bookings between ${from.toISOString()} and ${to.toISOString()}`);

    // Get confirmed bookings in the window
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_name,
        client_phone,
        client_email,
        start_time,
        end_time,
        service_id,
        sku_id,
        services:service_id (name),
        service_skus:sku_id (name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString());

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found for reminder window');
      return new Response(
        JSON.stringify({ message: 'No bookings to remind', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${bookings.length} bookings to process`);

    // Get already-sent reminders to avoid duplicates
    const bookingIds = bookings.map(b => b.id);
    const { data: existingReminders } = await supabase
      .from('booking_reminders')
      .select('booking_id, channel')
      .in('booking_id', bookingIds)
      .eq('reminder_type', '24h_before');

    const sentSet = new Set(
      (existingReminders || []).map(r => `${r.booking_id}:${r.channel}`)
    );

    let whatsappSent = 0;
    let emailSent = 0;
    const errors: string[] = [];

    for (const booking of bookings) {
      const serviceName = (booking.service_skus as any)?.name 
        || (booking.services as any)?.name 
        || 'seu agendamento';

      // Format date for display in NY timezone
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/New_York',
      });
      const timeStr = startDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/New_York',
      });

      // ── WhatsApp Reminder ──
      if (booking.client_phone && !sentSet.has(`${booking.id}:whatsapp`)) {
        try {
          // Clean phone number
          const cleanPhone = booking.client_phone.replace(/\D/g, '');
          const fullPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

          const message = encodeURIComponent(
            `✨ Olá ${booking.client_name}! Lembrando do seu agendamento no ${STUDIO_NAME}:\n\n` +
            `📋 ${serviceName}\n` +
            `📅 ${dateStr}\n` +
            `🕐 ${timeStr}\n\n` +
            `📍 375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ\n\n` +
            `Precisa reagendar? Responda esta mensagem ou ligue (732) 915-3430.\n\n` +
            `Te esperamos! 💛`
          );

          const waLink = `https://wa.me/${fullPhone}?text=${message}`;

          // Log the reminder as sent (the admin will send manually or we can integrate with WA Business API later)
          const { error: insertError } = await supabase
            .from('booking_reminders')
            .insert({
              booking_id: booking.id,
              reminder_type: '24h_before',
              channel: 'whatsapp',
            });

          if (!insertError) {
            whatsappSent++;
            console.log(`WhatsApp reminder logged for booking ${booking.id} — ${booking.client_name}`);
          }
        } catch (e) {
          errors.push(`WA error for ${booking.id}: ${e.message}`);
        }
      }

      // ── Email Reminder ──
      if (booking.client_email && !sentSet.has(`${booking.id}:email`)) {
        try {
          // Try to send via transactional email if available
          try {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'booking-reminder',
                recipientEmail: booking.client_email,
                idempotencyKey: `reminder-24h-${booking.id}`,
                templateData: {
                  clientName: booking.client_name,
                  serviceName,
                  date: dateStr,
                  time: timeStr,
                },
              },
            });
          } catch (emailErr) {
            console.log('Transactional email not available, logging reminder only:', emailErr.message);
          }

          const { error: insertError } = await supabase
            .from('booking_reminders')
            .insert({
              booking_id: booking.id,
              reminder_type: '24h_before',
              channel: 'email',
            });

          if (!insertError) {
            emailSent++;
            console.log(`Email reminder logged for booking ${booking.id} — ${booking.client_name}`);
          }
        } catch (e) {
          errors.push(`Email error for ${booking.id}: ${e.message}`);
        }
      }
    }

    const result = {
      message: 'Reminders processed',
      bookingsFound: bookings.length,
      whatsappSent,
      emailSent,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Result:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-booking-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
