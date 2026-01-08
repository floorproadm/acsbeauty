-- Add timezone column to bookings if not exists
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- Update booking_holds table to ensure proper structure
ALTER TABLE public.booking_holds 
ADD COLUMN IF NOT EXISTS calendar_id text;

-- Create unique index on hold_key if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_holds_hold_key ON public.booking_holds(hold_key);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_booking_holds_expires_at ON public.booking_holds(expires_at);

-- Ensure calendar_integrations has all needed columns
ALTER TABLE public.calendar_integrations 
ADD COLUMN IF NOT EXISTS sync_enabled boolean DEFAULT true;

-- Create index on calendar_id for lookups
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_calendar_id ON public.calendar_integrations(calendar_id);

-- Add RLS policy for public booking creation (needed for anonymous booking flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'Anyone can create bookings'
  ) THEN
    CREATE POLICY "Anyone can create bookings" ON public.bookings
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Add RLS policy for clients insert (needed for booking flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'Anyone can create clients'
  ) THEN
    CREATE POLICY "Anyone can create clients" ON public.clients
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Ensure cleanup function exists with proper permissions
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.booking_holds WHERE expires_at < now();
END;
$$;