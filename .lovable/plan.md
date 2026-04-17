

## Galeria Admin — Upgrade para experiência profissional

Concordo, hoje a galeria tem 3 categorias fixas (Cabelo, Sobrancelhas, Unhas), upload básico, e organização limitada. Vou expandir para algo realmente útil para a Ane gerenciar o conteúdo visual do estúdio.

### O que vamos adicionar

**1. Mais categorias + categorias customizáveis**
- Adicionar categorias prontas: **Penteados**, **Tratamentos**, **Antes/Depois**, **Bastidores**, **Estúdio**, **Eventos**
- Permitir criar categorias customizadas (ex: "Casamentos", "Formaturas")
- Categorias ficam em uma nova tabela `gallery_categories` (slug, label, emoji, sort_order, is_active)

**2. Drag-and-drop real para reordenar**
- Substituir os botões "subir/descer" por arrastar com `@dnd-kit/core` (já popular, leve)
- Reordena visualmente dentro do grid e salva `display_order` em batch
- Funciona em mobile (touch) e desktop

**3. Seleção múltipla + ações em massa**
- Modo de seleção: long-press ou checkbox no canto da foto
- Ações em massa: **Excluir várias**, **Ocultar/Mostrar várias**, **Mover para outra categoria**
- Contador "X selecionadas" no topo

**4. Visualização ampliada (lightbox no admin)**
- Clicar duas vezes na foto abre em tela cheia com navegação (←/→)
- Útil para revisar qualidade antes de publicar

**5. Filtros e busca melhorados**
- Filtro por status: Todas / Visíveis / Ocultas
- Ordenação: Mais recentes / Mais antigas / Ordem manual
- Busca por legenda/título

**6. Estatísticas no topo**
- "X fotos visíveis · Y ocultas · Z totais"
- Badge por categoria mostrando quantas estão visíveis vs ocultas

**7. Drag & drop de upload**
- Arrastar fotos do desktop direto para a área de upload
- Preview das fotos antes de confirmar envio
- Permitir definir categoria por foto antes de enviar (opcional)

**8. Edição inline melhorada**
- Painel lateral (Sheet) ao clicar em uma foto, em vez da barra inferior
- Mais espaço para legenda, ver dimensões, data, trocar categoria
- Botão "Definir como capa da categoria" (a primeira foto vira destaque na home)

### Mudanças no banco

Nova tabela:
```sql
gallery_categories (
  id, slug, label, emoji, sort_order, is_active, created_at
)
```
Seed inicial com as 3 atuais + 6 novas categorias prontas.

A coluna `category` em `gallery_images` continua como `text` (slug), garantindo compatibilidade total — nenhuma foto existente é afetada.

### Detalhes técnicos

- **Arquivos novos**: 
  - `src/components/admin/GalleryCategoryManager.tsx` (modal para criar/editar/desativar categorias)
  - `src/components/admin/GalleryLightbox.tsx` (visualização ampliada)
- **Arquivo refatorado**: `src/components/admin/GalleryTab.tsx` (estrutura nova com drag-and-drop e seleção múltipla)
- **Lib nova**: `@dnd-kit/core` + `@dnd-kit/sortable` (~30kb gzip)
- **Migration**: criar `gallery_categories` + RLS (admin gerencia, público lê ativas)
- **Frontend público** (`ServicesPreview.tsx`): atualizar para buscar categorias dinâmicas em vez do array hardcoded — assim novas categorias criadas no admin podem opcionalmente aparecer na home (ou ficar só internas)

### Pergunta antes de prosseguir

Sobre as **categorias novas** (Penteados, Tratamentos, Antes/Depois, Bastidores, Estúdio, Eventos):

- **Opção A**: Aparecem todas na home pública automaticamente (3 colunas viram 6+ cards).
- **Opção B**: Cada categoria tem um toggle "Mostrar na home pública" — Ane decide. Por padrão só Cabelo/Sobrancelhas/Unhas aparecem; o resto fica como portfólio interno/uso futuro.

Recomendo a **Opção B** para preservar o layout limpo da home. Confirma?

