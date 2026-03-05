
# ACS v2.0 — Progresso de Implementação

## ✅ Fase 1: Rotas Dinâmicas de Serviços (CONCLUÍDA)

### Migration executada:
- `services.slug` (text UNIQUE) — populado automaticamente
- `service_skus.slug` (text)
- `services.hero_image_url` (text)
- `services.faq` (jsonb, default '[]')

### Páginas criadas:
- `src/pages/servicos/CategoryPage.tsx` → `/servicos/:categoria`
  - Query dinâmica por categoria do banco
  - "A partir de" usando menor preço dos SKUs
  - FAQ dinâmico (jsonb) com fallback para traduções hardcoded
  - Mesmo layout visual das páginas estáticas anteriores

- `src/pages/servicos/ServiceDetail.tsx` → `/servicos/:categoria/:slug`
  - Mostra variações e SKUs com preços reais
  - Agrupamento por técnica (variation)
  - CTA direto para booking

### RLS adicionado:
- `service_skus` → "Anyone can view active skus" (anon + authenticated, is_active=true)
- `service_variations` → "Anyone can view active variations" (anon + authenticated, is_active=true)

### Rotas atualizadas:
- Páginas estáticas antigas removidas do App.tsx (Cabelo, Sobrancelhas, Unhas)
- Imports legados de Packages/OfferLanding/PackageLanding removidos

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
