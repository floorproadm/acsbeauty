
# ACS v2.0 — Progresso de Implementação

## ✅ Fase 1: Rotas Dinâmicas de Serviços (CONCLUÍDA)

### Migration executada:
- `services.slug` (text UNIQUE NOT NULL) — populado automaticamente
- `services.category_slug` (text, indexed)
- `service_skus.slug` (text, indexed)
- `services.hero_image_url` (text)
- `services.faq` (jsonb, default '[]') — usado para FAQs inline

### Tabela `service_faqs` criada (legado, não usada pelo frontend):
- Frontend usa `services.faq` jsonb diretamente

### Indexes adicionados:
- `idx_services_slug`
- `idx_services_category`
- `idx_services_category_slug`
- `idx_skus_slug`

### Páginas criadas/atualizadas:
- `src/pages/Services.tsx` → dinâmico, query categorias do banco
- `src/pages/servicos/CategoryPage.tsx` → query por `category_slug`
- `src/pages/servicos/ServiceDetail.tsx` → variações, SKUs, FAQs (jsonb), JSON-LD geo

### RLS adicionado:
- `service_skus` → "Anyone can view active skus"
- `service_variations` → "Anyone can view active variations"
- `service_faqs` → "Anyone can view service faqs" + "Admins can manage service faqs"

---

## ✅ Fase 1.5: SEO Local + Institucional + Shop (CONCLUÍDA)

### Tabela `service_locations` criada
### Rota hierárquica para geo-variants com canonical
### Páginas institucionais: Studio, Team, LocationNewark, Shop

---

## ✅ Fase 2: Booking por SKU + Slug (CONCLUÍDA)

### Migration executada:
- `bookings.sku_id` (uuid, nullable, FK → service_skus)

### Book.tsx — SKU selection flow:
- Novo state: `pickedVariationId`, `pickedSkuId`
- Step "sku" entre "service" e "date"
- Auto-skip: sem variations → pular; 1 SKU → auto-selecionar
- `serviceDuration` usa SKU duration com fallback
- `sku_id` enviado no payload de hold/confirm

### Book.tsx — Slug-based URL pre-selection:
- Query params `?service=slug` e `?sku=slug`
- UUID regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- UUID → WHERE id = param; Slug → WHERE slug = param
- Pre-seleciona serviço e SKU, pula para date

### ServiceDetail.tsx — Slug links:
- CTA principal: `/book?service=${service.slug}`
- SkuCard: `/book?service=${service.slug}&sku=${sku.slug}`

### ServiceDetail.tsx — FAQs:
- Renderiza `services.faq` (jsonb array `[{question, answer}]`)
- Accordion shadcn com estilo ServiceFAQ

### ServiceDetail.tsx — JSON-LD geo-cluster:
- `<script type="application/ld+json">` com schema LocalBusiness quando locationData existe

### Admin — BookingsTab:
- Join `service_skus(name, price)` na query
- Colunas SKU name e preço na listagem

### Admin — DashboardTab:
- Cards: "Receita do Mês" e "Bookings do Mês"
- Bar chart (recharts): top 5 serviços por booking count

### Edge function — Price lock:
- `calendar-confirm-booking` aceita `sku_id`
- Busca preço do SKU no banco (nunca confia no frontend)
- `total_price = promo_price || price` salvo no booking

---

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
