

# ACS v2.0 — Plano de Implementação do Novo Sitemap

## Visão Geral

Migrar de páginas estáticas hardcoded para um sitemap dinâmico onde o admin edita e o público atualiza automaticamente. O trabalho está dividido em 6 fases incrementais.

---

## Fase 1: Rotas Dinâmicas de Serviços (PRIORIDADE MÁXIMA)

**Problema atual:** As 3 páginas de categoria (`Cabelo.tsx`, `Sobrancelhas.tsx`, `Unhas.tsx`) são 100% hardcoded. Não escalam.

**Solução:**

1. **Criar página dinâmica `/servicos/:categoria`** — `src/pages/servicos/CategoryPage.tsx`
   - Query `services` por `category` (slug)
   - Renderiza hero, lista de serviços com "a partir de" (menor preço dos SKUs), FAQ, galeria
   - Fallback para 404 se categoria não existe

2. **Criar página dinâmica `/servicos/:categoria/:slug`** — `src/pages/servicos/ServiceDetail.tsx`
   - Query `services` + `service_variations` + `service_skus` por slug
   - Mostra variações, SKUs com preços reais, CTA para `/agendar/:serviceSlug`
   - Precisa de coluna `slug` na tabela `services` (migration)

3. **Migration necessária:**
   ```sql
   ALTER TABLE public.services ADD COLUMN slug text UNIQUE;
   -- Populate slugs from existing names
   UPDATE public.services SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi'));
   ```

4. **Manter as 3 páginas estáticas temporariamente** como fallback, removendo depois.

---

## Fase 2: Booking por Slug (Conversão)

**Problema atual:** `/book` usa `?service=UUID` via query params. Não é SEO-friendly.

**Solução:**

1. **Novas rotas:**
   - `/agendar` → página de booking (substitui `/book`)
   - `/agendar/:serviceSlug` → pré-seleciona serviço
   - `/agendar/:serviceSlug/:skuSlug` → pré-seleciona SKU específico com duração/preço

2. **Migration:** Coluna `slug` em `service_skus`
   ```sql
   ALTER TABLE public.service_skus ADD COLUMN slug text;
   ```

3. **Refactor `Book.tsx`** (899 linhas) → decomposição:
   - `BookingServiceStep.tsx` — seleção por slug
   - `BookingCalendarStep.tsx` — calendário
   - `BookingFormStep.tsx` — dados do cliente
   - `BookingLayout.tsx` — wrapper

4. **Redirect `/book` → `/agendar`** para compatibilidade.

5. **Renomear `/confirm/:bookingId` → `/confirmacao/:bookingId`**

---

## Fase 3: Quiz como Funil Real

**Mudanças:**

1. **Nova rota `/quiz/:slug/resultado`** — resultado persistente com URL compartilhável
   - Salvar `recommended_result_id` no response
   - Resultado empurra para `/agendar/:serviceSlug` ou `/agendar/:serviceSlug/:skuSlug`

2. **Rota `/quiz`** — landing page listando quizzes ativos (query `quizzes` where `is_active`)

3. **WhatsApp com contexto:** `/whatsapp` como redirect que registra tracking e abre WhatsApp com mensagem pré-preenchida baseada no serviço/quiz

---

## Fase 4: Páginas de Conteúdo e Legal

1. **`/privacidade`** e **`/termos`** — páginas estáticas (resolve links quebrados do Footer)

2. **`/perguntas-frequentes`** — FAQ geral agregando FAQs de todas as categorias

3. **`/sobre`** (já existe) e **`/contato`** (já existe) — manter

4. **`/estudio`** e **`/equipe`** — novas páginas estáticas sobre espaço físico e equipe

5. **`/resultados`** — galeria before/after por categoria (futuro, pode ser dinâmico via storage bucket)

6. **`/blog`** — requer nova tabela `blog_posts` (fase futura, não bloqueia o resto)

---

## Fase 5: Admin — Rotas Nomeadas

**Problema atual:** Admin usa tabs internas em rota única `/admin`. Não há deep-linking.

**Solução:** Migrar para sub-rotas reais:

```text
/admin                    → redirect /admin/dashboard
/admin/dashboard          → DashboardTab
/admin/agendamentos       → BookingsTab
/admin/clientes           → CRMTab
/admin/leads              → UnifiedLeadsTab
/admin/servicos           → ServicesTab
/admin/skus               → SkusTab
/admin/quizzes            → QuizzesTab
/admin/tarefas            → TasksTab
/admin/configuracoes      → (novo) SettingsTab
/admin/acesso             → AllowedEmailsTab
```

- Usar `<Outlet>` dentro de `AdminLayout` com nested routes
- Sidebar lê `location.pathname` em vez de state
- Deep-linking funciona (compartilhar URL, refresh)

---

## Fase 6: Limpeza

1. **Remover** `Packages.tsx`, `OfferLanding.tsx`, `PackageLanding.tsx`
2. **Remover** rotas comentadas no `App.tsx`
3. **Atualizar** `Footer.tsx` — links para `/privacidade`, `/termos`, `/perguntas-frequentes`
4. **Atualizar** `Header.tsx` — links para `/servicos` (já existe)
5. **`/sitemap.xml`** — gerar via edge function lendo serviços/categorias do banco

---

## Resumo de Migrations Necessárias

| Migration | Tabela | Mudança |
|-----------|--------|---------|
| 1 | `services` | ADD `slug text UNIQUE` |
| 2 | `service_skus` | ADD `slug text` |
| 3 | `services` | ADD `hero_image_url text`, `faq jsonb` (conteúdo dinâmico por categoria) |

---

## Ordem de Execução Recomendada

```text
1. Migration slugs (services + skus)
2. /servicos/:categoria (dinâmico)
3. /servicos/:categoria/:slug (detalhe)
4. /agendar com slugs + decomposição Book.tsx
5. /privacidade + /termos (quick win)
6. /quiz landing + resultado persistente
7. Admin sub-rotas
8. Limpeza legacy
```

---

## Decisão Arquitetural: Preços

Conforme sua recomendação:
- `/servicos/:categoria` mostra "a partir de R$X" (menor SKU price)
- Preço exato só aparece no booking (`/agendar/:serviceSlug/:skuSlug`)
- **Não criar** `/precos` como página pública

