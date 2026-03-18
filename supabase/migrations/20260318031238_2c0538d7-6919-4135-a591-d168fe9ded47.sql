
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Client accounts (phone-based) skip the allowlist check entirely
  IF new.email LIKE 'client_%@acsbeauty.app' THEN
    RETURN new;
  END IF;

  -- Staff/admin accounts must be in the allowlist
  SELECT role INTO _role FROM public.allowed_emails WHERE lower(email) = lower(new.email);
  
  IF _role IS NULL THEN
    RAISE EXCEPTION 'Email not authorized. Contact admin.' USING ERRCODE = 'P0403';
  END IF;

  INSERT INTO public.staff_profiles (user_id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, _role);
  
  RETURN new;
END;
$$;
