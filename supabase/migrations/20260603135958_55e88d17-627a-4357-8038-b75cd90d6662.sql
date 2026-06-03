CREATE TABLE IF NOT EXISTS public.birthday_emails_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, year)
);

GRANT SELECT, INSERT ON public.birthday_emails_sent TO authenticated;
GRANT ALL ON public.birthday_emails_sent TO service_role;

ALTER TABLE public.birthday_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can view birthday_emails_sent"
  ON public.birthday_emails_sent FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins and staff can insert birthday_emails_sent"
  ON public.birthday_emails_sent FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'staff'));

CREATE INDEX IF NOT EXISTS idx_birthday_emails_sent_year ON public.birthday_emails_sent (year, client_id);