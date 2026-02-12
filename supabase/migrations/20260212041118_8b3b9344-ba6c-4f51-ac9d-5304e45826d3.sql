
-- Table of emails allowed to sign in (managed by admin)
CREATE TABLE public.allowed_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage allowed emails"
  ON public.allowed_emails
  FOR ALL
  USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- Replace handle_new_user to check allowlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if email is in the allowlist
  IF NOT EXISTS (
    SELECT 1 FROM public.allowed_emails WHERE lower(email) = lower(new.email)
  ) THEN
    RAISE EXCEPTION 'Email not authorized. Contact admin.' USING ERRCODE = 'P0403';
  END IF;

  INSERT INTO public.staff_profiles (user_id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;

-- Add the existing admin email to the allowlist
INSERT INTO public.allowed_emails (email) VALUES ('acsbeautystudio@gmail.com');
