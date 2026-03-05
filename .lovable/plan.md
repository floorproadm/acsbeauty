
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

## 🔲 Fase 2: Booking por Slug (Conversão)
- `/agendar`, `/agendar/:serviceSlug`, `/agendar/:serviceSlug/:skuSlug`
- Refactor Book.tsx em sub-componentes
- Redirect `/book` → `/agendar`

## 🔲 Fase 3: Quiz como Funil Real
- `/quiz` landing, `/quiz/:slug/resultado`
- WhatsApp com contexto

## 🔲 Fase 4: Páginas de Conteúdo e Legal
- `/privacidade`, `/termos`, `/perguntas-frequentes`
- `/estudio`, `/equipe`

## 🔲 Fase 5: Admin — Rotas Nomeadas
- Sub-rotas reais com Outlet

## 🔲 Fase 6: Limpeza
- Remover arquivos legados
- Atualizar Footer/Header
