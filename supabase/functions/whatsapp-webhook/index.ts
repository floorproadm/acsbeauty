// WhatsApp Cloud API Webhook
// Receives inbound messages and delivery status updates from Meta
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ─── GET: webhook verification handshake from Meta ────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && VERIFY_TOKEN) {
      console.log("[whatsapp-webhook] Verified successfully");
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ─── POST: incoming events ────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("[whatsapp-webhook] Payload:", JSON.stringify(payload).slice(0, 500));

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const entries = payload.entry ?? [];
    for (const entry of entries) {
      const changes = entry.changes ?? [];
      for (const change of changes) {
        const value = change.value ?? {};

        // ── Inbound messages ────────────────────────────────────
        const messages = value.messages ?? [];
        for (const msg of messages) {
          const from: string = msg.from; // E.164 sem '+'
          const externalId = msg.id;
          const type = msg.type;
          let body: string | null = null;
          let mediaUrl: string | null = null;
          let mediaType: string | null = null;

          if (type === "text") body = msg.text?.body ?? null;
          else if (type === "image") {
            mediaType = "image";
            body = msg.image?.caption ?? null;
          } else if (type === "audio") mediaType = "audio";
          else if (type === "video") {
            mediaType = "video";
            body = msg.video?.caption ?? null;
          } else if (type === "document") {
            mediaType = "document";
            body = msg.document?.caption ?? msg.document?.filename ?? null;
          } else if (type === "interactive") {
            body =
              msg.interactive?.button_reply?.title ??
              msg.interactive?.list_reply?.title ??
              null;
          } else {
            body = `[${type}]`;
          }

          // Find or create conversation
          const { data: existingConv } = await supabase
            .from("conversations")
            .select("id, client_id")
            .eq("channel", "whatsapp")
            .eq("external_id", from)
            .maybeSingle();

          let conversationId = existingConv?.id;

          if (!conversationId) {
            // Try to match a client by phone
            const { data: client } = await supabase
              .from("clients")
              .select("id, name")
              .or(`phone.ilike.%${from.slice(-10)}%`)
              .limit(1)
              .maybeSingle();

            const profile = value.contacts?.[0]?.profile;
            const subject = client?.name ?? profile?.name ?? `+${from}`;

            const { data: newConv, error: convErr } = await supabase
              .from("conversations")
              .insert({
                channel: "whatsapp",
                external_id: from,
                client_id: client?.id ?? null,
                status: "open",
                subject,
              })
              .select("id")
              .single();

            if (convErr) {
              console.error("[whatsapp-webhook] Conv insert error:", convErr);
              continue;
            }
            conversationId = newConv.id;
          }

          // Insert message
          const { error: msgErr } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            direction: "in",
            channel: "whatsapp",
            body,
            media_url: mediaUrl,
            media_type: mediaType,
            external_message_id: externalId,
            delivery_status: "received",
            metadata: { raw_type: type },
          });

          if (msgErr) console.error("[whatsapp-webhook] Msg insert error:", msgErr);
        }

        // ── Delivery / read status updates ──────────────────────
        const statuses = value.statuses ?? [];
        for (const st of statuses) {
          const externalId = st.id;
          const status = st.status; // sent | delivered | read | failed
          const errorMessage = st.errors?.[0]?.message ?? null;

          await supabase
            .from("messages")
            .update({
              delivery_status: status,
              error_message: errorMessage,
            })
            .eq("external_message_id", externalId);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[whatsapp-webhook] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
