// accept-admin-invite: valida token (GET-like) ou confirma após auth (POST com action=confirm).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Expira convites antigos antes de validar
    await admin.rpc('expire_old_invites');

    const body = await req.json();
    const action = String(body?.action ?? 'validate');
    const token = String(body?.token ?? '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: invite, error: findErr } = await admin
      .from('admin_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!invite) {
      return new Response(JSON.stringify({ valid: false, error: 'Convite não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (invite.status !== 'pending') {
      return new Response(JSON.stringify({ valid: false, error: `Convite ${invite.status}` }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (new Date(invite.expires_at) < new Date()) {
      await admin.from('admin_invites').update({ status: 'expired' }).eq('id', invite.id);
      return new Response(JSON.stringify({ valid: false, error: 'Convite expirado' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'validate') {
      return new Response(JSON.stringify({
        valid: true,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // action === 'confirm': requer JWT do usuário recém-criado
    if (action === 'confirm') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const jwt = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(jwt);
      if (claimsErr || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const userId = claimsData.claims.sub as string;
      const userEmail = String(claimsData.claims.email ?? '').toLowerCase();

      if (userEmail !== invite.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Email da conta não corresponde ao convite' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Garante allowed_emails
      await admin.from('allowed_emails').upsert({ email: invite.email, role: invite.role }, { onConflict: 'email' });

      // Garante user_role (caso trigger handle_new_user não tenha rodado por race)
      await admin.from('user_roles').upsert({ user_id: userId, role: invite.role }, { onConflict: 'user_id,role' });

      // Garante staff_profile
      const { data: existingProfile } = await admin.from('staff_profiles').select('user_id').eq('user_id', userId).maybeSingle();
      if (!existingProfile) {
        await admin.from('staff_profiles').insert({ user_id: userId });
      }

      // Marca como aceito
      await admin.from('admin_invites').update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      }).eq('id', invite.id);

      return new Response(JSON.stringify({ success: true, role: invite.role }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[accept-admin-invite]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
