CREATE TABLE public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  phone text not null,
  code text not null,
  used boolean not null default false,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.password_reset_codes TO authenticated;
GRANT ALL ON public.password_reset_codes TO service_role;

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own codes" ON public.password_reset_codes
  FOR INSERT TO authenticated WITH CHECK (phone = (select phone from public.clients where id = password_reset_codes.client_id));

CREATE POLICY "Users can update their own codes" ON public.password_reset_codes
  FOR UPDATE TO authenticated USING (phone = (select phone from public.clients where id = password_reset_codes.client_id));

CREATE POLICY "Users can select their own codes" ON public.password_reset_codes
  FOR SELECT TO authenticated USING (phone = (select phone from public.clients where id = password_reset_codes.client_id));

CREATE POLICY "Service role full access" ON public.password_reset_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_password_reset_codes_phone ON public.password_reset_codes(phone);
CREATE INDEX idx_password_reset_codes_expires ON public.password_reset_codes(expires_at);