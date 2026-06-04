
-- Categorias
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active categories" ON public.blog_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin/Marketing manage categories" ON public.blog_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'));

CREATE TRIGGER blog_categories_updated_at BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tags
CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admin/Marketing manage tags" ON public.blog_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'));

-- Posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  audience TEXT NOT NULL DEFAULT 'both' CHECK (audience IN ('public','portal','both')),
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt','en')),
  published_at TIMESTAMPTZ,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  related_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 1,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX blog_posts_status_pub_idx ON public.blog_posts(status, published_at DESC);
CREATE INDEX blog_posts_category_idx ON public.blog_posts(category_id);

CREATE POLICY "Public can view public published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published' AND audience IN ('public','both'));
CREATE POLICY "Authenticated can view portal posts" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (status = 'published' AND audience IN ('portal','both'));
CREATE POLICY "Admin/Marketing manage posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'));

CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reading time trigger
CREATE OR REPLACE FUNCTION public.set_blog_reading_minutes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  word_count INTEGER;
BEGIN
  word_count := GREATEST(array_length(regexp_split_to_array(regexp_replace(COALESCE(NEW.content,''), '<[^>]+>', ' ', 'g'), '\s+'), 1), 1);
  NEW.reading_minutes := GREATEST(1, CEIL(word_count::numeric / 200));
  RETURN NEW;
END;
$$;
CREATE TRIGGER blog_posts_reading_minutes BEFORE INSERT OR UPDATE OF content ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_reading_minutes();

-- Post tags join
CREATE TABLE public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.blog_post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view post tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admin/Marketing manage post tags" ON public.blog_post_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_owner') OR public.has_role(auth.uid(), 'marketing'));

-- Increment views RPC
CREATE OR REPLACE FUNCTION public.increment_post_views(_slug TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.blog_posts SET views_count = views_count + 1
  WHERE slug = _slug AND status = 'published';
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_post_views(TEXT) TO anon, authenticated;
