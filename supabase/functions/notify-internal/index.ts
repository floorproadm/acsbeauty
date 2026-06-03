// notify-internal: sends internal email notifications via Gmail connector gateway.
// Also sends CLIENT-facing emails for booking_confirmed, booking_cancelled and giftcard_purchased.
// Fire-and-forget — failures are logged, never block calling flows.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';
let FROM = 'ACS Beauty Studio <acsbeautystudio@gmail.com>';
let INTERNAL_TO = 'acsbeautystudio@gmail.com';
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
    const rows = await res.json();
    const v = rows?.[0]?.value;
    if (!v) return;
    if (v.email) {
      FROM = `${v.name || 'ACS Beauty Studio'} <${v.email}>`;
      INTERNAL_TO = v.email;
    }
    if (v.address) STUDIO_ADDRESS = v.address;
    if (v.phone) STUDIO_PHONE = v.phone;
  } catch (e) {
    console.warn('[notify-internal] loadStudioSettings failed', e);
  }
}

type NotifyType =
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'giftcard_purchased'
  | 'lead_received';

interface Payload {
  type: NotifyType;
  booking_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  service_name?: string;
  start_time?: string;
  end_time?: string;
  total_price?: number;
  notes?: string;
  giftcard_id?: string;
  amount?: number;
  recipient_name?: string;
  recipient_email?: string;
  buyer_name?: string;
  buyer_email?: string;
  occasion?: string;
  personal_message?: string;
  code?: string;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  lead_service?: string;
  lead_message?: string;
  lead_source?: string;
}

function fmtNY(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/New_York',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function gcalLink(p: Payload): string {
  if (!p.start_time || !p.end_time) return '';
  const fmt = (s: string) => s.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${p.service_name || 'Agendamento'} — ACS Beauty Studio`,
    dates: `${fmt(p.start_time)}/${fmt(p.end_time)}`,
    details: `Cliente: ${p.client_name || ''}\nEstúdio: ACS Beauty Studio\nTel: ${STUDIO_PHONE}`,
    location: STUDIO_ADDRESS,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function internalEmail(p: Payload): { subject: string; html: string } {
  const adminLink = 'https://acsbeautystudio.com/admin';
  const wrap = (title: string, rows: Array<[string, string]>, cta = 'Abrir Admin') => `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f5f0eb;color:#3d3d38;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;margin:0 0 24px;color:#3d3d38;">${title}</h1>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${rows.map(([k, v]) => `<tr>
          <td style="padding:8px 0;color:#8b7355;font-size:13px;width:140px;">${k}</td>
          <td style="padding:8px 0;color:#3d3d38;font-size:14px;font-weight:500;">${v || '—'}</td>
        </tr>`).join('')}
      </table>
      <a href="${adminLink}" style="display:inline-block;padding:12px 24px;background:#8b7355;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">${cta}</a>
      <p style="margin-top:32px;font-size:11px;color:#8b7355;">ACS Beauty OS · Notificação interna</p>
    </div>`;

  switch (p.type) {
    case 'booking_requested':
      return { subject: `🆕 Novo agendamento solicitado — ${p.client_name ?? 'cliente'}`,
        html: wrap('Novo agendamento solicitado', [
          ['Cliente', p.client_name ?? ''], ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''], ['Data/Hora (NY)', fmtNY(p.start_time)],
          ['Valor', p.total_price != null ? `$${Number(p.total_price).toFixed(2)}` : ''],
          ['Notas', p.notes ?? ''],
        ], 'Aprovar no Admin') };
    case 'booking_confirmed':
      return { subject: `✅ Booking confirmado — ${p.client_name ?? 'cliente'} ${fmtNY(p.start_time)}`,
        html: wrap('Booking confirmado', [
          ['Cliente', p.client_name ?? ''], ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''], ['Data/Hora (NY)', fmtNY(p.start_time)],
          ['Valor', p.total_price != null ? `$${Number(p.total_price).toFixed(2)}` : ''],
        ]) };
    case 'booking_cancelled':
      return { subject: `❌ Booking cancelado — ${p.client_name ?? 'cliente'} ${fmtNY(p.start_time)}`,
        html: wrap('Booking cancelado', [
          ['Cliente', p.client_name ?? ''], ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''], ['Data/Hora (NY)', fmtNY(p.start_time)],
        ]) };
    case 'giftcard_purchased':
      return { subject: `🎁 Nova compra Gift Card — $${Number(p.amount ?? 0).toFixed(0)}`,
        html: wrap('Nova compra de Gift Card', [
          ['Comprador', p.buyer_name ?? ''], ['Email', p.buyer_email ?? ''],
          ['Para', p.recipient_name ?? ''], ['Ocasião', p.occasion ?? ''],
          ['Valor', `$${Number(p.amount ?? 0).toFixed(2)}`], ['Código', p.code ?? ''],
        ], 'Ver no Admin') };
    case 'lead_received':
      return { subject: `📩 Novo lead — ${p.lead_name ?? 'sem nome'}`,
        html: wrap('Novo lead recebido', [
          ['Nome', p.lead_name ?? ''], ['Telefone', p.lead_phone ?? ''],
          ['Email', p.lead_email ?? ''], ['Interesse', p.lead_service ?? ''],
          ['Origem', p.lead_source ?? ''], ['Mensagem', p.lead_message ?? ''],
        ], 'Abrir CRM') };
  }
}

// ── CLIENT-facing emails ──
function clientShell(title: string, intro: string, body: string, footer = ''): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">ACS Beauty Studio</h1>
        <p style="margin:8px 0 0;color:#8b7355;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Where you become exactly who you already are</p>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">${title}</h2>
      <p style="font-size:15px;line-height:1.6;color:#3d3d38;margin:0 0 24px;">${intro}</p>
      ${body}
      ${footer}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 4px;"><strong>ACS Beauty Studio</strong></p>
        <p style="margin:0;">${STUDIO_ADDRESS}</p>
        <p style="margin:4px 0 0;">${STUDIO_PHONE} · acsbeautystudio@gmail.com</p>
      </div>
    </div>
  </div>`;
}

function clientDetailsTable(p: Payload): string {
  const rows: Array<[string, string]> = [
    ['Serviço', p.service_name ?? '—'],
    ['Data e hora', fmtNY(p.start_time)],
  ];
  if (p.total_price != null) rows.push(['Valor', `$${Number(p.total_price).toFixed(2)}`]);
  rows.push(['Endereço', STUDIO_ADDRESS]);
  return `<table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;padding:8px;margin:0 0 24px;">
    ${rows.map(([k, v]) => `<tr>
      <td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">${k}</td>
      <td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${v}</td>
    </tr>`).join('')}
  </table>`;
}

function clientEmail(p: Payload): { subject: string; html: string; to: string } | null {
  if (p.type === 'booking_confirmed' && p.client_email && !p.client_email.includes('@acsbeauty.app')) {
    const gcal = gcalLink(p);
    const cta = gcal ? `<div style="text-align:center;margin:8px 0 24px;">
      <a href="${gcal}" style="display:inline-block;padding:14px 28px;background:#8b7355;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:.5px;">📅 Adicionar ao Google Calendar</a>
    </div>` : '';
    return {
      to: p.client_email,
      subject: `✨ Agendamento confirmado — ${fmtNY(p.start_time)}`,
      html: clientShell(
        `Seu agendamento está confirmado, ${p.client_name?.split(' ')[0] || ''}!`,
        'Mal podemos esperar para te receber. Aqui estão os detalhes do seu agendamento:',
        clientDetailsTable(p) + cta,
        `<p style="font-size:13px;color:#8b7355;line-height:1.6;margin:24px 0 0;">
          Em caso de imprevistos, entre em contato com no mínimo 24h de antecedência pelo WhatsApp ${STUDIO_PHONE}.
        </p>`
      ),
    };
  }
  if (p.type === 'booking_cancelled' && p.client_email && !p.client_email.includes('@acsbeauty.app')) {
    return {
      to: p.client_email,
      subject: `Agendamento cancelado — ${fmtNY(p.start_time)}`,
      html: clientShell(
        `Olá ${p.client_name?.split(' ')[0] || ''},`,
        'Confirmamos o cancelamento do seu agendamento:',
        clientDetailsTable(p),
        `<p style="font-size:14px;color:#3d3d38;line-height:1.6;margin:24px 0 0;">
          Esperamos te ver em breve. Para remarcar, é só chamar no WhatsApp <a href="https://wa.me/1${STUDIO_PHONE.replace(/\D/g, '')}" style="color:#8b7355;">${STUDIO_PHONE}</a>.
        </p>`
      ),
    };
  }
  return null;
}

function giftCardClientEmails(p: Payload): Array<{ subject: string; html: string; to: string }> {
  if (p.type !== 'giftcard_purchased') return [];
  const out: Array<{ subject: string; html: string; to: string }> = [];
  const amount = `$${Number(p.amount ?? 0).toFixed(2)}`;
  const code = p.code || '';
  const bookCta = `<div style="text-align:center;margin:8px 0 24px;">
    <a href="https://acsbeautystudio.com/portal" style="display:inline-block;padding:14px 32px;background:#3d3d38;color:#f5f0eb;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Agendar Agora</a>
  </div>`;
  const giftCardBox = `
    <div style="background:linear-gradient(135deg,#b76e79 0%,#d4a574 50%,#8b7355 100%);color:#fff;padding:36px 24px;border-radius:14px;text-align:center;margin:0 0 24px;box-shadow:0 8px 24px rgba(139,115,85,.25);">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:.9;">ACS Beauty Studio</p>
      <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.85;">Gift Card</p>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:52px;margin:0 0 20px;font-weight:300;letter-spacing:1px;">${amount}</p>
      <div style="background:rgba(255,255,255,.18);padding:14px 20px;border-radius:8px;display:inline-block;">
        <p style="margin:0;font-size:10px;letter-spacing:3px;opacity:.85;">CÓDIGO DE RESGATE</p>
        <p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:22px;letter-spacing:4px;font-weight:700;">${code}</p>
      </div>
      ${p.occasion ? `<p style="margin:18px 0 0;font-size:13px;opacity:.95;font-style:italic;">${p.occasion}</p>` : ''}
    </div>`;
  const personalMsg = p.personal_message
    ? `<div style="border-left:3px solid #b76e79;padding:14px 22px;margin:0 0 24px;background:#faf5f0;font-style:italic;color:#3d3d38;font-size:14px;line-height:1.7;">"${p.personal_message}"</div>`
    : '';
  const redeemInstructions = `
    <div style="background:#f5f0eb;padding:20px 24px;border-radius:10px;margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#3d3d38;letter-spacing:.5px;text-transform:uppercase;">Como resgatar</p>
      <ol style="margin:0;padding-left:18px;color:#3d3d38;font-size:13px;line-height:1.8;">
        <li>Agende em <a href="https://acsbeautystudio.com" style="color:#b76e79;">acsbeautystudio.com</a> ou WhatsApp ${STUDIO_PHONE}</li>
        <li>Informe o código <strong>${code}</strong> ao reservar</li>
        <li>Aproveite a experiência ACS Beauty em ${STUDIO_ADDRESS}</li>
      </ol>
    </div>`;

  if (p.buyer_email) {
    out.push({
      to: p.buyer_email,
      subject: `🎁 Seu Gift Card ACS Beauty Studio — ${amount}`,
      html: clientShell(
        `Obrigada pela sua compra, ${p.buyer_name?.split(' ')[0] || ''}!`,
        `Seu Gift Card foi gerado com sucesso${p.recipient_name ? ` para <strong>${p.recipient_name}</strong>` : ''}. Guarde este código com carinho:`,
        giftCardBox + personalMsg,
        `<p style="font-size:13px;color:#8b7355;line-height:1.6;margin:0;">O código pode ser usado em qualquer serviço. Para agendar, é só apresentar o código pelo WhatsApp ${STUDIO_PHONE}.</p>`
      ),
    });
  }
  if (p.recipient_email && p.recipient_email !== p.buyer_email) {
    out.push({
      to: p.recipient_email,
      subject: `💝 Você recebeu um Gift Card ACS Beauty Studio!`,
      html: clientShell(
        `${p.recipient_name?.split(' ')[0] || 'Você'}, você foi presenteada! 💝`,
        `${p.buyer_name || 'Alguém especial'} preparou um presente para você na ACS Beauty Studio — um momento dedicado à sua beleza e bem-estar.`,
        giftCardBox + personalMsg + redeemInstructions + bookCta
      ),
    });
  }
  return out;
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

async function sendGmail(to: string, subject: string, html: string, label: string): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
  if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
    console.error(`[notify-internal] missing gmail keys for ${label}`);
    return false;
  }
  try {
    const raw = rfc2822ToBase64Url(to, subject, html);
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`[notify-internal] ${label} send failed [${resp.status}]: ${body}`);
      return false;
    }
    console.log(`[notify-internal] sent ${label} → ${to}`);
    return true;
  } catch (e) {
    console.error(`[notify-internal] ${label} error:`, e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    await loadStudioSettings();
    const payload = (await req.json()) as Payload;
    if (!payload?.type) {
      return new Response(JSON.stringify({ success: false, error: 'type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Internal email (always)
    const internal = internalEmail(payload);
    const internalOk = await sendGmail(INTERNAL_TO, internal.subject, internal.html, `internal:${payload.type}`);

    // Client-facing emails (best effort, in parallel)
    const clientJobs: Promise<boolean>[] = [];
    const directClient = clientEmail(payload);
    if (directClient) clientJobs.push(sendGmail(directClient.to, directClient.subject, directClient.html, `client:${payload.type}`));
    for (const gc of giftCardClientEmails(payload)) {
      clientJobs.push(sendGmail(gc.to, gc.subject, gc.html, `giftcard:${gc.to}`));
    }
    const clientResults = await Promise.all(clientJobs);

    return new Response(JSON.stringify({
      success: true,
      internal_sent: internalOk,
      client_sent: clientResults.filter(Boolean).length,
      client_attempted: clientResults.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notify-internal] error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
