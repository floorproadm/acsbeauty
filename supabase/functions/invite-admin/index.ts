// invite-admin: cria convite + envia email via Gmail gateway. Apenas admin_owner.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';
const FROM = 'ACS Beauty OS <acsbeautystudio@gmail.com>';
const APP_URL = 'https://acsbeautystudio.com';

function buildEmail(to: string, role: string, token: string, inviterName: string) {
  const link = `${APP_URL}/admin/accept-invite?token=${encodeURIComponent(token)}`;
  const roleLabel = role === 'admin_owner' ? 'Administrador' : role === 'marketing' ? 'Marketing' : 'Staff';
  const subject = `🎉 Você foi convidado para o ACS Beauty OS`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f5f0eb;color:#3d3d38;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:26px;margin:0 0 16px;">Você foi convidado(a)</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        ${inviterName} te convidou para acessar o painel administrativo do <strong>ACS Beauty Studio</strong> com o papel de <strong>${roleLabel}</strong>.
      </p>
      <p style="font-size:14px;color:#8b7355;margin:0 0 24px;">Este convite expira em 7 dias.</p>
      <a href="${link}" style="display:inline-block;padding:14px 28px;background:#8b7355;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Aceitar convite</a>
      <p style="margin-top:24px;font-size:12px;color:#8b7355;word-break:break-all;">Ou copie este link: ${link}</p>
      <hr style="border:none;border-top:1px solid #e0d8cc;margin:32px 0;" />
      <p style="font-size:11px;color:#8b7355;">ACS Beauty OS · Newark, NJ</p>
    </div>`;
  return { subject, html };
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
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin_owner' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const role = String(body?.role ?? 'staff');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!['admin_owner', 'staff', 'marketing'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Role inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cancela convite pendente anterior (idempotente)
    await admin.from('admin_invites').update({ status: 'revoked' }).eq('email', email).eq('status', 'pending');

    const newToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const { data: invite, error: insertErr } = await admin
      .from('admin_invites')
      .insert({ email, role, token: newToken, invited_by: userId })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // Nome do remetente
    const { data: inviter } = await admin.from('staff_profiles').select('name').eq('user_id', userId).maybeSingle();
    const inviterName = inviter?.name ?? 'A equipe ACS';

    // Envia email
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
    if (LOVABLE_API_KEY && GOOGLE_MAIL_API_KEY) {
      const { subject, html } = buildEmail(email, role, newToken, inviterName);
      const raw = rfc2822ToBase64Url(email, subject, html);
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
        const txt = await resp.text();
        console.error(`[invite-admin] gmail send failed [${resp.status}]: ${txt}`);
      }
    }

    return new Response(JSON.stringify({ success: true, invite }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[invite-admin]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
