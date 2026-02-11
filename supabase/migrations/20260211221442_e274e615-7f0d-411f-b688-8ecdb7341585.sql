
-- Rate limiting table for edge functions
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by key + window
CREATE INDEX idx_rate_limits_key_window ON public.rate_limits (key, window_start);

-- Enable RLS - only service_role should access this
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service_role can read/write
-- This ensures the table is only accessible from edge functions using service_role key

-- Cleanup function to remove old rate limit entries (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '5 minutes';
END;
$$;

-- Rate check function: returns true if request is allowed, false if rate limited
-- Atomically increments counter or creates new window
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _max_requests integer DEFAULT 10,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _window_start timestamptz;
BEGIN
  -- Try to find an active window for this key
  SELECT request_count, rate_limits.window_start 
  INTO _current_count, _window_start
  FROM public.rate_limits 
  WHERE key = _key 
    AND rate_limits.window_start > now() - (_window_seconds || ' seconds')::interval
  ORDER BY rate_limits.window_start DESC
  LIMIT 1
  FOR UPDATE;

  IF _current_count IS NOT NULL THEN
    -- Window exists - check limit
    IF _current_count >= _max_requests THEN
      RETURN false; -- Rate limited
    END IF;
    -- Increment counter
    UPDATE public.rate_limits 
    SET request_count = request_count + 1 
    WHERE key = _key 
      AND rate_limits.window_start = _window_start;
    RETURN true;
  ELSE
    -- No active window - create new one
    INSERT INTO public.rate_limits (key, request_count, window_start)
    VALUES (_key, 1, now());
    RETURN true;
  END IF;
END;
$$;
