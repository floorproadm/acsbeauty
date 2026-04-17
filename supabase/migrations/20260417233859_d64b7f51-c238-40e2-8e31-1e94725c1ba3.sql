-- Create gallery_categories table
CREATE TABLE public.gallery_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_home BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.gallery_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage gallery categories"
  ON public.gallery_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin_owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin_owner'::app_role));

CREATE TRIGGER update_gallery_categories_updated_at
  BEFORE UPDATE ON public.gallery_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial categories
INSERT INTO public.gallery_categories (slug, label, emoji, sort_order, show_on_home, is_active) VALUES
  ('cabelo', 'Cabelo', '💇‍♀️', 1, true, true),
  ('sobrancelhas', 'Sobrancelhas', '👁️', 2, true, true),
  ('unhas', 'Unhas', '💅', 3, true, true),
  ('penteados', 'Penteados', '✨', 4, false, true),
  ('tratamentos', 'Tratamentos', '🌿', 5, false, true),
  ('antes-depois', 'Antes/Depois', '🔄', 6, false, true),
  ('bastidores', 'Bastidores', '📸', 7, false, true),
  ('estudio', 'Estúdio', '🏠', 8, false, true),
  ('eventos', 'Eventos', '🎉', 9, false, true);