

## Botão "Ver como cliente" em Admin → Serviços

Adicionar atalhos no admin para a Ane visualizar rapidamente como cada serviço/categoria aparece na página pública, sem precisar sair e navegar manualmente.

### O que adicionar

**1. Botão global no topo da aba Serviços**
Um botão "Ver página pública" ao lado do "+ Novo Serviço" que abre `/services` em nova aba.

**2. Ícone de olho (👁) em cada card de serviço**
Um botão pequeno ao lado do "Editar" / "Excluir" em cada card que abre a página pública daquele serviço específico em nova aba:
- Rota: `/servicos/{category_slug}/{service_slug}`
- Ex: `/servicos/cabelo/highlights`

**3. Ícone de olho por categoria (no header de cada grupo)**
No cabeçalho de cada categoria agrupada (Cabelo, Sobrancelhas, Unhas), um botão para abrir a página da categoria:
- Rota: `/servicos/{category_slug}`

### Comportamento

- Sempre abre em **nova aba** (`target="_blank"`) para Ane não perder o contexto do admin.
- Usa ícone `ExternalLink` ou `Eye` do lucide-react (consistente com o padrão visual).
- Tooltip "Ver como cliente" para clareza.
- Se o serviço estiver `is_active = false`, o botão fica desabilitado com tooltip "Ative o serviço para visualizar".

### Detalhes técnicos

- Arquivo único editado: `src/components/admin/ServicesTab.tsx`
- Sem mudanças de DB, sem novas rotas (todas já existem: `/services`, `/servicos/:categoria`, `/servicos/:categoria/:slug`)
- Usa `<a href={url} target="_blank" rel="noopener noreferrer">` envolvendo um `<Button variant="ghost" size="icon">`
- Slug da categoria já vem do agrupamento existente; slug do serviço já está no objeto `Service`

### Resultado visual

```text
[Aba Serviços]
┌─────────────────────────────────────────────┐
│ Buscar serviços...    [👁 Ver pública] [+ Novo]│
├─────────────────────────────────────────────┤
│ ▼ Cabelo                              [👁]  │
│   ┌─────────────────────────────────────┐   │
│   │ Highlights              [👁][✏][🗑] │   │
│   │ 3 opções • 180min                   │   │
│   └─────────────────────────────────────┘   │
│ ▼ Sobrancelhas                        [👁]  │
└─────────────────────────────────────────────┘
```

