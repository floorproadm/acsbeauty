

## Simplificar a Seção de Serviços no Admin

### Problema Atual
A seção tem duas abas (Serviços + Opções) com informações duplicadas e uma tabela complexa na aba Opções. No mobile (390px), a tabela de Técnicas/Opções fica apertada e difícil de usar. A separação entre as duas abas força o admin a alternar constantemente.

### Proposta: Layout Unificado com Accordion

Remover as duas abas e usar um layout único com **Collapsible/Accordion por categoria**. Cada serviço vira um card compacto que expande para mostrar técnicas e opções inline.

```text
┌─────────────────────────────┐
│ Serviços          [+ Novo]  │
│ 12 serviços ativos          │
├─────────────────────────────┤
│ ▼ Cabelo (5)                │
│ ┌─────────────────────────┐ │
│ │ Corte Feminino    [Ativo]│ │
│ │ 60min · $80       [Edit] │ │
│ │ ► 2 técnicas · 3 opções  │ │ ← tap expande
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Coloração         [Ativo]│ │
│ │ 120min · $150     [Edit] │ │
│ └─────────────────────────┘ │
│                             │
│ ▼ Sobrancelhas (3)          │
│ ...                         │
└─────────────────────────────┘
```

### Mudanças

1. **Remover as sub-abas** (Serviços/Opções) — tudo fica em uma tela só
2. **Cards compactos por serviço** — nome, duração, preço, status badge e switch ativo/inativo em uma linha
3. **Linha clicável "Técnicas & Opções"** — ao clicar, expande inline mostrando as técnicas e opções daquele serviço (sem navegar para outra aba)
4. **Categorias colapsáveis** — cada categoria (Cabelo, Sobrancelhas, Unhas) pode ser expandida/recolhida
5. **Botões de ação simplificados** — apenas ícone de editar (sem texto) para economizar espaço no mobile
6. **Remover banner informativo** e header duplicado da SkusTab

### Arquivos Alterados
- `src/components/admin/ServicesTab.tsx` — reescrever com layout unificado usando Collapsible + inline técnicas/opções

