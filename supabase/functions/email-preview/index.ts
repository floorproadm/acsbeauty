// email-preview: retorna { subject, html } de cada template sem enviar.
// Usado pelo admin (CampaignsTab) para visualizar o email antes do disparo.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudioInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
}

async function loadStudio(supabase: any): Promise<{ studio: StudioInfo; birthdayOffer: string; prepDefault: string }> {
  const studio: StudioInfo = {
    name: 'ACS Beauty Studio',
    email: 'acsbeautystudio@gmail.com',
    address: '375 Chestnut St, 3rd Fl, Suite 3B, Newark, NJ',
    phone: '(732) 915-3430',
  };
  let birthdayOffer = 'Como presente nosso, você ganhou <strong>15% de desconto</strong> no seu próximo serviço durante o mês do seu aniversário. Use o código <strong>BDAY15</strong> ao agendar. 💛';
  let prepDefault = 'Chegue 5 minutos antes do horário. Evite cremes ou produtos pesados na área a ser tratada. Se tiver alguma alergia ou condição de pele, avise nossa equipe ao chegar.';
  try {
    const { data } = await supabase.from('studio_settings').select('key,value').in('key', ['studio_info', 'birthday_offer_text', 'prep_instructions']);
    for (const row of data || []) {
      if (row.key === 'studio_info' && row.value) {
        if (row.value.name) studio.name = row.value.name;
        if (row.value.email) studio.email = row.value.email;
        if (row.value.address) studio.address = row.value.address;
        if (row.value.phone) studio.phone = row.value.phone;
      }
      if (row.key === 'birthday_offer_text' && row.value) {
        birthdayOffer = typeof row.value === 'string' ? row.value : (row.value.text || birthdayOffer);
      }
      if (row.key === 'prep_instructions' && row.value) {
        if (typeof row.value === 'string') prepDefault = row.value;
        else if (row.value.default) prepDefault = row.value.default;
      }
    }
  } catch (e) { console.warn('[email-preview] settings load failed', e); }
  return { studio, birthdayOffer, prepDefault };
}

function shellHeader(studio: StudioInfo): string {
  return `
    <div style="text-align:center;border-bottom:1px solid #e8e0d6;padding-bottom:24px;margin-bottom:32px;">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;color:#3d3d38;letter-spacing:.5px;">${studio.name}</h1>
      <p style="margin:8px 0 0;color:#8b7355;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Where you become exactly who you already are</p>
    </div>`;
}

function shellFooter(studio: StudioInfo): string {
  return `
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e0d6;text-align:center;color:#8b7355;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 4px;"><strong>${studio.name}</strong></p>
      <p style="margin:0;">${studio.address}</p>
      <p style="margin:4px 0 0;">${studio.phone} · ${studio.email}</p>
    </div>`;
}

function wrap(inner: string): string {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f0eb;padding:0;margin:0;">
    <div style="max-width:600px;margin:0 auto;padding:40px 32px;background:#fff;">
      ${inner}
    </div>
  </div>`;
}

function birthdayTpl(name: string, offer: string, studio: StudioInfo) {
  const first = (name || '').split(' ')[0] || 'querida';
  const subject = `Feliz Aniversário, ${first}! 🎂 Um presente especial da ACS Beauty`;
  const inner = `${shellHeader(studio)}
    <div style="background:linear-gradient(135deg,#b76e79 0%,#d4a574 50%,#8b7355 100%);color:#fff;padding:48px 24px;border-radius:14px;text-align:center;margin:0 0 28px;box-shadow:0 8px 24px rgba(139,115,85,.25);">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:.9;">Hoje é o seu dia</p>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:42px;margin:0;font-weight:300;letter-spacing:1px;">Feliz Aniversário! 🎂</p>
      <p style="margin:14px 0 0;font-size:18px;opacity:.95;">${first}</p>
    </div>
    <p style="font-size:16px;line-height:1.7;color:#3d3d38;margin:0 0 20px;">
      Que esse novo ciclo seja repleto de momentos para você. Aqui na ${studio.name} acreditamos que cuidar de você é uma forma de celebração — e queremos fazer parte disso.
    </p>
    <div style="background:#faf5f0;border-left:3px solid #b76e79;padding:18px 22px;margin:0 0 28px;border-radius:6px;">
      <p style="margin:0;font-size:15px;line-height:1.7;color:#3d3d38;">${offer}</p>
    </div>
    <div style="text-align:center;margin:8px 0 32px;">
      <a href="https://acsbeautystudio.com/portal" style="display:inline-block;padding:14px 32px;background:#3d3d38;color:#f5f0eb;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Agendar meu presente</a>
    </div>
    ${shellFooter(studio)}`;
  return { subject, html: wrap(inner) };
}

function prepTpl(name: string, service: string, whenStr: string, prep: string, studio: StudioInfo) {
  const first = (name || '').split(' ')[0] || '';
  const subject = `Seu atendimento é amanhã — ${service} 💅`;
  const inner = `${shellHeader(studio)}
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 12px;color:#3d3d38;">Seu atendimento é amanhã 💅</h2>
    <p style="font-size:15px;line-height:1.7;color:#3d3d38;margin:0 0 24px;">
      ${first ? `Oi, ${first}! ` : ''}Está chegando o seu momento ACS. Aqui está tudo o que você precisa saber para se preparar:
    </p>
    <table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;padding:8px;margin:0 0 24px;">
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">Serviço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${service}</td></tr>
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Data e hora</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${whenStr}</td></tr>
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Endereço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${studio.address}</td></tr>
    </table>
    <div style="background:#faf5f0;border-left:3px solid #b76e79;padding:18px 22px;margin:0 0 24px;border-radius:6px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#3d3d38;letter-spacing:.5px;text-transform:uppercase;">Como se preparar</p>
      <div style="font-size:14px;line-height:1.7;color:#3d3d38;">${prep}</div>
    </div>
    <p style="font-size:13px;color:#8b7355;line-height:1.6;margin:24px 0 0;">
      Precisa remarcar? Chame no WhatsApp <a href="https://wa.me/1${studio.phone.replace(/\D/g,'')}" style="color:#8b7355;">${studio.phone}</a> com pelo menos 24h de antecedência.
    </p>
    ${shellFooter(studio)}`;
  return { subject, html: wrap(inner) };
}

function bookingReminderTpl(name: string, service: string, date: string, time: string, studio: StudioInfo) {
  const first = (name || '').split(' ')[0] || '';
  const subject = `⏰ Lembrete: seu agendamento amanhã — ${service}`;
  const details = `<table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;margin:0 0 24px;">
    <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">Serviço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${service}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Data</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${date}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Horário</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${time}</td></tr>
    <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Endereço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${studio.address}</td></tr>
  </table>`;
  const inner = `${shellHeader(studio)}
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">${first ? first + ', s' : 'S'}eu agendamento é amanhã!</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3d38;margin:0 0 24px;">Passando para lembrar do seu agendamento. Estamos te esperando:</p>
    ${details}
    <p style="font-size:13px;color:#8b7355;line-height:1.6;margin:0;">Em caso de imprevistos, nos chame no WhatsApp <a href="https://wa.me/1${studio.phone.replace(/\D/g,'')}" style="color:#8b7355;">${studio.phone}</a> o quanto antes.</p>
    ${shellFooter(studio)}`;
  return { subject, html: wrap(inner) };
}

function rescheduleTpl(name: string, service: string, date: string, time: string, studio: StudioInfo) {
  const first = (name || '').split(' ')[0] || '';
  const subject = `Seu agendamento foi remarcado 📅`;
  const inner = `${shellHeader(studio)}
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 16px;color:#3d3d38;">Seu agendamento foi remarcado 📅</h2>
    <p style="font-size:15px;line-height:1.6;color:#3d3d38;margin:0 0 24px;">${first ? `Oi, ${first}! ` : ''}A nova data está confirmada na agenda:</p>
    <table style="width:100%;border-collapse:collapse;background:#f5f0eb;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;width:120px;">Serviço</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${service}</td></tr>
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Nova data</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${date}</td></tr>
      <tr><td style="padding:12px 16px;color:#8b7355;font-size:13px;">Horário</td><td style="padding:12px 16px;color:#3d3d38;font-size:14px;font-weight:500;">${time}</td></tr>
    </table>
    ${shellFooter(studio)}`;
  return { subject, html: wrap(inner) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { studio, birthdayOffer, prepDefault } = await loadStudio(supabase);

    const body = await req.json().catch(() => ({}));
    const template = (body?.template || 'birthday') as string;
    const d = body?.sampleData || {};
    const name = d.name || 'Maria Silva';
    const service = d.service || 'Hidratação profunda';
    const date = d.date || 'Sexta, 06/06/2026';
    const time = d.time || '14:30';
    const whenStr = d.whenStr || `${date} ${time}`;

    let out: { subject: string; html: string };
    switch (template) {
      case 'birthday':
        out = birthdayTpl(name, birthdayOffer, studio); break;
      case 'prep':
      case 'prep-reminder':
        out = prepTpl(name, service, whenStr, prepDefault, studio); break;
      case 'booking-reminder':
        out = bookingReminderTpl(name, service, date, time, studio); break;
      case 'reschedule':
        out = rescheduleTpl(name, service, date, time, studio); break;
      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown template: ${template}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Apply admin overrides from studio_settings (no redeploy needed)
    try {
      const { data: ovRow } = await supabase
        .from('studio_settings')
        .select('value')
        .eq('key', 'email_templates_overrides')
        .maybeSingle();
      const ov = (ovRow as any)?.value?.[template] || (ovRow as any)?.value?.[template === 'prep-reminder' ? 'prep' : template];
      if (ov) {
        const replace = (s: string) => s
          .replace(/\{\{\s*name\s*\}\}/g, name)
          .replace(/\{\{\s*service\s*\}\}/g, service)
          .replace(/\{\{\s*date\s*\}\}/g, date)
          .replace(/\{\{\s*time\s*\}\}/g, time)
          .replace(/\{\{\s*whenStr\s*\}\}/g, whenStr);
        if (typeof ov.subject === 'string' && ov.subject.length) out.subject = replace(ov.subject);
        if (typeof ov.html === 'string' && ov.html.length) out.html = replace(ov.html);
      }
    } catch (e) { console.warn('[email-preview] overrides load failed', e); }


    return new Response(JSON.stringify({ success: true, ...out, from: `${studio.name} <${studio.email}>` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
