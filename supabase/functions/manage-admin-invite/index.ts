// manage-admin-invite: revoke ou resend. Apenas admin_owner.
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
  return {
    subject: `🎉 Lembrete: convite para o ACS Beauty OS`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f5f0eb;color:#3d3d38;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:26px;">Convite ainda ativo</h1>
      <p>${inviterName} reenviou o convite para o painel ACS como <strong>${roleLabel}</strong>.</p>
      <a href="${link}" style="display:inline-block;padding:14px 28px;background:#8b7355;color:#fff;text-decoration:none;border-radius:6px;">Aceitar convite</a>
      <p style="font-size:12px;color:#8b7355;margin-top:24px;word-break:break-all;">Link: ${link}</p>
    </div>`,
  };
}

function rfc2822ToBase64Url(to: string, subject: string, html: string): string {
  const msg = [
    `From: ${FROM}`, `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0', 'Content-Type: text/html; charset="UTF-8"', '', html,
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
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const jwt = authHeader.replace('Bearer ', '');
    const { data: claimsData } = await userClient.auth.getClaims(jwt);
    if (!claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin_owner' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const action = String(body?.action ?? '');
    const inviteId = String(body?.invite_id ?? '');
    if (!inviteId) {
      return new Response(JSON.stringify({ error: 'invite_id obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: invite, error: findErr } = await admin.from('admin_invites').select('*').eq('id', inviteId).maybeSingle();
    if (findErr) throw findErr;
    if (!invite) {
      return new Response(JSON.stringify({ error: 'Convite não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'revoke') {
      await admin.from('admin_invites').update({ status: 'revoked' }).eq('id', inviteId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'resend') {
      // Renova token + expiração se já expirou
      let newToken = invite.token;
      const updates: Record<string, unknown> = {};
      if (invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
        newToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
        updates.token = newToken;
        updates.status = 'pending';
        updates.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (Object.keys(updates).length > 0) {
        await admin.from('admin_invites').update(updates).eq('id', inviteId);
      }

      const { data: inviter } = await admin.from('staff_profiles').select('name').eq('user_id', userId).maybeSingle();
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY');
      if (LOVABLE_API_KEY && GOOGLE_MAIL_API_KEY) {
        const { subject, html } = buildEmail(invite.email, invite.role, newToken, inviter?.name ?? 'A equipe ACS');
        const raw = rfc2822ToBase64Url(invite.email, subject, html);
        const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });
        if (!resp.ok) console.error(`[manage-admin-invite] gmail [${resp.status}]: ${await resp.text()}`);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[manage-admin-invite]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
