

## Problemas de UI/UX Identificados

Analisei o screenshot e o código completo da home. Aqui estão os problemas encontrados:

### 1. Card "Cabelo" -- título sumiu (principal)
A descrição do serviço Cabelo é muito longa ("Extensões de cabelos, Highlights, progressiva, botox capilar, selagem, tratamentos capilares, corte, tintura, escova.") comparada com as outras duas categorias. Isso empurra o título "Cabelo" para fora da área visível do card, ou o torna quase invisível. No screenshot, vemos o texto da descrição mas o título com o ícone de tesoura não aparece.

**Correção:** Limitar a descrição a 2 linhas com `line-clamp-2` e garantir que o título sempre fique visível. Adicionar `flex flex-col justify-end` ao container de texto para ancorar o conteúdo na parte inferior.

### 2. Textos inconsistentes entre cards
Os 3 cards têm quantidades de texto muito diferentes -- Cabelo tem uma lista longa, Sobrancelhas e Unhas têm frases curtas. Isso quebra a harmonia visual.

**Correção:** Truncar descrições longas com `line-clamp-2` para manter altura uniforme entre os cards.

### Arquivo a editar

**`src/components/home/ServicesPreview.tsx`** -- apenas o bloco do overlay de texto (linhas 110-123):
- Adicionar `line-clamp-2` na tag `<p>` da descrição para limitar a 2 linhas
- Garantir que o container do texto tenha layout flex com `justify-end` para que título + descrição fiquem sempre ancorados no bottom do card

Mudança mínima, sem impacto em outras seções.

