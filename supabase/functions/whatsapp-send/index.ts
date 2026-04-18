// WhatsApp Cloud API Sender
// Sends template or free-text messages to a recipient via Meta Cloud API
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SendRequest {
  to: string; // E.164 phone (with or without +)
  type?: "text" | "template";
  body?: string; // for type=text
  template_name?: string; // for type=template
  template_language?: string; // pt_BR | en_US
  template_variables?: string[]; // ordered values to fill {{1}} {{2}} etc
  conversation_id?: string; // optional - if known, links msg to existing conv
  client_id?: string;
  sender_id?: string; // staff user_id
  ai_generated?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = (await req.json()) as SendRequest;

    if (!payload.to) {
      return new Response(JSON.stringify({ error: "Missing 'to'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const to = payload.to.replace(/\D/g, "");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // ── Build Meta payload ─────────────────────────────────────
    let metaBody: Record<string, unknown>;
    if (payload.type === "template" && payload.template_name) {
      const components: unknown[] = [];
      if (payload.template_variables?.length) {
        components.push({
          type: "body",
          parameters: payload.template_variables.map((v) => ({
            type: "text",
            text: v,
          })),
        });
      }
      metaBody = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: payload.template_name,
          language: { code: payload.template_language ?? "pt_BR" },
          components,
        },
      };
    } else {
      // Free text (only allowed inside 24h window)
      metaBody = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: payload.body ?? "" },
      };
    }

    // ── Find / create conversation ─────────────────────────────
    let conversationId = payload.conversation_id;
    if (!conversationId) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("channel", "whatsapp")
        .eq("external_id", to)
        .maybeSingle();

      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            channel: "whatsapp",
            external_id: to,
            client_id: payload.client_id ?? null,
            status: "open",
            subject: `+${to}`,
          })
          .select("id")
          .single();
        if (convErr) throw convErr;
        conversationId = newConv.id;
      }
    }

    // ── Send to Meta (skip if creds missing — log only) ────────
    let externalMessageId: string | null = null;
    let deliveryStatus: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.warn("[whatsapp-send] Meta credentials missing — message logged but NOT sent");
      deliveryStatus = "failed";
      errorMessage = "WhatsApp Cloud API credentials not configured";
    } else {
      const metaUrl = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
      const resp = await fetch(metaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaBody),
      });
      const metaResp = await resp.json();
      console.log("[whatsapp-send] Meta response:", JSON.stringify(metaResp));

      if (!resp.ok) {
        deliveryStatus = "failed";
        errorMessage = metaResp.error?.message ?? `HTTP ${resp.status}`;
      } else {
        externalMessageId = metaResp.messages?.[0]?.id ?? null;
      }
    }

    // ── Log to messages table ──────────────────────────────────
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      direction: "out",
      channel: "whatsapp",
      body:
        payload.type === "template"
          ? `[template:${payload.template_name}] ${payload.template_variables?.join(" | ") ?? ""}`
          : payload.body ?? null,
      template_name: payload.type === "template" ? payload.template_name : null,
      template_variables: payload.template_variables
        ? { values: payload.template_variables }
        : null,
      sender_id: payload.sender_id ?? null,
      external_message_id: externalMessageId,
      delivery_status: deliveryStatus,
      error_message: errorMessage,
      ai_generated: payload.ai_generated ?? false,
    });

    if (msgErr) console.error("[whatsapp-send] Log error:", msgErr);

    return new Response(
      JSON.stringify({
        ok: deliveryStatus === "sent",
        conversation_id: conversationId,
        external_message_id: externalMessageId,
        error: errorMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[whatsapp-send] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
