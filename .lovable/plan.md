

## Remover Preços das Páginas Públicas

O objetivo é esconder todos os valores monetários ($) das páginas públicas do site -- booking, catálogo de serviços e detalhe de serviço. Os preços continuam no banco para uso interno/admin.

### Arquivos a editar

**1. `src/pages/Book.tsx`** (3 blocos)
- **Linha ~703-705**: Remover o "Grátis" / "Free" do card de Consulta
- **Linhas ~747-756**: Remover o bloco `<div className="text-right">` com `$svc.price` / `$svc.promo_price` da lista de serviços
- **Linhas ~852-861**: Remover o bloco `<div className="text-right">` com `$sku.price` / `$sku.promo_price` da lista de SKUs

**2. `src/pages/servicos/CategoryPage.tsx`** (1 bloco)
- **Linhas ~203-205**: Remover o "a partir de $X" do card de serviço na página de categoria

**3. `src/pages/servicos/ServiceDetail.tsx`** (2 blocos)
- **Linhas ~244-247**: Remover o bloco "a partir de $X" com ícone DollarSign do header
- **Linhas ~406-413**: Remover os preços da lista de SKUs na página de detalhe

Mudança simples -- apenas remoção de JSX de preço. Nenhuma alteração no banco de dados ou lógica.

