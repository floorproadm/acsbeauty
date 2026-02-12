
-- Lead notes table
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_source TEXT NOT NULL CHECK (lead_source IN ('quiz', 'contact')),
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view lead notes" ON public.lead_notes
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can create lead notes" ON public.lead_notes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Admins can delete lead notes" ON public.lead_notes
  FOR DELETE USING (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE INDEX idx_lead_notes_lead ON public.lead_notes (lead_id, lead_source);

-- Lead activity log table
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_source TEXT NOT NULL CHECK (lead_source IN ('quiz', 'contact')),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view lead activities" ON public.lead_activities
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE POLICY "Staff can create lead activities" ON public.lead_activities
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin_owner'::app_role));

CREATE INDEX idx_lead_activities_lead ON public.lead_activities (lead_id, lead_source);
