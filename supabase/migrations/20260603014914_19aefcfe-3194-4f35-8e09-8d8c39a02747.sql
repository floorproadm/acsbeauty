
CREATE TABLE public.reengagement_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email text NOT NULL,
  segment text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reengagement_email_segment ON public.reengagement_sent(client_email, segment, sent_at DESC);

GRANT SELECT, INSERT ON public.reengagement_sent TO authenticated;
GRANT ALL ON public.reengagement_sent TO service_role;

ALTER TABLE public.reengagement_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reengagement_sent"
ON public.reengagement_sent
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin_owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff view reengagement_sent"
ON public.reengagement_sent
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));
