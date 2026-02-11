
-- Rate limiting trigger for contact_submissions (by email, 5/min)
CREATE OR REPLACE FUNCTION public.rate_limit_contact_submissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count integer;
BEGIN
  SELECT COUNT(*) INTO _recent_count
  FROM public.contact_submissions
  WHERE email = NEW.email
    AND created_at > now() - interval '1 minute';
  
  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for contact submissions' USING ERRCODE = 'P0429';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_contact_submission_rate
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_contact_submissions();

-- Rate limiting trigger for quiz_responses (by quiz_id + client_phone, 5/min)
CREATE OR REPLACE FUNCTION public.rate_limit_quiz_responses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count integer;
BEGIN
  SELECT COUNT(*) INTO _recent_count
  FROM public.quiz_responses
  WHERE quiz_id = NEW.quiz_id
    AND (client_phone = NEW.client_phone OR client_email = NEW.client_email)
    AND created_at > now() - interval '1 minute';
  
  IF _recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for quiz responses' USING ERRCODE = 'P0429';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_quiz_response_rate
  BEFORE INSERT ON public.quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_quiz_responses();

-- Rate limiting trigger for whatsapp_clicks (by session_id, 20/min)
CREATE OR REPLACE FUNCTION public.rate_limit_whatsapp_clicks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count integer;
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    SELECT COUNT(*) INTO _recent_count
    FROM public.whatsapp_clicks
    WHERE session_id = NEW.session_id
      AND created_at > now() - interval '1 minute';
    
    IF _recent_count >= 20 THEN
      RAISE EXCEPTION 'Rate limit exceeded for whatsapp clicks' USING ERRCODE = 'P0429';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_whatsapp_click_rate
  BEFORE INSERT ON public.whatsapp_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_whatsapp_clicks();
