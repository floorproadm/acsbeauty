// client-password-reset: email-based password reset for client accounts (phone identifier).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1';

function successResponse(body: any) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status });
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11);
}

function formatCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, 6);
}

function rfc2822ToBase64Url(from: string, to: string, subject: string, html: string): string {
  const msg = [
    `From: ${from}`,
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

async function sendResetEmail(to: string, code: string, studioName: string, fromEmail: string, lovableKey: string, googleKey: string) {
  const subject = `${studioName} — código de redefinição de senha`;
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">${studioName}</h1>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">Redefinição de senha</h2>
      <p style="font-size:15px;line-height:1.6;color:#3d3d38;margin:0 0 24px;">Recebemos uma solicitação para redefinir sua senha. Use o código abaixo no app:</p>
      <div style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:600;color:#3d3d38;background:#f5f0eb;padding:16px 24px;border-radius:8px;">${code}</span>
      </div>
      <p style="font-size:13px;color:#8b7355;line-height:1.6;margin:0 0 24px;">O código expira em 15 minutos. Se você não solicitou, ignore este email.</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
        <p style="margin:0;"><strong>${studioName}</strong></p>
      </div>
    </div>
  </div>`;

  const raw = rfc2822ToBase64Url(fromEmail, to, subject, html);

  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': googleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    throw new Error(`Email gateway failed: ${res.status} ${text}`);
  }
}

async function loadStudioSettings(supabaseAdmin: any) {
  const defaultSettings = {
    name: 'ACS Beauty Studio',
    email: 'acsbeautystudio@gmail.com',
  };
  try {
    const { data, error } = await supabaseAdmin
      .from('studio_settings')
      .select('value')
      .eq('key', 'studio_info')
      .single();
    if (error || !data?.value) return defaultSettings;
    const v = data.value;
    return {
      name: v.name || defaultSettings.name,
      email: v.email || defaultSettings.email,
    };
  } catch {
    return defaultSettings;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return errorResponse('Server configuration error', 500);
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const action = body?.action;
  const phone = normalizePhone(body?.phone || '');

  if (!phone || phone.length < 10) {
    return errorResponse(isPt(body) ? 'Telefone inválido' : 'Invalid phone');
  }

  if (action === 'request') {
    // Find client by phone
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, name')
      .eq('phone', phone)
      .limit(1);

    if (clientError || !clients || clients.length === 0) {
      // Generic message to avoid phone enumeration
      return successResponse({ message: 'Se houver uma conta com esse telefone, enviaremos um código por email.' });
    }

    const client = clients[0];
    if (!client.email) {
      return successResponse({ message: 'Se houver uma conta com esse telefone, enviaremos um código por email.' });
    }

    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous codes for this phone
    await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('phone', phone)
      .eq('used', false);

    // Insert new code
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({
        client_id: client.id,
        phone,
        email: client.email,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('Error inserting reset code', insertError);
      return errorResponse('Erro ao gerar código', 500);
    }

    // Send email
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const googleKey = Deno.env.get('GOOGLE_MAIL_API_KEY');
    if (!apiKey || !googleKey) {
      console.error('Email keys not set');
      return errorResponse('Email service not configured', 500);
    }

    const settings = await loadStudioSettings(supabaseAdmin);
    const fromEmail = `${settings.name} <${settings.email}>`;

    try {
      await sendResetEmail(client.email, code, settings.name, fromEmail, apiKey, googleKey);
    } catch (err) {
      console.error('Failed to send reset email', err);
      return errorResponse('Erro ao enviar email', 500);
    }

    return successResponse({ message: 'Código enviado por email.' });
  }

  if (action === 'confirm') {
    const code = formatCode(body?.code || '');
    const newPassword = body?.new_password || '';

    if (code.length !== 6) {
      return errorResponse('Código inválido');
    }
    if (newPassword.length < 6) {
      return errorResponse('Senha deve ter no mínimo 6 caracteres');
    }

    // Find valid code
    const { data: codes, error: codeError } = await supabaseAdmin
      .from('password_reset_codes')
      .select('id, client_id, used, expires_at')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeError || !codes || codes.length === 0) {
      return errorResponse('Código inválido ou expirado');
    }

    const resetCode = codes[0];

    // Find auth user by fake email derived from phone
    const email = `client_${phone}@acsbeauty.app`;
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (userError) {
      console.error('Error listing users', userError);
      return errorResponse('Erro ao localizar usuário', 500);
    }

    const authUser = users.users.find((u: any) => u.email === email);
    if (!authUser) {
      return errorResponse('Usuário não encontrado');
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password', updateError);
      return errorResponse('Erro ao redefinir senha', 500);
    }

    // Mark code used
    await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', resetCode.id);

    return successResponse({ message: 'Senha redefinida com sucesso.' });
  }

  return errorResponse('Ação inválida');
});

function isPt(body: any): boolean {
  return (body?.language || 'pt') === 'pt';
}
