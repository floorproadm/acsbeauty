

# Plano Final Aprovado — Blocos 1, 2 e 3

Todas as correções incorporadas. Pronto para execução sequencial.

---

## Passo 0 — Migration: `sku_id` em `bookings`

```sql
ALTER TABLE public.bookings ADD COLUMN sku_id uuid REFERENCES public.service_skus(id);
```

---

## Passo 1 — Bloco 1A: SKU Selection no Book.tsx

**Novo state:** `pickedVariationId`, `pickedSkuId`

**Fluxo após selecionar serviço:**
1. Query `service_variations` WHERE `service_id` = picked AND `is_active` = true
2. Se tem variations > 1, mostrar seletor. Se 1, auto-selecionar. Se 0, pular.
3. Query `service_skus` WHERE `service_id` = picked AND (`variation_id` = picked OR null se sem variation) AND `is_active` = true
4. Se tem SKUs > 1, mostrar seletor. Se 1, auto-selecionar.
5. `serviceDuration` usa `selectedSku.duration_minutes` com fallback para `service.duration_minutes`
6. Payload de hold/confirm inclui `sku_id` (opcional, edge functions ignoram)

**Arquivo:** `src/pages/Book.tsx`

---

## Passo 3 — Bloco 1B: Slug-based URL pre-selection

**Detecção UUID vs Slug:**
```typescript
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
```
- Se UUID: `WHERE id = param`
- Se slug: `WHERE slug = param`

**Query params:** `?service=slug` e `?sku=slug-do-sku`
- Pre-selecionar serviço e SKU, pular direto para step "date"

**ServiceDetail.tsx — atualizar links:**
- SkuCard: `/book?service=${service.slug}&sku=${sku.slug}` (atualmente usa `service.id`)
- CTA principal: `/book?service=${service.slug}`

**Arquivos:** `src/pages/Book.tsx`, `src/pages/servicos/ServiceDetail.tsx`

---

## Passo 4 — Bloco 2A: FAQs no ServiceDetail

**Correção aplicada:** Usar campo `services.faq` (jsonb array `[{question, answer}]`), **NAO** a tabela `service_faqs`.

- Parsear `service.faq` (já vem na query existente)
- Se array tem items, renderizar seção com `Accordion` do shadcn
- Estilo similar ao `ServiceFAQ` component existente

**Arquivo:** `src/pages/servicos/ServiceDetail.tsx`

---

## Passo 5 — Bloco 2B: JSON-LD geo-cluster

ServiceDetail.tsx ja busca `service_locations` corretamente. Adicionar:
- `<script type="application/ld+json">` com schema `LocalBusiness` quando `locationData` existe
- Campos: name, address (locationName), url

**Arquivo:** `src/pages/servicos/ServiceDetail.tsx`

---

## Passo 6 — Bloco 3: Analytics por SKU

### BookingsTab
- Alterar query para incluir join: `service_skus(name, price)`
- Adicionar colunas "SKU" e "Preço" na listagem

### DashboardTab
- Query: bookings confirmados do mes atual com `SUM(total_price)`
- Cards: "Receita do Mes" e "Bookings do Mes"
- Bar chart (recharts): top 3 servicos por booking count

**Arquivos:** `src/components/admin/BookingsTab.tsx`, `src/components/admin/DashboardTab.tsx`

---

## Passo 7 — Edge function: price lock

**`supabase/functions/calendar-confirm-booking/index.ts`:**
- Aceitar `sku_id` no request body
- Se `sku_id` presente: buscar `service_skus` WHERE `id = sku_id` → pegar `price` e `promo_price`
- `total_price = promo_price || price` (do banco, nunca do frontend)
- Salvar `sku_id` e `total_price` no INSERT de `bookings`
- Se `sku_id` ausente: manter comportamento atual

**Arquivo:** `supabase/functions/calendar-confirm-booking/index.ts`

---

## Resumo

| Passo | Escopo | Arquivo(s) |
|-------|--------|------------|
| 0 | Migration sku_id | SQL |
| 1 | SKU selection + auto-skip | Book.tsx |
| 3 | Slug URL (UUID regex fix) | Book.tsx, ServiceDetail.tsx |
| 4 | FAQ via jsonb | ServiceDetail.tsx |
| 5 | JSON-LD geo | ServiceDetail.tsx |
| 6 | Analytics recharts | BookingsTab.tsx, DashboardTab.tsx |
| 7 | Price lock edge function | calendar-confirm-booking/index.ts |

NewBookingModal.tsx fica para depois (nao bloqueante).

