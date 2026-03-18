

## Problema

Quando o cliente seleciona um servico no portal e e redirecionado para `/book?service=UUID&source=portal`, o Book.tsx mostra a selecao de servico novamente — sendo que o servico ja foi escolhido no portal. E redundante e quebra a experiencia.

Alem disso, o botao "Voltar" no step "sku" leva para o step "service" dentro do Book.tsx (que nao deveria existir nesse fluxo), em vez de voltar ao portal.

## Correcoes no `src/pages/Book.tsx`

### 1. Garantir que o step inicial nunca seja "service" quando vem do portal
- Quando `isPortalSource && serviceParam`, o step inicial deve ser `"sku"` (ja e assim, mas precisa garantir que nao regride)
- O auto-skip de SKU (linhas 296-317) ja avanca para `"date"` quando so tem 1 SKU ou nenhuma variacao — isso continua funcionando

### 2. Corrigir o handleBack para fluxo portal
- Quando `step === "sku"` e `isPortalSource`: em vez de ir para `step("service")`, fazer `navigate(-1)` (volta ao portal)
- Quando `step === "date"` e `isPortalSource` e nao tem SKUs multiplos: tambem `navigate(-1)`

### 3. Remover "service" dos allSteps quando vem do portal
- Na funcao `allSteps` (linha 649-655): quando `isPortalSource`, nunca incluir "service"

### Resultado esperado

```text
Portal: seleciona servico → /book?service=UUID&source=portal
  ↓
Book.tsx: step = "sku"
  ↓ (auto-skip se so 1 opcao)
Book.tsx: step = "date" → "time" → "form"
  ↓ (back no primeiro step)
Volta ao portal (navigate(-1))
```

Nenhum step "service" aparece quando o servico ja veio selecionado do portal.

