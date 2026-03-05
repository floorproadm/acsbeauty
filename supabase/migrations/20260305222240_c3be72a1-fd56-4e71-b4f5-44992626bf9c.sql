
CREATE TABLE public.service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  location_slug text NOT NULL,
  location_name text NOT NULL,
  canonical_service_id uuid REFERENCES public.services(id),
  meta_title text,
  meta_description text,
  body_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, location_slug)
);

ALTER TABLE public.service_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active locations" ON public.service_locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage locations" ON public.service_locations
  FOR ALL USING (public.has_role(auth.uid(), 'admin_owner'));

CREATE INDEX idx_service_locations_service_id ON public.service_locations(service_id);
CREATE INDEX idx_service_locations_slug ON public.service_locations(location_slug);
