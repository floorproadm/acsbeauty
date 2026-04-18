
User quer poder definir a ordem dos serviços no admin (drag-and-drop ou campo de ordenação) para controlar como aparecem no portal e nas páginas públicas.

Vou verificar o estado atual: a tabela `services` não tem `sort_order`. Categorias da galeria têm. Preciso adicionar.

Plano enxuto:

## Adicionar ordenação manual de serviços no Admin

### O que muda

**1. Banco de dados (migração aditiva)**
- Adicionar coluna `sort_order INTEGER NOT NULL DEFAULT 0` na tabela `services`
- Popular valores iniciais baseados em ordem alfabética por categoria

**2. Admin — `ServicesTab.tsx`**
- Adicionar handles de arrastar (ícone GripVertical) em cada card de serviço
- Implementar drag-and-drop com `@dnd-kit/core` (já usado em outras abas como Galeria)
- Reordenação dentro da mesma categoria (Cabelo, Sobrancelhas, Unhas, etc.)
- Salvar `sort_order` automaticamente ao soltar o item
- Mostrar toast "Ordem salva"

**3. Frontend público — aplicar a ordem**
- `ClientPortal.tsx` — ordenar lista de serviços por `sort_order ASC, name ASC`
- `src/pages/Services.tsx` e `src/pages/servicos/CategoryPage.tsx` — mesma ordenação
- `src/components/home/ServicesPreview.tsx` — respeitar `sort_order`

### Comportamento

- Ordenação é por categoria (cada categoria tem sua própria sequência)
- "Todos" no portal mostra serviços agrupados por categoria, e dentro de cada uma respeita o `sort_order`
- Serviços novos entram com `sort_order = 0` (aparecem no topo) até serem reordenados

### Arquivos afetados

- Migração SQL nova (adicionar coluna)
- `src/components/admin/ServicesTab.tsx` (drag-and-drop + UI)
- `src/pages/ClientPortal.tsx` (ordenar query)
- `src/pages/Services.tsx` (ordenar query)
- `src/pages/servicos/CategoryPage.tsx` (ordenar query)
- `src/components/home/ServicesPreview.tsx` (ordenar query)

### Fora do escopo

- Reordenação cross-categoria (não faz sentido visual)
- Reordenação de SKUs/Técnicas dentro de um serviço (já existe `sort_order` lá; pode ser próximo passo se quiser)
