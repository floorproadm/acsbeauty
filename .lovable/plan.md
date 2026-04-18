

## Plano: Páginas dedicadas para Maquiagem e Tratamentos

### Problema
A página `/services` lista dinamicamente todas as categorias do banco (`services.category_slug`), incluindo `maquiagem` e `tratamentos`. Mas o `CategoryPage.tsx` só tem config para `cabelo`, `sobrancelhas` e `unhas` no `CATEGORY_CONFIG`. Quando o usuário clica em Maquiagem/Tratamentos, dá erro: `Cannot read properties of undefined (reading 'icon')` (confirmado no runtime-errors).

### Solução

**1. Adicionar 2 categorias ao `CATEGORY_CONFIG` em `src/pages/servicos/CategoryPage.tsx`**
- `maquiagem`: ícone `Brush` (lucide), imagem fallback
- `tratamentos`: ícone `Sparkles` ou `Droplet`, imagem fallback
- Chaves de tradução (`badgeKey`, `titleKey`, `subtitleKey`, `aboutTitleKey`, `aboutTextKey`)

**2. Adicionar traduções PT/EN no `LanguageContext.tsx`** para:
- `servicos.maquiagem.badge` / `.title` / `.subtitle` / `.about_title` / `.about_text`
- `servicos.tratamentos.badge` / `.title` / `.subtitle` / `.about_title` / `.about_text`

**3. Fallback defensivo no `CategoryPage.tsx`**: se `config` for undefined, redirecionar para `/services` em vez de quebrar (proteção futura).

**4. Imagens fallback**:
- Verificar se existem assets em `src/assets/` para maquiagem/tratamentos
- Se não, reutilizar `hair-service.png` como fallback temporário e marcar como TODO

**5. Atualizar ícone em `Services.tsx`** (`CATEGORY_META`) para que os cards de Maquiagem e Tratamentos também tenham ícone correto na grid.

### Arquivos a editar
- `src/pages/servicos/CategoryPage.tsx` — adicionar 2 entries no config + guard
- `src/pages/Services.tsx` — adicionar 2 entries no `CATEGORY_META`
- `src/contexts/LanguageContext.tsx` — adicionar 10 chaves de tradução (5 PT + 5 EN por categoria × 2)

### Bônus rápido
Limpar o erro runtime atual que está aparecendo no preview do `/services` quando alguém clica em Maquiagem ou Tratamentos.

