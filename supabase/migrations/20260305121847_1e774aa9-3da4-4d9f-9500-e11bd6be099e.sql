
-- Add slug to services
ALTER TABLE public.services ADD COLUMN slug text UNIQUE;

-- Add slug to service_skus
ALTER TABLE public.service_skus ADD COLUMN slug text;

-- Add hero_image_url and faq to services for dynamic category pages
ALTER TABLE public.services ADD COLUMN hero_image_url text;
ALTER TABLE public.services ADD COLUMN faq jsonb DEFAULT '[]'::jsonb;

-- Populate slugs from existing service names
UPDATE public.services SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')) WHERE slug IS NULL;

-- Add public SELECT policy for service_skus (needed for "a partir de" pricing)
CREATE POLICY "Anyone can view active skus"
ON public.service_skus
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Add public SELECT policy for service_variations
CREATE POLICY "Anyone can view active variations"
ON public.service_variations
FOR SELECT
TO anon, authenticated
USING (is_active = true);
