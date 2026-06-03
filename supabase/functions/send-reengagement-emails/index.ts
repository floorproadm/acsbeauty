// send-reengagement-emails: segments confirmed-booking clients by inactivity and sends targeted emails.
// Segments: Occasional (60-89d), Absent (90-179d), Inactive (180+d).
// Deduped via reengagement_sent table (90-day cooldown per email+segment).
// Auth: admin_owner or staff only.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';
let FROM = 'ACS Beauty Studio <acsbeautystudio@gmail.com>';
let STUDIO_ADDRESS = '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ';
let STUDIO_PHONE = '(732) 915-3430';
const BOOK_URL = 'https://acsbeautystudio.com/portal';
let COOLDOWN_DAYS = 90;
let SEGMENT_DAYS = { occasional: 60, absent: 90, inactive: 180 };
let SETTINGS_LOADED = false;

async function loadStudioSettings(): Promise<void> {
  if (SETTINGS_LOADED) return;
  SETTINGS_LOADED = true;
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const res = await fetch(`${url}/rest/v1/studio_settings?key=in.(studio_info,email_config)&select=key,value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return;
    const rows = await res.json();
    for (const r of rows) {
      if (r.key === 'studio_info') {
        const v = r.value || {};
        if (v.email) FROM = `${v.name || 'ACS Beauty Studio'} <${v.email}>`;
        if (v.address) STUDIO_ADDRESS = v.address;
        if (v.phone) STUDIO_PHONE = v.phone;
      } else if (r.key === 'email_config') {
        const v = r.value || {};
        if (typeof v.reengagement_cooldown_days === 'number') COOLDOWN_DAYS = v.reengagement_cooldown_days;
        if (v.segments) {
          SEGMENT_DAYS = {
            occasional: v.segments.occasional_days ?? SEGMENT_DAYS.occasional,
            absent: v.segments.absent_days ?? SEGMENT_DAYS.absent,
            inactive: v.segments.inactive_days ?? SEGMENT_DAYS.inactive,
          };
        }
      }
    }
  } catch (e) { console.warn('[send-reengagement-emails] settings load failed', e); }
}

type Segment = 'occasional' | 'absent' | 'inactive';

interface SegmentConfig {
  label: string;
  subject: (firstName: string) => string;
  title: (firstName: string) => string;
  intro: string;
  body: string;
  ctaLabel: string;
}

const SEGMENTS: Record<Segment, SegmentConfig> = {
  occasional: {
    label: 'Occasional (60-89d)',
    subject: (n) => `${n ? n + ', s' : 'S'}entimos sua falta ✨`,
    title: (n) => `${n ? n + ', q' : 'Q'}ue tal um momento para você?`,
    intro: 'Faz alguns meses desde sua última visita e queríamos te lembrar que seu lugar continua reservado por aqui.',
    body: `<p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 16px;">
      Que tal reservar um tempinho para se cuidar? Nossa agenda está aberta e adoraríamos te receber novamente.
    </p>`,
    ctaLabel: 'Ver horários disponíveis',
  },
  absent: {
    label: 'Absent (90-179d)',
    subject: (n) => `${n ? n + ', t' : 'T'}emos novidades esperando por você 💛`,
    title: (n) => `${n ? n + ', v' : 'V'}olte para um momento só seu`,
    intro: 'Já se passaram alguns meses e queríamos te convidar de volta — com tudo que preparamos por aqui desde a sua última visita.',
    body: `<p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 16px;">
      Novas técnicas, novos cuidados e a mesma dedicação de sempre. Reagendar agora é simples — escolha o horário que cabe na sua rotina.
    </p>`,
    ctaLabel: 'Agendar minha volta',
  },
  inactive: {
    label: 'Inactive (180+d)',
    subject: (n) => `${n ? n + ', q' : 'Q'}ueremos te receber de volta 💝`,
    title: (n) => `${n ? n + ', f' : 'F'}az tempo… e a porta continua aberta`,
    intro: 'Faz um bom tempo desde sua última visita, e queríamos te dizer: sempre que quiser voltar, estaremos aqui para receber você com o mesmo carinho de sempre.',
    body: `<p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 16px;">
      Como gesto de carinho pelo seu retorno, fale com a Ane Caroline pelo WhatsApp e mencione este email — temos uma surpresa especial reservada para a sua próxima visita.
    </p>`,
    ctaLabel: 'Quero voltar',
  },
};

function classify(daysSince: number): Segment | null {
  if (daysSince >= 180) return 'inactive';
  if (daysSince >= 90) return 'absent';
  if (daysSince >= 60) return 'occasional';
  return null;
}

function emailHtml(seg: SegmentConfig, firstName: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">ACS Beauty Studio</h1>
        <p style="margin:8px 0 0;color:#8b7355;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Where you become exactly who you already are</p>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;margin:0 0 18px;color:#3d3d38;">${seg.title(firstName)}</h2>
      <p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 20px;">${seg.intro}</p>
      ${seg.body}
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="${BOOK_URL}" style="display:inline-block;padding:14px 32px;background:#3d3d38;color:#f5f0eb;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">${seg.ctaLabel}</a>
      </div>
      <p style="font-size:13px;color:#8b7355;line-height:1.6;margin:24px 0 0;text-align:center;">
        Prefere WhatsApp? <a href="https://wa.me/1${STUDIO_PHONE.replace(/\D/g, '')}" style="color:#b76e79;">${STUDIO_PHONE}</a>
      </p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 4px;"><strong>ACS Beauty Studio</strong></p>
        <p style="margin:0;">${STUDIO_ADDRESS}</p>
        <p style="margin:4px 0 0;">${STUDIO_PHONE} · acsbeautystudio@gmail.com</p>
      </div>
    </div>
  </div>`;
}

function rfc2822ToBase64Url(to: string, subject: string, html: string): string {
  const msg = [
    `From: ${FROM}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0', 'Content-Type: text/html; charset="UTF-8"', '', html,
  ].join('\r\n');
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(to: string, subject: string, html: string): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
  if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) return false;
  try {
    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rfc2822ToBase64Url(to, subject, html) }),
    });
    if (!resp.ok) {
      console.error(`[reengagement] send failed [${resp.status}]:`, await resp.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[reengagement] send error:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    await loadStudioSettings();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const isAuthorized = roles?.some((r) => r.role === 'admin_owner' || r.role === 'staff');
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = !!body.dryRun;
    const filterSegment: Segment | undefined = body.segment;
    const testEmail: string | undefined = body.testEmail;

    // Fetch all confirmed bookings (max last visit per email)
    const { data: bookings, error: bErr } = await admin
      .from('bookings')
      .select('client_email, client_name, start_time, status')
      .eq('status', 'confirmed')
      .order('start_time', { ascending: false })
      .limit(10000);
    if (bErr) throw bErr;

    const lastByEmail = new Map<string, { name: string; start: string }>();
    for (const b of bookings || []) {
      const email = (b.client_email || '').toLowerCase().trim();
      if (!email || email.includes('@acsbeauty.app')) continue;
      if (!lastByEmail.has(email)) {
        lastByEmail.set(email, { name: b.client_name || '', start: b.start_time });
      }
    }

    const now = Date.now();
    const candidates: Array<{ email: string; name: string; segment: Segment }> = [];
    for (const [email, info] of lastByEmail.entries()) {
      const days = Math.floor((now - new Date(info.start).getTime()) / 86400000);
      const seg = classify(days);
      if (!seg) continue;
      if (filterSegment && seg !== filterSegment) continue;
      candidates.push({ email, name: info.name, segment: seg });
    }

    // Cooldown check
    const cooldownSince = new Date(now - COOLDOWN_DAYS * 86400000).toISOString();
    const { data: recent } = await admin
      .from('reengagement_sent')
      .select('client_email, segment')
      .gte('sent_at', cooldownSince);
    const recentSet = new Set((recent || []).map((r) => `${r.client_email.toLowerCase()}|${r.segment}`));
    const eligible = candidates.filter((c) => !recentSet.has(`${c.email}|${c.segment}`));

    // Audience preview
    const audience = {
      occasional: eligible.filter((c) => c.segment === 'occasional').length,
      absent: eligible.filter((c) => c.segment === 'absent').length,
      inactive: eligible.filter((c) => c.segment === 'inactive').length,
      total: eligible.length,
    };

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, audience }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test email path: send all 3 segments to one address
    if (testEmail) {
      const sent: string[] = [];
      for (const seg of (filterSegment ? [filterSegment] : ['occasional','absent','inactive'] as Segment[])) {
        const cfg = SEGMENTS[seg];
        const ok = await sendGmail(testEmail, `[TESTE ${cfg.label}] ${cfg.subject('Cliente')}`, emailHtml(cfg, 'Cliente'));
        if (ok) sent.push(seg);
      }
      return new Response(JSON.stringify({ success: true, testEmail, segments_sent: sent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Throttled send: 5 concurrent, 250ms gap between batches
    let sent = 0, failed = 0;
    const logRows: Array<{ client_email: string; segment: Segment }> = [];
    const batchSize = 5;
    for (let i = 0; i < eligible.length; i += batchSize) {
      const batch = eligible.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(async (c) => {
        const cfg = SEGMENTS[c.segment];
        const first = (c.name || '').split(' ')[0] || '';
        const ok = await sendGmail(c.email, cfg.subject(first), emailHtml(cfg, first));
        if (ok) logRows.push({ client_email: c.email, segment: c.segment });
        return ok;
      }));
      sent += results.filter(Boolean).length;
      failed += results.filter((r) => !r).length;
      if (i + batchSize < eligible.length) await new Promise((r) => setTimeout(r, 250));
    }

    if (logRows.length) {
      await admin.from('reengagement_sent').insert(logRows);
    }

    return new Response(JSON.stringify({ success: true, audience, sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[reengagement] error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
