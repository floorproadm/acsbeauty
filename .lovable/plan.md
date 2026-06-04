## Blog ACS Beauty — MVP

Blog editorial integrado ao painel, com posts públicos otimizados para SEO (atração orgânica) e visíveis também dentro do Portal do cliente (engajamento). Editor rich-text no admin, categorias/tags, SEO por post e CTA para serviço relacionado.

### Banco de dados (Lovable Cloud — aditivo)

Três tabelas novas em `public`:

- **blog_posts**
  - `id`, `slug` (unique), `title`, `excerpt`, `content` (rich-text HTML/JSON), `cover_image_url`
  - `status` ('draft' | 'published'), `published_at`, `audience` ('public' | 'portal' | 'both' — default 'both')
  - `language` ('pt' | 'en'), `category_id` (fk), `related_service_id` (fk → services, nullable)
  - `seo_title`, `seo_description`, `og_image_url`, `reading_minutes`
  - `author_id` (fk → team_members, nullable), `views_count`
  - `created_at`, `updated_at`

- **blog_categories**: `id`, `slug`, `name_pt`, `name_en`, `display_order`, `is_active`

- **blog_tags** + **blog_post_tags** (join): `id`, `slug`, `name`

RLS:
- Public SELECT em `blog_posts` apenas quando `status='published'` e `audience IN ('public','both')`.
- Portal SELECT (authenticated) quando `audience IN ('portal','both')`.
- Admin/Marketing: full CRUD via `has_role`.
- Categorias/tags: public SELECT quando `is_active=true`; CRUD admin/marketing.
- GRANTs explícitos para `anon` (somente SELECT condicional via policy), `authenticated`, `service_role`.

Storage: reaproveitar bucket `gallery` ou criar `blog-media` (público) para capas e imagens inline.

### Admin (aba Marketing)

Nova sub-aba **Blog** dentro de `MarketingHubTab` (lado a lado com Email):

- **Lista de posts**: tabela com título, status (badge), audience, categoria, autor, data, views. Filtros: status, audience, categoria, busca. Ações: editar, duplicar, publicar/despublicar, excluir.
- **Editor (drawer ou page `/admin/blog/:id`)**:
  - Campos: título, slug (auto a partir do título, editável), excerpt, capa (upload)
  - Editor rich-text (Tiptap) com toolbar: H2/H3, bold/italic, listas, link, imagem (upload inline), quote, code
  - Sidebar do editor: status, audience, idioma, data publicação, categoria, tags (multi-select com criar), serviço relacionado (combobox), autor
  - Aba SEO: seo_title, seo_description (contadores), og_image, preview Google snippet
  - Pré-visualização (abrir `/blog/:slug?preview=1`)
- **Categorias**: CRUD simples inline.

Permissões: `admin_owner` e `marketing` têm acesso.

### Frontend público

Novas rotas:

- `/blog` — listagem: hero editorial, filtro por categoria, grid de cards (capa, categoria, título, excerpt, data, tempo de leitura). Paginação ou load-more.
- `/blog/:slug` — post: hero com capa, breadcrumb, título, meta (autor, data, leitura), corpo formatado, tags, CTA "Agendar [serviço]" quando `related_service_id` setado, bloco "Posts relacionados" (mesma categoria).
- Link **Blog** no header público (entre About e Contact) e no footer.

SEO por post (react-helmet-async):
- `<title>` = `seo_title || title`
- meta description, canonical `/blog/:slug`, og:title/description/image/url, og:type=article
- JSON-LD `Article` (headline, image, datePublished, author, publisher)
- Sitemap: estender `scripts/generate-sitemap.ts` para incluir `/blog` + um entry por post publicado público.

i18n: respeitar `LanguageContext`; campos `name_pt`/`name_en` em categorias; posts têm coluna `language` (filtrar pela língua ativa, fallback PT).

### Portal do cliente

Nova entrada **Novidades** no menu do Portal:
- Lista posts com `audience IN ('portal','both')`, ordem por `published_at` desc
- Detalhe inline (drawer) ou rota `/portal/news/:slug`
- Badge "Novo" para posts dos últimos 7 dias
- Mesmo CTA de serviço relacionado, levando ao fluxo de booking do Portal

### Fora de escopo (MVP)

- Comentários, likes, newsletter automática a partir de post, agendamento de publicação futura, múltiplos autores por post, versionamento, busca full-text. Podem entrar em v2.

### Detalhes técnicos

- Editor: **Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`). Salvar como HTML em `content`.
- Slug: gerar com slugify no client, validar unicidade na save.
- Upload de imagens: client → Supabase Storage bucket público → URL salva no HTML.
- Reading time: estimar no save (`words / 200`).
- Views: incrementar via RPC `increment_post_views(slug)` (security definer) ao montar a página pública.
- Estilo: Playfair Display nos títulos, cream/bronze, alinhado ao restante editorial.
- Migrations: aditivas (Safe Mode), GRANTs explícitos, sem alterar tabelas existentes.

### Entregáveis

1. Migration: 3 tabelas + RLS + GRANTs + RPC views.
2. Bucket de mídia (se necessário).
3. Admin: `BlogTab.tsx` + editor + categorias, integrado em `MarketingHubTab`.
4. Público: páginas `/blog` e `/blog/:slug`, link no header/footer, sitemap atualizado.
5. Portal: aba Novidades.
6. i18n: chaves PT/EN em `LanguageContext`.
