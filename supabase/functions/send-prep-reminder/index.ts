// send-prep-reminder: 24h antes do agendamento envia email de preparo ao cliente.
// Pode ser invocada por cron (a cada hora). Dedup via tabela booking_reminders (channel='email_prep').
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';

interface Settings {
  from: string;
  studio_address: string;
  studio_phone: string;
  prep_default: string;
  prep_by_category: Record<string, string>;
}

async function loadSettings(supabase: any): Promise<Settings> {
  const out: Settings = {
    from: 'ACS Beauty Studio <acsbeautystudio@gmail.com>',
    studio_address: '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ',
    studio_phone: '(732) 915-3430',
    prep_default: 'Chegue 5 minutos antes do horário. Evite cremes ou produtos pesados na área a ser tratada. Se tiver alguma alergia ou condição de pele, avise nossa equipe ao chegar.',
    prep_by_category: {},
  };
  try {
    const { data } = await supabase.from('studio_settings').select('key, value').in('key', ['studio_info', 'prep_instructions']);
    for (const row of data || []) {
      if (row.key === 'studio_info' && row.value) {
        if (row.value.email) out.from = `${row.value.name || 'ACS Beauty Studio'} <${row.value.email}>`;
        if (row.value.address) out.studio_address = row.value.address;
        if (row.value.phone) out.studio_phone = row.value.phone;
      }
      if (row.key === 'prep_instructions' && row.value) {
        if (typeof row.value === 'string') out.prep_default = row.value;
        else {
          if (row.value.default) out.prep_default = row.value.default;
          if (row.value.by_category && typeof row.value.by_category === 'object') {
            out.prep_by_category = row.value.by_category;
          }
        }
      }
    }
  } catch (e) { console.warn('[prep] loadSettings failed', e); }
  return out;
}

function fmtNY(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/New_York',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function buildHtml(opts: {
  name: string; service: string; whenStr: string; prepHtml: string; s: Settings;
}): string {
  const first = (opts.name || '').split(' ')[0] || '';
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">ACS Beauty Studio</h1>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 12px;color:#3d3d38;">Seu atendimento é amanhã 💅</h2>
      <p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 24px;">
        ${first ? `Oi, ${first}! ` : ''}Está chegando o seu momento ACS. Aqui está tudo o que você precisa saber para se preparar:
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;padding:8px;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">Serviço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${opts.service}</td></tr>
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Data e hora</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${opts.whenStr}</td></tr>
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Endereço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${opts.s.studio_address}</td></tr>
      </table>
      <div style="background:#faf5f0;border-left:3px solid #b76e79;padding:18px 22px;margin:0 0 24px;border-radius:6px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#3d3d38;letter-spacing:.5px;text-transform:uppercase;">Como se preparar</p>
        <div style="font-size:14px;line-height:1.7;color:#3d3d38;">${opts.prepHtml}</div>
      </div>
      <p style="font-size:13px;color:#8b7355;line-height:1.6;margin:24px 0 0;">
        Precisa remarcar? Chame no WhatsApp <a href="https://wa.me/1${opts.s.studio_phone.replace(/\D/g,'')}" style="color:#8b7355;">${opts.s.studio_phone}</a> com pelo menos 24h de antecedência.
      </p>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0;"><strong>ACS Beauty Studio</strong> · ${opts.s.studio_address}</p>
      </div>
    </div>
  </div>`;
}

function rfc2822(from: string, to: string, subject: string, html: string): string {
  const msg = [
    `From: ${from}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0', 'Content-Type: text/html; charset="UTF-8"', '', html,
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(from: string, to: string, subject: string, html: string): Promise<boolean> {
  const L = Deno.env.get('LOVABLE_API_KEY');
  const G = Deno.env.get('GOOGLE_MAIL_API_KEY');
  if (!L || !G) { console.error('[prep] missing gmail keys'); return false; }
  try {
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${L}`,
        'X-Connection-Api-Key': G,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rfc2822(from, to, subject, html) }),
    });
    if (!resp.ok) { console.error(`[prep] send failed ${resp.status}: ${await resp.text()}`); return false; }
    return true;
  } catch (e) { console.error('[prep] send error', e); return false; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const settings = await loadSettings(supabase);

    // Window: bookings starting 23–25h from now (handles hourly cron with slack)
    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id, client_name, client_email, start_time, end_time,
        services:service_id (name, category),
        service_skus:sku_id (name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString());
    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'no bookings in window' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dedup
    const ids = bookings.map(b => b.id);
    const { data: existing } = await supabase
      .from('booking_reminders')
      .select('booking_id')
      .in('booking_id', ids)
      .eq('reminder_type', '24h_prep')
      .eq('channel', 'email');
    const sentSet = new Set((existing || []).map((r: any) => r.booking_id));

    let sent = 0; let failed = 0; let skipped = 0;
    for (const b of bookings) {
      if (!b.client_email || b.client_email.includes('@acsbeauty.app') || sentSet.has(b.id)) { skipped++; continue; }
      const serviceName = (b.service_skus as any)?.name || (b.services as any)?.name || 'seu agendamento';
      const category = (b.services as any)?.category as string | undefined;
      const prepHtml = (category && settings.prep_by_category[category]) || settings.prep_default;
      const ok = await sendGmail(
        settings.from, b.client_email,
        `Seu atendimento é amanhã — veja como se preparar 💅`,
        buildHtml({
          name: b.client_name || '', service: serviceName,
          whenStr: fmtNY(b.start_time), prepHtml, s: settings,
        })
      );
      if (ok) {
        sent++;
        await supabase.from('booking_reminders').insert({
          booking_id: b.id, reminder_type: '24h_prep', channel: 'email',
        });
      } else { failed++; }
    }

    return new Response(JSON.stringify({ success: true, found: bookings.length, sent, failed, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[prep] fatal', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
