

# Gift Cards — Plano de Implementação

Inspirado no Gene Juarez, adaptado para ACS Beauty Studio. Pagamento via Stripe + opção WhatsApp.

---

## Fluxo do Usuário

```text
/gift-cards
  1. Escolher valor (preset: $50, $100, $150, $200, custom)
  2. Dados do destinatário (nome, email)
  3. Ocasião (Aniversário, Obrigada, Qualquer Ocasião, etc.)
  4. Mensagem personalizada (opcional)
  5. Dados do comprador (nome, email)
  6. Escolher: Pagar com cartão (Stripe) OU Finalizar via WhatsApp
  7. Preview do gift card ao lado (live update)
```

---

## Database: Tabela `gift_cards`

```sql
CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- código resgatável (ex: ACS-XXXX-XXXX)
  amount numeric NOT NULL,
  balance numeric NOT NULL,                -- saldo restante
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  occasion text,
  personal_message text,
  status text NOT NULL DEFAULT 'pending',  -- pending, paid, delivered, redeemed, expired
  payment_method text,                     -- stripe, whatsapp
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '1 year')
);
```

RLS: public INSERT (anyone can buy), admin ALL, staff SELECT.

---

## Stripe Integration

Habilitar Stripe via ferramenta do Lovable. Criar edge function `create-gift-card-payment`:
- Recebe amount + gift card data
- Cria PaymentIntent no Stripe
- Salva gift card com status `pending`
- Retorna `client_secret` para Stripe Elements no frontend

Webhook edge function `stripe-gift-card-webhook`:
- Escuta `payment_intent.succeeded`
- Atualiza gift card para `paid`
- Gera código único (ACS-XXXX-XXXX)

---

## WhatsApp Flow (alternativo)

- Salva gift card com `payment_method = 'whatsapp'`, `status = 'pending'`
- Redireciona para WhatsApp com mensagem pré-preenchida contendo detalhes do gift card
- Admin confirma manualmente no painel e atualiza status

---

## Frontend: `/gift-cards`

Página com layout split (como Gene Juarez):
- **Lado esquerdo**: Formulário multi-step (valor → destinatário → ocasião → mensagem → pagamento)
- **Lado direito**: Preview do gift card (atualiza em tempo real)

Componentes:
- `src/pages/GiftCards.tsx` — página principal
- `src/components/gift-cards/GiftCardForm.tsx` — formulário multi-step
- `src/components/gift-cards/GiftCardPreview.tsx` — preview visual do cartão

---

## Admin: Tab Gift Cards

Adicionar tab no admin para gerenciar gift cards:
- Lista de gift cards vendidos
- Filtro por status (pending, paid, delivered)
- Ação manual: confirmar pagamento WhatsApp
- Ver saldo restante

---

## Arquivos

| Ação | Arquivo |
|------|---------|
| Migration | Nova tabela `gift_cards` |
| Habilitar | Stripe (via ferramenta) |
| Criar | Edge function `create-gift-card-payment` |
| Criar | Edge function `stripe-gift-card-webhook` |
| Criar | `src/pages/GiftCards.tsx` |
| Criar | `src/components/gift-cards/GiftCardForm.tsx` |
| Criar | `src/components/gift-cards/GiftCardPreview.tsx` |
| Editar | `src/App.tsx` — rota `/gift-cards` |
| Editar | `src/components/layout/Header.tsx` — link no nav |
| Editar | `src/pages/Admin.tsx` — tab Gift Cards |

---

## Ordem de Execução

1. Habilitar Stripe
2. Migration `gift_cards`
3. Edge functions (payment + webhook)
4. Página `/gift-cards` com formulário + preview
5. Admin tab
6. Header/Footer links

