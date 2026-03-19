

## Plano: Reengajamento de Inativos (substituir aba Captação)

### O que muda

A sub-aba "Captação" dentro do CRM será substituída por "Reengajamento" — uma lista automática de clientes que precisam de atenção, segmentada pelos mesmos critérios de frequência que já existem no sistema (Ocasional 31-60d, Ausente 61-90d, Inativo 90d+).

### Funcionalidades

**1. Lista segmentada por urgência**
- 3 filtros por pill: Ocasional (31-60d), Ausente (61-90d), Inativo (90d+)
- Default: mostrar todos, ordenados por dias sem visita (mais urgentes primeiro)
- Cards com: nome, telefone, último serviço, dias sem visita, badge de status com cor

**2. Ações rápidas por cliente**
- Botão WhatsApp: abre WhatsApp com mensagem pré-preenchida de reengajamento (ex: "Oi [nome], sentimos sua falta! Que tal agendar seu próximo horário?")
- Botão "Marcar contatado": adiciona tag `reengajamento-contatado` + data no cliente, removendo da lista ativa (ou movendo para seção "Contatados")
- Botão "Agendar": redireciona para criar booking manual

**3. Métricas no topo**
- 3 cards: total Ocasionais, total Ausentes, total Inativos
- Contagem atualizada automaticamente com base em `last_visit_at`

**4. Remoção do Quiz**
- Remover referências a `quiz_responses` do UnifiedLeadsTab
- A sub-aba passa a ser "Reengajamento" com ícone de sino/alerta
- Leads do WhatsApp (contact_submissions) continuam existindo na base mas não aparecem mais nesta aba — ficam acessíveis apenas se necessário futuramente

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/admin/ReengagementTab.tsx` | Criar — novo componente com lista de clientes inativos |
| `src/components/admin/CRMTab.tsx` | Trocar UnifiedLeadsTab por ReengagementTab, renomear aba |

### Detalhes técnicos

- Query na tabela `clients` com `last_visit_at` not null, calculando `differenceInDays` no frontend (mesma lógica de `ClientsTab.tsx` linhas 168-174)
- Buscar último booking de cada cliente via join: `clients` + `bookings` (último por `start_time` com status `confirmed` ou `completed`) para mostrar "último serviço"
- Mensagem WhatsApp montada com template: `https://wa.me/1${phone}?text=...`
- Tag `reengajamento-contatado` usa o campo `tags[]` que já existe na tabela clients
- Sem alterações de banco de dados necessárias

