// notify-internal: sends internal email notifications via Gmail connector gateway.
// Fire-and-forget — failures are logged, never block calling flows.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';
const FROM = 'ACS Beauty OS <acsbeautystudio@gmail.com>';
const TO = 'acsbeautystudio@gmail.com';

type NotifyType =
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'giftcard_purchased'
  | 'lead_received';

interface Payload {
  type: NotifyType;
  // booking
  booking_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  service_name?: string;
  start_time?: string; // ISO
  end_time?: string;
  total_price?: number;
  notes?: string;
  // gift card
  giftcard_id?: string;
  amount?: number;
  recipient_name?: string;
  buyer_name?: string;
  buyer_email?: string;
  occasion?: string;
  code?: string;
}

function fmtNY(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/New_York',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildEmail(p: Payload): { subject: string; html: string } {
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
      return {
        subject: `🆕 Novo agendamento solicitado — ${p.client_name ?? 'cliente'}`,
        html: wrap('Novo agendamento solicitado', [
          ['Cliente', p.client_name ?? ''],
          ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''],
          ['Data/Hora (NY)', fmtNY(p.start_time)],
          ['Valor', p.total_price != null ? `$${Number(p.total_price).toFixed(2)}` : ''],
          ['Notas', p.notes ?? ''],
        ], 'Aprovar no Admin'),
      };
    case 'booking_confirmed':
      return {
        subject: `✅ Booking confirmado — ${p.client_name ?? 'cliente'} ${fmtNY(p.start_time)}`,
        html: wrap('Booking confirmado', [
          ['Cliente', p.client_name ?? ''],
          ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''],
          ['Data/Hora (NY)', fmtNY(p.start_time)],
          ['Valor', p.total_price != null ? `$${Number(p.total_price).toFixed(2)}` : ''],
        ]),
      };
    case 'booking_cancelled':
      return {
        subject: `❌ Booking cancelado — ${p.client_name ?? 'cliente'} ${fmtNY(p.start_time)}`,
        html: wrap('Booking cancelado', [
          ['Cliente', p.client_name ?? ''],
          ['Telefone', p.client_phone ?? ''],
          ['Serviço', p.service_name ?? ''],
          ['Data/Hora (NY)', fmtNY(p.start_time)],
        ]),
      };
    case 'giftcard_purchased':
      return {
        subject: `🎁 Nova compra Gift Card — $${Number(p.amount ?? 0).toFixed(0)}`,
        html: wrap('Nova compra de Gift Card', [
          ['Comprador', p.buyer_name ?? ''],
          ['Email', p.buyer_email ?? ''],
          ['Para', p.recipient_name ?? ''],
          ['Ocasião', p.occasion ?? ''],
          ['Valor', `$${Number(p.amount ?? 0).toFixed(2)}`],
          ['Código', p.code ?? ''],
        ], 'Ver no Admin'),
      };
  }
}

function rfc2822ToBase64Url(subject: string, html: string): string {
  const msg = [
    `From: ${FROM}`,
    `To: ${TO}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');
  // base64url
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

    const payload = (await req.json()) as Payload;
    if (!payload?.type) {
      return new Response(JSON.stringify({ success: false, error: 'type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, html } = buildEmail(payload);
    const raw = rfc2822ToBase64Url(subject, html);

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
      console.error(`[notify-internal] Gmail send failed [${resp.status}]: ${body}`);
      return new Response(JSON.stringify({ success: false, status: resp.status, error: body }), {
        status: 200, // never block caller
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[notify-internal] sent ${payload.type}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notify-internal] error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200, // fire-and-forget
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
