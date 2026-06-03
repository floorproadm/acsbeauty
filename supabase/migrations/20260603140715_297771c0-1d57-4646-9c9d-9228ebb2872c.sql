CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  booking_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view email_logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs (email_type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs (recipient_email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_client ON public.email_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking ON public.email_logs (booking_id);