
# ACS v2.0 — Progresso de Implementação

## ✅ Fase 1: Rotas Dinâmicas de Serviços (CONCLUÍDA)

### Migration executada:
- `services.slug` (text UNIQUE NOT NULL) — populado automaticamente
- `services.category_slug` (text, indexed)
- `service_skus.slug` (text, indexed)
- `services.hero_image_url` (text)
- `services.faq` (jsonb, default '[]') — legado, substituído por `service_faqs`

### Tabela `service_faqs` criada:
- `id`, `service_id`, `question`, `answer`, `sort_order`, `created_at`
- RLS: SELECT público, ALL para admin_owner
- Substitui o campo `faq` jsonb nos services

### Indexes adicionados:
- `idx_services_slug`
- `idx_services_category`
- `idx_services_category_slug`
- `idx_skus_slug`

### Páginas criadas/atualizadas:
- `src/pages/Services.tsx` → dinâmico, query categorias do banco
- `src/pages/servicos/CategoryPage.tsx` → query por `category_slug` + FAQs da tabela `service_faqs`
- `src/pages/servicos/ServiceDetail.tsx` → variações e SKUs com preços reais

### RLS adicionado:
- `service_skus` → "Anyone can view active skus"
- `service_variations` → "Anyone can view active variations"
- `service_faqs` → "Anyone can view service faqs" + "Admins can manage service faqs"

### Rotas atualizadas:
- Páginas estáticas antigas removidas do App.tsx (Cabelo, Sobrancelhas, Unhas)

---

## ✅ Fase 1.5: SEO Local + Institucional + Shop (CONCLUÍDA)

### Tabela `service_locations` criada:
- `id`, `service_id`, `location_slug`, `location_name`, `canonical_service_id`
- `meta_title`, `meta_description`, `body_text`, `is_active`
- UNIQUE(service_id, location_slug)
- RLS: SELECT público (is_active), ALL para admin_owner
- Indexes: `idx_service_locations_service_id`, `idx_service_locations_slug`

### Rota hierárquica para geo-variants:
- `/servicos/:categoria/:slug/:locationSlug` → ServiceDetail com conteúdo localizado
- `<link rel="canonical">` aponta para a URL sem location
- `document.title` e meta description dinâmicos

### Páginas institucionais:
- `/studio` → `src/pages/Studio.tsx` — espaço físico com mapa
- `/team` → `src/pages/Team.tsx` — equipe com especialidades
- `/location/newark` → `src/pages/LocationNewark.tsx` — Local SEO + schema LocalBusiness JSON-LD
- `/shop` → `src/pages/Shop.tsx` — placeholder com email capture (contact_submissions)

### Footer atualizado:
- Quick Links: adicionados Studio, Equipe
- Services: links para `/servicos/sobrancelhas`, `/servicos/cabelo`, `/servicos/unhas`, `/shop`

---

## 🔲 Fase 2: Booking por Slug (Conversão)
- `/agendar`, `/agendar/:serviceSlug`, `/agendar/:serviceSlug/:skuSlug`
- Refactor Book.tsx em sub-componentes
- Redirect `/book` → `/agendar`

## 🔲 Fase 3: Quiz como Funil Real
- `/quiz` landing, `/quiz/:slug/resultado`
- WhatsApp com contexto

## 🔲 Fase 4: Páginas de Conteúdo e Legal
- `/privacidade`, `/termos`, `/perguntas-frequentes`

## 🔲 Fase 5: Admin — Rotas Nomeadas
- Sub-rotas reais com Outlet

## 🔲 Fase 6: Limpeza
- Remover arquivos legados
- Atualizar Header
