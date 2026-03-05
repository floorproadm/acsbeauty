

# Plano: Ajustes de Schema + /servicos Dinâmico

Incorpora os 4 ajustes do usuário + a melhoria estratégica de tornar `/servicos` dinâmico.

---

## Migration SQL

Uma única migration para corrigir o schema existente:

```sql
-- 1. slug NOT NULL (backfill primeiro, depois constraint)
UPDATE public.services SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')) WHERE slug IS NULL;
ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;

-- 2. Indexes para performance
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_skus_slug ON public.service_skus(slug);

-- 3. category_slug na tabela services
ALTER TABLE public.services ADD COLUMN category_slug text;
UPDATE public.services SET category_slug = lower(regexp_replace(category, '[^a-z0-9]+', '-', 'gi')) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_category_slug ON public.services(category_slug);

-- 4. Tabela service_faqs (substituindo jsonb)
CREATE TABLE public.service_faqs (
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
```

---

## Código: CategoryPage.tsx

- Remover o mapa `SLUG_TO_CATEGORY` hardcoded
- Query por `category_slug` em vez de `category`
- Buscar FAQs da nova tabela `service_faqs` em vez do campo `faq` jsonb

---

## Código: Services.tsx → Dinâmico

Tornar `/servicos` dinâmico:
- Query `SELECT DISTINCT category, category_slug FROM services WHERE is_active = true`
- Renderizar cards de categoria a partir do banco
- Manter imagens de fallback por `category_slug` (assets locais) enquanto não houver `hero_image_url` de categoria
- Remover o array `const services = [...]` hardcoded

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Migration | Nova migration SQL |
| Editar | `src/pages/Services.tsx` — query dinâmica |
| Editar | `src/pages/servicos/CategoryPage.tsx` — usar `category_slug` + `service_faqs` |
| Editar | `src/pages/servicos/ServiceDetail.tsx` — usar `category_slug` para breadcrumb |

