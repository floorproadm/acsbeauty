
-- 1. Backfill slugs and set NOT NULL
UPDATE public.services SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')) WHERE slug IS NULL;
ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_skus_slug ON public.service_skus(slug);

-- 3. category_slug column
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_slug text;
UPDATE public.services SET category_slug = lower(regexp_replace(category, '[^a-z0-9]+', '-', 'gi')) WHERE category IS NOT NULL AND category_slug IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_category_slug ON public.services(category_slug);

-- 4. service_faqs table
CREATE TABLE IF NOT EXISTS public.service_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service faqs" ON public.service_faqs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service faqs" ON public.service_faqs
  FOR ALL USING (public.has_role(auth.uid(), 'admin_owner'));
