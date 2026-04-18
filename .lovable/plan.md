
## Análise — Aba "Agendamentos" do Admin

### O que existe hoje

**Visualizações:** Lista, Semana e Mês.
**Ações por agendamento:** Confirmar, Cancelar, Remarcar, Concluir, Não compareceu, atribuir profissional, abrir WhatsApp.
**Filtros:** Busca por cliente, período (Hoje/Amanhã/7d/30d/Todos), status.

### Problemas identificados

1. **Nenhum indicador de pendências** no topo — staff precisa olhar a lista para ver quantos pedidos aguardam aprovação.
2. **Filtro de período limitado** — sem "Amanhã + 7 dias", sem range customizado, sem filtro por profissional.
3. **Visão semanal/mensal sem grade de horários reais** — só mostra blocos por dia, sem visualização tipo agenda (08h, 09h, 10h…). Difícil ver lacunas de horário.
4. **Ações em lote inexistentes** — não dá pra confirmar/cancelar múltiplos pedidos de uma vez.
5. **Modal de detalhes sem histórico** — não mostra outros agendamentos do mesmo cliente, nem se é primeira visita.
6. **Sem indicador visual de "novo cliente"** vs cliente recorrente na lista.
7. **Remarcar usa Dialog** — em mobile fica apertado; melhor usar Sheet (drawer lateral) que combina com o resto do admin.
8. **Sem opção de exportar/imprimir** a agenda do dia para a equipe.
9. **Cores de status inconsistentes** entre lista (border-l + badge) e calendário (background colorido). Padronizar.
10. **Filtro "Hoje" não destaca o "agora"** — não há separador "próximos vs já passaram hoje".
11. **Telefone na lista não é clicável** para WhatsApp diretamente — só via botão separado.
12. **Sem contador rápido** por status no topo (ex: "3 aguardando · 12 confirmados hoje").

### Proposta de melhorias (priorizadas)

**Tier 1 — Alta prioridade (impacto operacional direto)**

1. **Header com KPIs do período**: 4 cards compactos no topo mostrando "Aguardando", "Hoje", "Esta semana", "Receita estimada". Clicar filtra.
2. **Banner de pendências persistente** quando há `requested` no período: "Você tem X agendamentos aguardando aprovação · [Ver agora]".
3. **Visão diária por horários** (nova aba "Dia"): timeline 08h–20h em coluna única estilo Google Calendar, com blocos posicionados pelo horário real e duração. Fica claro o que é gap.
4. **Filtro por profissional** no modo lista e calendário (dropdown que carrega `staff_profiles`).
5. **Indicador de cliente novo vs recorrente** na lista (badge "Novo cliente" para `client_id` sem bookings anteriores ou para emails inéditos).

**Tier 2 — Média prioridade (UX e produtividade)**

6. **Modal de detalhes com mini-histórico**: últimos 3 agendamentos do mesmo cliente, total gasto, frequência. Ajuda na decisão de aprovar/remarcar.
7. **Remarcar vira Sheet lateral** (não Dialog) — mais espaço, melhor em mobile, padroniza com outras abas.
8. **Ações em lote**: checkbox por linha + barra inferior "Confirmar X · Cancelar X" para `requested`.
9. **Exportar dia** como PDF/print da agenda do dia (lista impressa para equipe).
10. **Range customizado de datas** no filtro (DateRangePicker).

**Tier 3 — Polimento**

11. **Padronizar cores de status** — usar mesma palette (background suave + border-l) na lista E no calendário.
12. **Separador "Agora" na visão Hoje**: linha visual marcando o momento atual entre os agendamentos passados e futuros.
13. **Telefone clicável direto** na linha (não só botão).
14. **Atalhos de teclado** no modal: `C` confirma, `R` remarca, `X` cancela.

### Sugestão de execução

Recomendo começar pelo **Tier 1** num único ciclo (header KPIs + banner pendências + filtro profissional + visão Dia + badge novo cliente). É o que mais muda a operação no dia-a-dia. Tier 2 e 3 em ciclos seguintes.

### Arquivos afetados (Tier 1)

- `src/components/admin/BookingsTab.tsx` — KPIs, banner, filtro profissional, nova aba "Dia"
- `src/components/admin/BookingDayView.tsx` — **novo**, timeline diária por horário
- Query de bookings — adicionar `staff_id` ao filtro e contagem por cliente

### Pergunta antes de executar

Quer que eu execute todo o **Tier 1** de uma vez, ou prefere dividir (ex: começar só pela visão "Dia" + KPIs)?
