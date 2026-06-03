// send-transactional-email: generic transactional sender via Gmail gateway.
// Supports template 'booking-reminder'. Fire-and-forget pattern.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';
let FROM = 'ACS Beauty Studio <acsbeautystudio@gmail.com>';
let STUDIO_NAME = 'ACS Beauty Studio';
let STUDIO_ADDRESS = '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ';
let STUDIO_PHONE = '(732) 915-3430';
let SETTINGS_LOADED = false;

async function loadStudioSettings(): Promise<void> {
  if (SETTINGS_LOADED) return;
  SETTINGS_LOADED = true;
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const res = await fetch(`${url}/rest/v1/studio_settings?key=eq.studio_info&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return;
    const v = (await res.json())?.[0]?.value;
    if (!v) return;
    if (v.name) STUDIO_NAME = v.name;
    if (v.email) FROM = `${v.name || STUDIO_NAME} <${v.email}>`;
    if (v.address) STUDIO_ADDRESS = v.address;
    if (v.phone) STUDIO_PHONE = v.phone;
  } catch (e) { console.warn('[send-transactional-email] settings load failed', e); }
}

interface TemplatePayload {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, any>;
}

function shell(title: string, intro: string, body: string, footer = ''): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">${STUDIO_NAME}</h1>
        <p style="margin:8px 0 0;color:#8b7355;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Where you become exactly who you already are</p>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">${title}</h2>
      <p style="font-size:15px;line-height:1.6;color:#3d3d38;margin:0 0 24px;">${intro}</p>
      ${body}
      ${footer}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 4px;"><strong>${STUDIO_NAME}</strong></p>
        <p style="margin:0;">${STUDIO_ADDRESS}</p>
        <p style="margin:4px 0 0;">${STUDIO_PHONE} · acsbeautystudio@gmail.com</p>
      </div>
    </div>
  </div>`;
}

function buildTemplate(p: TemplatePayload): { subject: string; html: string } | null {
  const d = p.templateData || {};
  switch (p.templateName) {
    case 'booking-reminder': {
      const serviceName = d.serviceName || 'seu agendamento';
      const dateStr = d.date || '';
      const timeStr = d.time || '';
      const clientName = d.clientName || '';
      const first = String(clientName).split(' ')[0] || '';
      const studioAddress = d.studioAddress || STUDIO_ADDRESS;
      const detailsTable = `<table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">Serviço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${serviceName}</td></tr>
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Data</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${dateStr}</td></tr>
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Horário</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${timeStr}</td></tr>
        <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Endereço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${studioAddress}</td></tr>
      </table>`;
      return {
        subject: `⏰ Lembrete: seu agendamento amanhã — ${serviceName}`,
        html: shell(
          `${first ? first + ', s' : 'S'}eu agendamento é amanhã!`,
          'Passando para lembrar do seu agendamento. Estamos te esperando:',
          detailsTable,
          `<p style="font-size:13px;color:#8b7355;line-height:1.6;margin:0;">
            Em caso de imprevistos, nos chame no WhatsApp <a href="https://wa.me/1${STUDIO_PHONE.replace(/\D/g, '')}" style="color:#8b7355;">${STUDIO_PHONE}</a> o quanto antes.
          </p>`
        ),
      };
    }
    case 'campaign-custom': {
      const subject = d.subject || `Novidade de ${STUDIO_NAME}`;
      const html = d.html || shell(d.title || 'Olá!', d.intro || '', d.body || '', '');
      return { subject, html };
    }
    default:
      return null;
  }
}

function rfc2822ToBase64Url(to: string, subject: string, html: string): string {
  const msg = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');
  const utf8 = unescape(encodeURIComponent(msg));
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    if (!GOOGLE_MAIL_API_KEY) throw new Error('GOOGLE_MAIL_API_KEY not configured');

    const payload = (await req.json()) as TemplatePayload;
    if (!payload?.templateName || !payload?.recipientEmail) {
      return new Response(JSON.stringify({ success: false, error: 'templateName and recipientEmail required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (payload.recipientEmail.includes('@acsbeauty.app')) {
      // walk-in placeholder — skip
      return new Response(JSON.stringify({ success: true, skipped: 'placeholder_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tpl = buildTemplate(payload);
    if (!tpl) {
      return new Response(JSON.stringify({ success: false, error: `Unknown template: ${payload.templateName}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const raw = rfc2822ToBase64Url(payload.recipientEmail, tpl.subject, tpl.html);
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });
    const body = await resp.text();
    if (!resp.ok) {
      console.error(`[send-transactional-email] failed [${resp.status}]: ${body}`);
      return new Response(JSON.stringify({ success: false, status: resp.status, error: body }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[send-transactional-email] sent ${payload.templateName} → ${payload.recipientEmail}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-transactional-email] error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
