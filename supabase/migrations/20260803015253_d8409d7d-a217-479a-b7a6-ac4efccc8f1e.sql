ALTER TABLE public.password_reset_codes ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON public.password_reset_codes(email);