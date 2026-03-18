

## Plan: Fluxo de Agendamento com Aprovacao Pendente no Portal do Cliente

### Contexto

Atualmente, quando o cliente agenda pelo portal, o booking vai direto para o Google Calendar como `confirmed`. O novo fluxo proposto:

1. Cliente seleciona servico no portal (ja funciona)
2. Cliente escolhe tecnica/opcao e horario
3. Ao concluir, booking fica com status `pending` (nao cria evento no Google Calendar ainda)
4. Admin ve o booking pendente no painel, verifica e confirma
5. Ao confirmar, cria o evento no Google Calendar e notifica o cliente (no portal + email via Resend futuramente)

### Mudancas Tecnicas

**1. Modificar o fluxo de booking do portal**

O `/book` atualmente passa pelo `calendar-hold` + `calendar-confirm-booking` que cria o evento no Google Calendar imediatamente. Para bookings vindos do portal, o fluxo sera:

- Quando o cliente vem do portal (detectado via query param `source=portal`), ao invés de chamar `calendar-confirm-booking`, inserir diretamente na tabela `bookings` com status `pending` (sem criar evento no Google Calendar)
- Remover o step de selecao de servico do `/book` quando o servico ja vem pre-selecionado do portal (ja funciona parcialmente com o auto-skip)

**2. Nova Edge Function: `calendar-approve-booking`**

- Recebe `booking_id`
- Busca o booking pendente
- Cria o evento no Google Calendar
- Atualiza status para `confirmed`
- (Futuro: envia notificacao por email)

**3. Atualizar o Admin - BookingsTab**

- Adicionar botao "Confirmar" nos bookings com status `pending`
- Ao clicar, chama `calendar-approve-booking`

**4. Atualizar o Portal do Cliente**

- Na aba `BookingsTab` do portal, mostrar bookings com status `pending` com badge amarelo
- Quando o admin confirmar, o status muda para `confirmed` e o cliente ve a mudanca

**5. Simplificar o fluxo de booking vindo do portal**

- Como o servico ja foi selecionado no portal (`/portal` -> `select-service`), o `/book` ja recebe `service_id` via query param
- O step "service" ja e pulado automaticamente
- Ao concluir o formulario, em vez de chamar hold+confirm, inserir direto como `pending`

### Sobre notificacoes

- Notificacao in-app: o portal ja busca bookings do cliente, entao o status `pending` -> `confirmed` sera visivel automaticamente
- Email (Resend): sera implementado em fase posterior conforme voce decidir. A infraestrutura de email do Lovable Cloud pode ser configurada quando estiver pronto

### Arquivos a criar/editar

| Arquivo | Acao |
|---|---|
| `src/pages/Book.tsx` | Adicionar modo `pending` para bookings do portal (sem hold/confirm do Google) |
| `supabase/functions/calendar-approve-booking/index.ts` | Nova edge function para admin aprovar booking |
| `src/components/admin/BookingsTab.tsx` | Adicionar botao de confirmacao para bookings pendentes |
| `src/pages/ClientPortal.tsx` | Atualizar BookingsTab para mostrar status pendente com badge |
| `src/pages/Confirmation.tsx` | Adaptar mensagem para bookings pendentes ("aguardando confirmacao") |

### Fluxo resumido

```text
Portal: Seleciona servico -> /book?service=X&source=portal
  |
  v
/book: Escolhe opcao -> Data -> Horario -> Formulario
  |
  v
Insere booking com status "pending" (sem Google Calendar)
  |
  v
Admin ve no painel -> Clica "Confirmar"
  |
  v
Edge function cria evento no Google Calendar -> status = "confirmed"
  |
  v
Cliente ve no portal: "Confirmado"
```

