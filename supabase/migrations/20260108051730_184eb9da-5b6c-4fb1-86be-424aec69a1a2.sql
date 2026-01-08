-- Table for calendar integration settings (ready for Google Calendar)
CREATE TABLE public.calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'google',
  calendar_id text,
  timezone text NOT NULL DEFAULT 'America/New_York',
  staff_id uuid REFERENCES public.staff_profiles(user_id),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for business hours configuration
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL DEFAULT '10:00:00',
  close_time time NOT NULL DEFAULT '19:00:00',
  is_open boolean NOT NULL DEFAULT true,
  staff_id uuid REFERENCES public.staff_profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(day_of_week, staff_id)
);

-- Table for booking holds (anti-overbooking mechanism)
CREATE TABLE public.booking_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_key text UNIQUE NOT NULL,
  service_id uuid REFERENCES public.services(id),
  package_id uuid REFERENCES public.packages(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  staff_id uuid REFERENCES public.staff_profiles(user_id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for scheduling settings
CREATE TABLE public.scheduling_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_interval_minutes integer NOT NULL DEFAULT 30,
  buffer_minutes integer NOT NULL DEFAULT 10,
  hold_duration_minutes integer NOT NULL DEFAULT 5,
  max_advance_days integer NOT NULL DEFAULT 60,
  timezone text NOT NULL DEFAULT 'America/New_York',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_integrations
CREATE POLICY "Admins can manage calendar integrations"
ON public.calendar_integrations FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can view calendar integrations"
ON public.calendar_integrations FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for business_hours
CREATE POLICY "Admins can manage business hours"
ON public.business_hours FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Anyone can view business hours"
ON public.business_hours FOR SELECT
USING (true);

-- RLS Policies for booking_holds
CREATE POLICY "Anyone can create booking holds"
ON public.booking_holds FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view own booking holds"
ON public.booking_holds FOR SELECT
USING (true);

CREATE POLICY "Anyone can delete expired holds"
ON public.booking_holds FOR DELETE
USING (expires_at < now());

CREATE POLICY "Admins can manage all holds"
ON public.booking_holds FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

-- RLS Policies for scheduling_settings
CREATE POLICY "Admins can manage scheduling settings"
ON public.scheduling_settings FOR ALL
USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Anyone can view scheduling settings"
ON public.scheduling_settings FOR SELECT
USING (true);

-- Insert default business hours (Tue-Sat open, Sun-Mon closed)
INSERT INTO public.business_hours (day_of_week, is_open, staff_id) VALUES
  (0, false, null),  -- Sunday - closed
  (1, false, null),  -- Monday - closed
  (2, true, null),   -- Tuesday - open
  (3, true, null),   -- Wednesday - open
  (4, true, null),   -- Thursday - open
  (5, true, null),   -- Friday - open
  (6, true, null);   -- Saturday - open

-- Insert default scheduling settings
INSERT INTO public.scheduling_settings (slot_interval_minutes, buffer_minutes, hold_duration_minutes, max_advance_days) 
VALUES (30, 10, 5, 60);

-- Add triggers for updated_at
CREATE TRIGGER update_calendar_integrations_updated_at
BEFORE UPDATE ON public.calendar_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduling_settings_updated_at
BEFORE UPDATE ON public.scheduling_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean expired holds
CREATE OR REPLACE FUNCTION public.cleanup_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.booking_holds WHERE expires_at < now();
END;
$$;