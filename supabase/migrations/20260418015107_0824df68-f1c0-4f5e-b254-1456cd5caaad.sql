
-- ── Tabela: conversations ─────────────────────────────────────────
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','site','instagram','manual','email')),
  external_id text NULL, -- telefone E.164 ou email
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','closed','snoozed')),
  assigned_to uuid NULL, -- staff user_id
  subject text NULL,
  last_message_at timestamptz NULL,
  last_message_preview text NULL,
  unread_count integer NOT NULL DEFAULT 0,
  ai_summary text NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, external_id)
);

CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_channel ON public.conversations(channel);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC NULLS LAST);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all conversations"
  ON public.conversations FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can view conversations"
  ON public.conversations FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can update conversations"
  ON public.conversations FOR UPDATE
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Tabela: messages ──────────────────────────────────────────────
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  channel text NOT NULL,
  body text NULL,
  media_url text NULL,
  media_type text NULL,
  template_name text NULL,
  template_variables jsonb NULL,
  sender_id uuid NULL, -- staff user_id se direction='out' e foi humano
  external_message_id text NULL, -- id da Meta/WhatsApp
  delivery_status text NULL CHECK (delivery_status IN ('sent','delivered','read','failed','received')),
  error_message text NULL,
  ai_generated boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_external_id ON public.messages(external_message_id);
CREATE INDEX idx_messages_direction ON public.messages(direction);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all messages"
  ON public.messages FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can view messages"
  ON public.messages FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

-- Trigger: ao inserir mensagem, atualiza preview e last_message_at na conversa
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.body, '[mídia]'), 200),
    unread_count = CASE WHEN NEW.direction = 'in' THEN unread_count + 1 ELSE unread_count END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ── Tabela: whatsapp_templates ────────────────────────────────────
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR' CHECK (language IN ('pt_BR','en_US')),
  category text NOT NULL DEFAULT 'utility' CHECK (category IN ('marketing','utility','authentication')),
  body_text text NOT NULL,
  header_text text NULL,
  footer_text text NULL,
  variables jsonb DEFAULT '[]'::jsonb, -- ex: [{"name":"client_name","example":"Maria"}]
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved','pending','rejected','draft')),
  meta_template_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, language)
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates"
  ON public.whatsapp_templates FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can view approved templates"
  ON public.whatsapp_templates FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Tabela: automation_rules ──────────────────────────────────────
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_event text NOT NULL CHECK (trigger_event IN (
    'booking_confirmed','booking_cancelled','booking_rescheduled',
    'booking_reminder_24h','contact_submitted','whatsapp_click','lead_inactive'
  )),
  conditions jsonb DEFAULT '{}'::jsonb,
  action_type text NOT NULL DEFAULT 'send_whatsapp_template',
  template_name text NULL,
  template_language text DEFAULT 'pt_BR',
  recipient_type text NOT NULL DEFAULT 'client' CHECK (recipient_type IN ('client','admin','both')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation rules"
  ON public.automation_rules FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can view automation rules"
  ON public.automation_rules FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE TRIGGER trg_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Realtime ──────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
