

# Plano: SEO Local (Geo-Clusters) + Institucional + Shop

Incorpora os 3 ajustes do usuário: rota hierárquica, indexes, e schema LocalBusiness.

---

## 1. Migration: Tabela `service_locations`

```sql
CREATE TABLE public.service_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  location_slug text NOT NULL,          -- "newark", "ironbound"
  location_name text NOT NULL,          -- "Newark, NJ", "Ironbound"
  canonical_service_id uuid REFERENCES public.services(id), -- para rel=canonical
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
```

---

## 2. Rotas (App.tsx)

Novas rotas a adicionar:

```text
/servicos/:categoria/:slug/:locationSlug   → ServiceDetail (com geo overlay)
/studio                                      → Studio.tsx
/team                                        → Team.tsx
/location/newark                             → LocationNewark.tsx
/shop                                        → Shop.tsx (placeholder)
```

A rota `/servicos/:categoria/:slug` existente continua como página canônica. A rota com `:locationSlug` reutiliza o mesmo `ServiceDetail` mas carrega conteúdo localizado da tabela `service_locations`.

---

## 3. ServiceDetail.tsx — Suporte a Geo-Variants

- Adicionar `locationSlug` como param opcional via `useParams`
- Se `locationSlug` existe, fazer query em `service_locations` para buscar `meta_title`, `body_text`, etc.
- Renderizar `<link rel="canonical">` apontando para a URL sem location (página base)
- Adicionar `<head>` meta tags via `document.title` e meta description
- Mostrar conteúdo localizado (body_text) como seção adicional quando disponível

---

## 4. Páginas Institucionais (estáticas)

### `/studio` — Studio.tsx
- Fotos do espaço (placeholder images por enquanto)
- Descrição do estúdio
- Endereço com mapa embed

### `/team` — Team.tsx
- Lista da equipe (estática por enquanto, futuramente pode vir de `staff_profiles`)
- Fotos e especialidades

### `/location/newark` — LocationNewark.tsx
- Endereço completo: 375 Chestnut St, 3rd Floor, Suite 3B, Newark, NJ
- Google Maps embed
- Horários de funcionamento (query `business_hours`)
- **Schema markup LocalBusiness** via `<script type="application/ld+json">`

```json
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "ACS Beauty Studio",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "375 Chestnut St, 3rd Floor, Suite 3B",
    "addressLocality": "Newark",
    "addressRegion": "NJ",
    "postalCode": "07105",
    "addressCountry": "US"
  },
  "telephone": "+17329153430",
  "priceRange": "$$",
  "url": "https://acsbeauty.lovable.app"
}
```

### `/shop` — Shop.tsx
- "Coming Soon" com email capture form
- Saves to a simple `shop_waitlist` or reuses `contact_submissions` with a tag

---

## 5. Footer + Header Updates

- Footer: Services section links to `/servicos/cabelo`, `/servicos/sobrancelhas`, `/servicos/unhas`
- Footer: Add `/studio` and `/team` links
- Footer: Privacy/Terms links stay (pages created in Phase 4)
- Header: No changes needed now

---

## 6. Arquivos a Criar/Editar

| Acao | Arquivo |
|------|---------|
| Migration | Nova SQL migration |
| Criar | `src/pages/Studio.tsx` |
| Criar | `src/pages/Team.tsx` |
| Criar | `src/pages/LocationNewark.tsx` |
| Criar | `src/pages/Shop.tsx` |
| Editar | `src/pages/servicos/ServiceDetail.tsx` — geo-variant support |
| Editar | `src/App.tsx` — novas rotas |
| Editar | `src/components/layout/Footer.tsx` — links atualizados |
| Editar | `.lovable/plan.md` — progresso |

---

## Ordem de Execução

1. Migration `service_locations`
2. Páginas estáticas (Studio, Team, Location, Shop)
3. Geo-variant no ServiceDetail
4. Rotas no App.tsx
5. Footer links
6. Plan update

