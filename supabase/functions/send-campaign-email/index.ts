// send-campaign-email: batch email send to confirmed-booking clients.
// Admin-only. Throttled. Fire-and-forget per recipient.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  } catch (e) { console.warn('[send-campaign-email] settings load failed', e); }
}

interface CampaignPayload {
  subject: string;
  title?: string;
  intro?: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  testEmail?: string; // if set, send only to this email
  dryRun?: boolean;
}

function shell(title: string, intro: string, body: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl ? `<div style="text-align:center;margin:24px 0;">
    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:#8b7355;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:.5px;">${ctaLabel}</a>
  </div>` : '';
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">${STUDIO_NAME}</h1>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">${title}</h2>
      <p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 24px;">${intro}</p>
      <div style="font-size:15px;line-height:1.7;color:#3d3d38;">${body}</div>
      ${cta}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 4px;"><strong>${STUDIO_NAME}</strong></p>
        <p style="margin:0;">${STUDIO_ADDRESS}</p>
        <p style="margin:4px 0 0;">${STUDIO_PHONE} · acsbeautystudio@gmail.com</p>
        <p style="margin:16px 0 0;font-size:10px;color:#a89678;">Você está recebendo este email porque é cliente da ${STUDIO_NAME}.</p>
      </div>
    </div>
  </div>`;
}

function rfc2822(to: string, subject: string, html: string): string {
  const msg = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(msg)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendOne(to: string, subject: string, html: string, lovableKey: string, gmailKey: string): Promise<boolean> {
  try {
    const raw = rfc2822(to, subject, html);
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': gmailKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });
    if (!resp.ok) {
      console.error(`[campaign] ${to} failed [${resp.status}]: ${await resp.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[campaign] ${to} error:`, e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: admin/staff only ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: claims.claims.sub, _role: 'admin_owner' });
    const { data: isStaff } = await admin.rpc('has_role', { _user_id: claims.claims.sub, _role: 'staff' });
    if (!isAdmin && !isStaff) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) throw new Error('Email gateway not configured');

    const payload = (await req.json()) as CampaignPayload;
    if (!payload?.subject) {
      return new Response(JSON.stringify({ success: false, error: 'subject required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = shell(
      payload.title || payload.subject,
      payload.intro || '',
      payload.bodyHtml || '',
      payload.ctaLabel,
      payload.ctaUrl
    );

    // ── Recipients ──
    let recipients: string[] = [];
    if (payload.testEmail) {
      recipients = [payload.testEmail];
    } else {
      const { data: rows, error } = await admin
        .from('bookings')
        .select('client_email')
        .eq('status', 'confirmed')
        .not('client_email', 'is', null);
      if (error) throw error;
      const set = new Set<string>();
      for (const r of rows || []) {
        const email = (r as any).client_email?.trim().toLowerCase();
        if (email && !email.includes('@acsbeauty.app') && /\S+@\S+\.\S+/.test(email)) set.add(email);
      }
      recipients = Array.from(set);
    }

    if (payload.dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, recipients: recipients.length, preview_subject: payload.subject }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Throttled send (≤ 5 concurrent) to be gentle with Gmail quotas
    let sent = 0, failed = 0;
    const concurrency = 5;
    for (let i = 0; i < recipients.length; i += concurrency) {
      const batch = recipients.slice(i, i + concurrency);
      const results = await Promise.all(batch.map(r => sendOne(r, payload.subject, html, LOVABLE_API_KEY, GOOGLE_MAIL_API_KEY)));
      for (const ok of results) ok ? sent++ : failed++;
      // small breather between batches
      if (i + concurrency < recipients.length) await new Promise(r => setTimeout(r, 250));
    }

    console.log(`[campaign] done: sent=${sent}, failed=${failed}, total=${recipients.length}`);
    return new Response(JSON.stringify({ success: true, sent, failed, total: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-campaign-email] error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
