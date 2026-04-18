-- Add sort_order column to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Initial population: order alphabetically within each category
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(category_slug, 'uncategorized') 
      ORDER BY name ASC
    ) AS rn
  FROM public.services
)
UPDATE public.services s
SET sort_order = ranked.rn
FROM ranked
WHERE s.id = ranked.id;

-- Index to speed up ordered queries
CREATE INDEX IF NOT EXISTS idx_services_category_sort 
ON public.services (category_slug, sort_order);