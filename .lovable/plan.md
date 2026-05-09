
## Objetivo

Enviar notificações internas para **acsbeautystudio@gmail.com** sempre que:
1. 🆕 Um novo **booking** for solicitado (status `requested`)
2. ✅ Um booking for **confirmado** ou ❌ **cancelado**
3. 🎁 Uma nova compra de **Gift Card** for registrada

Tudo via conta **Gmail oficial do estúdio** (a conectar agora).

Sobre o "remover Resend": confirmado que **não há Resend instalado no código atual** — só uma menção em memória que será atualizada. Nada quebra.

---

## Etapas

### 1. Conectar Gmail
Abrir o conector `google_mail` para você fazer login com `acsbeautystudio@gmail.com` e autorizar o escopo `gmail.send`. Após isso, o secret `GOOGLE_MAIL_API_KEY` fica disponível nas Edge Functions.

### 2. Criar Edge Function `notify-internal`
Função única e genérica que recebe `{ type, payload }` e monta o email apropriado, enviando via Gmail Gateway (`https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send`).

Tipos suportados:
- `booking_requested` — assunto `🆕 Novo agendamento solicitado — {cliente}`
- `booking_confirmed` — assunto `✅ Booking confirmado — {cliente} {data}`
- `booking_cancelled` — assunto `❌ Booking cancelado — {cliente} {data}`
- `giftcard_purchased` — assunto `🎁 Nova compra Gift Card — ${valor}`

Cada email leva: nome cliente, telefone, serviço/SKU, data/hora (NY), preço, link para `/admin`. Layout HTML simples, branded (cream + bronze).

Idempotência: header `X-Idempotency-Key` baseado no booking_id/giftcard_id + tipo, para evitar duplicatas em retry.

### 3. Disparos
- **Booking solicitado / confirmado / cancelado**: invocar `notify-internal` no final das edge functions já existentes:
  - `calendar-hold` (quando cria booking `requested` via portal) ou no fluxo `/portal` que cria a request
  - `calendar-confirm-booking` e `calendar-approve-booking` → `booking_confirmed`
  - `calendar-cancel-booking` → `booking_cancelled`
- **Gift Card**: no insert da tabela `gift_card_orders` (frontend `GiftCardForm`) chamar `supabase.functions.invoke('notify-internal', ...)` logo após o insert.

Falha no envio do email **nunca** bloqueia o fluxo principal — só loga warning.

### 4. Limpeza
- Atualizar `mem://features/email-notifications` para refletir "Gmail (conta do estúdio) para notificações internas; Resend não usado".
- Atualizar índice de memórias.

---

## Detalhes técnicos

**Edge function** (`supabase/functions/notify-internal/index.ts`):
- `verify_jwt = false` (chamada server-to-server entre edge functions; rate-limit por tipo+id)
- Valida payload com Zod
- Monta RFC 2822 → base64url → POST para gateway Gmail
- `From: ACS Beauty OS <acsbeautystudio@gmail.com>` / `To: acsbeautystudio@gmail.com`
- Templates HTML inline (sem React Email — overkill p/ notificação interna)

**Config**: adicionar bloco em `supabase/config.toml`:
```
[functions.notify-internal]
verify_jwt = false
```

**Sem mudanças de schema.** Não cria tabelas novas (notificações são fire-and-forget; histórico já existe nas tabelas `bookings` e `gift_card_orders`).

---

## Fora de escopo
- Notificar cliente final por email (continua sendo WhatsApp como hoje)
- Templates editáveis no admin
- Inbox / leitura de emails dentro do OS (pode vir depois)
