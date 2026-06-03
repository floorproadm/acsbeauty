// send-birthday-emails: dispara email de aniversário para clientes cujo birthday é hoje.
// Dedup via tabela birthday_emails_sent (client_id, year).
// Pode ser invocada manualmente ou via pg_cron diário.
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
  offer_text: string;
}

async function loadSettings(supabase: any): Promise<Settings> {
  const out: Settings = {
    from: 'ACS Beauty Studio <acsbeautystudio@gmail.com>',
    studio_address: '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ',
    studio_phone: '(732) 915-3430',
    offer_text: 'Como presente nosso, você ganhou <strong>15% de desconto</strong> no seu próximo serviço durante o mês do seu aniversário. Use o código <strong>BDAY15</strong> ao agendar. 💛',
  };
  try {
    const { data } = await supabase.from('studio_settings').select('key, value').in('key', ['studio_info', 'birthday_offer_text']);
    for (const row of data || []) {
      if (row.key === 'studio_info' && row.value) {
        if (row.value.email) out.from = `${row.value.name || 'ACS Beauty Studio'} <${row.value.email}>`;
        if (row.value.address) out.studio_address = row.value.address;
        if (row.value.phone) out.studio_phone = row.value.phone;
      }
      if (row.key === 'birthday_offer_text' && row.value) {
        if (typeof row.value === 'string') out.offer_text = row.value;
        else if (row.value.text) out.offer_text = row.value.text;
      }
    }
  } catch (e) { console.warn('[birthday] loadSettings failed', e); }
  return out;
}

function buildHtml(name: string, s: Settings): string {
  const first = (name || '').split(' ')[0] || 'querida';
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">ACS Beauty Studio</h1>
      </div>
      <div style="background:linear-gradient(135deg,#b76e79 0%,#d4a574 50%,#8b7355 100%);color:#fff;padding:48px 24px;border-radius:14px;text-align:center;margin:0 0 28px;box-shadow:0 8px 24px rgba(139,115,85,.25);">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:.9;">Hoje é o seu dia</p>
        <p style="font-family:'Playfair Display',Georgia,serif;font-size:42px;margin:0;font-weight:300;letter-spacing:1px;">Feliz Aniversário! 🎂</p>
        <p style="margin:14px 0 0;font-size:18px;opacity:.95;">${first}</p>
      </div>
      <p style="font-size:16px;line-height:1.7;color:#3d3d38;margin:0 0 20px;">
        Que esse novo ciclo seja repleto de momentos para você. Aqui na ACS Beauty Studio acreditamos que cuidar de você é uma forma de celebração — e queremos fazer parte disso.
      </p>
      <div style="background:#faf5f0;border-left:3px solid #b76e79;padding:18px 22px;margin:0 0 28px;border-radius:6px;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:#3d3d38;">${s.offer_text}</p>
      </div>
      <div style="text-align:center;margin:8px 0 32px;">
        <a href="https://acsbeautystudio.com/portal" style="display:inline-block;padding:14px 32px;background:#3d3d38;color:#f5f0eb;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Agendar meu presente</a>
      </div>
      <div style="padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 4px;"><strong>ACS Beauty Studio</strong></p>
        <p style="margin:0;">${s.studio_address}</p>
        <p style="margin:4px 0 0;">${s.studio_phone}</p>
      </div>
    </div>
  </div>`;
}

function rfc2822(from: string, to: string, subject: string, html: string): string {
  const msg = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(from: string, to: string, subject: string, html: string): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
  if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
    console.error('[birthday] missing gmail keys');
    return false;
  }
  try {
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rfc2822(from, to, subject, html) }),
    });
    if (!resp.ok) {
      console.error(`[birthday] send failed ${resp.status}: ${await resp.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[birthday] send error', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let body: any = {};
    try { body = await req.json(); } catch { /* cron may not send body */ }
    const dryRun = body?.dryRun === true;
    const testEmail = body?.testEmail as string | undefined;

    const settings = await loadSettings(supabase);

    // Today in America/New_York
    const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const month = nyNow.getMonth() + 1;
    const day = nyNow.getDate();
    const year = nyNow.getFullYear();

    // Pull all clients with birthday set
    const { data: clients, error: cErr } = await supabase
      .from('clients')
      .select('id, name, email, birthday')
      .not('birthday', 'is', null)
      .not('email', 'is', null);
    if (cErr) throw cErr;

    const matches = (clients || []).filter((c: any) => {
      if (!c.birthday || !c.email) return false;
      if (c.email.includes('@acsbeauty.app')) return false;
      const [, m, d] = String(c.birthday).split('-').map(Number);
      return m === month && d === day;
    });

    // Filter dedup
    const ids = matches.map((c: any) => c.id);
    let alreadySent = new Set<string>();
    if (ids.length > 0) {
      const { data: sent } = await supabase
        .from('birthday_emails_sent')
        .select('client_id')
        .eq('year', year)
        .in('client_id', ids);
      alreadySent = new Set((sent || []).map((r: any) => r.client_id));
    }

    const eligible = matches.filter((c: any) => !alreadySent.has(c.id));

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true, dryRun: true,
        date: `${month}/${day}`,
        total_birthdays_today: matches.length,
        eligible: eligible.length,
        already_sent: matches.length - eligible.length,
        sample: eligible.slice(0, 5).map((c: any) => ({ name: c.name, email: c.email })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (testEmail) {
      const ok = await sendGmail(
        settings.from, testEmail,
        `[TESTE] Feliz Aniversário, Cliente! 🎂 Um presente especial da ACS Beauty`,
        buildHtml('Cliente Teste', settings)
      );
      return new Response(JSON.stringify({ success: ok, test: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0; let failed = 0;
    // Throttle: 5 concurrent batches with 250ms gap
    const BATCH = 5;
    for (let i = 0; i < eligible.length; i += BATCH) {
      const batch = eligible.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (c: any) => {
        const ok = await sendGmail(
          settings.from, c.email,
          `Feliz Aniversário, ${(c.name || '').split(' ')[0] || 'querida'}! 🎂 Um presente especial da ACS Beauty`,
          buildHtml(c.name || '', settings)
        );
        if (ok) {
          await supabase.from('birthday_emails_sent').insert({ client_id: c.id, year });
        }
        return ok;
      }));
      sent += results.filter(Boolean).length;
      failed += results.filter(r => !r).length;
      if (i + BATCH < eligible.length) await new Promise(r => setTimeout(r, 250));
    }

    return new Response(JSON.stringify({
      success: true, date: `${month}/${day}`,
      total_birthdays_today: matches.length,
      sent, failed, skipped_already_sent: matches.length - eligible.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[birthday] fatal', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
