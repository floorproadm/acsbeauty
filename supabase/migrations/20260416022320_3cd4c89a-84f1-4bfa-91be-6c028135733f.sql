
-- Table linking team members to the services they can perform
CREATE TABLE public.staff_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, service_id)
);

-- Enable RLS
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage staff_services"
  ON public.staff_services FOR ALL
  USING (public.has_role(auth.uid(), 'admin_owner'::app_role));

-- Anyone can view (needed for booking flow filtering)
CREATE POLICY "Anyone can view staff_services"
  ON public.staff_services FOR SELECT
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_staff_services_team_member ON public.staff_services(team_member_id);
CREATE INDEX idx_staff_services_service ON public.staff_services(service_id);
