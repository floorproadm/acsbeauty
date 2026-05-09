
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(read_at) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view notifications"
ON public.notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can update notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin and staff can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Trigger: new booking (requested) and status changes
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_type TEXT;
  v_when TEXT;
BEGIN
  v_when := to_char(NEW.start_time AT TIME ZONE 'America/New_York', 'DD/MM HH24:MI');
  v_body := COALESCE(NEW.client_name, 'Cliente') || ' • ' || COALESCE(NEW.service_name, 'Serviço') || ' • ' || v_when;

  IF TG_OP = 'INSERT' AND NEW.status = 'requested' THEN
    v_type := 'booking_requested';
    v_title := '🆕 Novo agendamento solicitado';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND COALESCE(OLD.status,'') <> 'confirmed' THEN
    v_type := 'booking_confirmed';
    v_title := '✅ Agendamento confirmado';
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND COALESCE(OLD.status,'') <> 'cancelled' THEN
    v_type := 'booking_cancelled';
    v_title := '❌ Agendamento cancelado';
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    v_type := 'booking_confirmed';
    v_title := '✅ Novo agendamento confirmado';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (type, title, body, link, meta)
  VALUES (v_type, v_title, v_body, '/admin?tab=bookings&id=' || NEW.id,
          jsonb_build_object('booking_id', NEW.id, 'client_name', NEW.client_name));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

CREATE TRIGGER trg_notify_booking_update
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

-- Trigger: new contact submission
CREATE OR REPLACE FUNCTION public.notify_contact_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, body, link, meta)
  VALUES (
    'lead_received',
    '📩 Novo lead recebido',
    COALESCE(NEW.name, 'Lead') || COALESCE(' • ' || NEW.service_interest, ''),
    '/admin?tab=crm',
    jsonb_build_object('submission_id', NEW.id, 'email', NEW.email, 'name', NEW.name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_contact_submission
AFTER INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_contact_submission();

-- Trigger: new gift card
CREATE OR REPLACE FUNCTION public.notify_gift_card_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, body, link, meta)
  VALUES (
    'giftcard_purchased',
    '🎁 Novo Gift Card comprado',
    'Para: ' || COALESCE(NEW.recipient_name, '—') || ' • $' || COALESCE(NEW.amount::text, '0'),
    '/admin?tab=gift-cards',
    jsonb_build_object('giftcard_id', NEW.id, 'amount', NEW.amount)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_gift_card
AFTER INSERT ON public.gift_cards
FOR EACH ROW EXECUTE FUNCTION public.notify_gift_card_purchase();
