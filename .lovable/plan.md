

## Galeria de Serviços com Admin

Transformar a seção ServicesPreview de cards estáticos linkando para páginas dedicadas em uma **galeria dinâmica** gerenciada pelo admin, inspirada no pattern do projeto [AXO Floors](/projects/75ef3430-fc70-4e14-8a90-5292bf5cce1c).

### Conceito

- A seção na home mostra fotos organizadas por **categoria** (Cabelo, Sobrancelhas, Unhas) em formato de galeria com lightbox
- No admin, uma aba "Galeria" permite subir fotos facilmente, associar a uma categoria, reordenar e deletar
- Sem páginas dedicadas por serviço -- tudo fica na home como galeria visual

### Estrutura

**1. Banco de dados** -- 1 tabela nova

```sql
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,          -- 'cabelo', 'sobrancelhas', 'unhas'
  title TEXT,                       -- legenda opcional
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images FOR SELECT
USING (is_active = true);

-- Admin write via has_role
CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin_owner'))
WITH CHECK (public.has_role(auth.uid(), 'admin_owner'));
```

**2. Storage bucket** -- reutilizar o bucket `quiz-images` existente com folder `gallery/`, ou criar bucket `gallery` dedicado (mais limpo).

**3. Admin -- nova aba "Galeria"**

- Adicionar `"gallery"` ao `AdminTab` type
- Nova aba no sidebar com icone `ImageIcon`
- Componente `GalleryTab.tsx`:
  - Filtro por categoria (Cabelo / Sobrancelhas / Unhas)
  - Grid de imagens com drag-to-reorder ou botoes de ordem
  - Botao "Adicionar Foto" abre dialog com: upload de imagem, select de categoria, campo de legenda opcional
  - Hover mostra botao de deletar
  - Reutiliza o `ImageUpload` existente para o upload

**4. Componente público -- refatorar `ServicesPreview`**

- Busca `gallery_images` do banco agrupadas por categoria
- Mantém o layout atual de 3 colunas mas agora cada card mostra fotos reais do banco
- Cada card da categoria mostra a primeira