
# Kanban como View Principal no CRM Captação

## Objetivo
Definir a visualização Kanban (board) como padrão ao abrir a aba de Captação no CRM, em vez da visualização de tabela.

## Mudança

### UnifiedLeadsTab.tsx (linha 325)

**Antes:**
```typescript
const [viewMode, setViewMode] = useState<ViewMode>("table");
```

**Depois:**
```typescript
const [viewMode, setViewMode] = useState<ViewMode>("board");
```

## Resultado
- Ao acessar CRM → Captação, o usuário verá imediatamente o Kanban com as 4 colunas de status
- O botão de toggle continua disponível para alternar para visualização em tabela quando necessário
- Nenhuma outra mudança de lógica é necessária
