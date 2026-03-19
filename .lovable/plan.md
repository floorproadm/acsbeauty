

## Plano: Melhorias UI/UX e Relatórios na Pagamentos Tab

### O que muda

**1. Seletor de período (filtro por data)**
- Adicionar pills de período no topo: "Semana", "Mês", "Trimestre", "Ano", "Todos"
- As métricas (Esperado, Recebido, Pendente) passam a refletir apenas o período selecionado
- A lista de bookings também filtra pelo período

**2. Botão de exportar relatório (padrão AXO)**
- Botão de download (ícone) ao lado do seletor de período
- Abre um Sheet (bottom sheet) com preview do relatório:
  - 3 cards: Receita Esperada, Recebido, Pendente
  - Breakdown por método de pagamento (Presencial, Online, Zelle, etc.)
  - Contagem de bookings no período
  - Botão "Baixar CSV" que gera e faz download do arquivo

**3. Escolha do método de pagamento ao marcar pago**
- Em vez de sempre marcar como "at_location", abrir um mini dropdown/popover com opções: Presencial, Dinheiro, Zelle, Venmo, Cartão
- Experiência mobile-first com botões grandes

**4. Melhorias visuais gerais**
- Animação suave nos cards de métricas (fade-in staggered)
- Contador animado nos valores das métricas
- Separador visual entre métricas e lista

### Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/components/admin/PaymentsTab.tsx` | Adicionar período, export, método de pagamento |
| `src/components/admin/PaymentExportSheet.tsx` | Criar (padrão AXO PerformanceExportSheet) |

### Detalhes técnicos

- **Filtro de período**: usar `date-fns` (`subWeeks`, `subMonths`, `startOfWeek`, etc.) para calcular ranges — mesma abordagem do AXO
- **Export Sheet**: componente separado usando `Sheet` (bottom, `max-h-[85vh]`), recebe bookings filtrados e período label, gera CSV com colunas: Cliente, Serviço, Data, Valor, Status, Método
- **Método de pagamento**: usar `Popover` com lista de botões para cada método, ao clicar executa a mutation com o método escolhido
- Nenhuma alteração de banco de dados necessária — `payment_method` já existe como `text`

