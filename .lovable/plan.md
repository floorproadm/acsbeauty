## Objetivo

Substituir o fluxo atual ("admin adiciona email em `allowed_emails` → usuário cria conta sozinho") por um **fluxo de convite formal** com token único, e-mail de convite, expiração e rastreio de status.

`allowed_emails` continua existindo (é a lista de autorização que o trigger `handle_new_user` consulta), mas agora é **populada automaticamente** quando um convite é aceito — não mais manualmente.

---

## 1. Banco de dados (migration)

Nova tabela `admin_invites`:

- `id`, `created_at`, `updated_at`
- `email` (text, único quando status = pending)
- `role` (app_role: admin_owner | staff | marketing)
- `token` (text, único, gerado via `gen_random_uuid()::text`)
- `status` (enum novo `invite_status`: `pending`, `accepted`, `expired`, `revoked`)
- `invited_by` (uuid → auth.users)
- `expires_at` (timestamptz, default `now() + 7 days`)
- `accepted_at` (timestamptz, nullable)
- `accepted_by` (uuid, nullable)

RLS:
- `admin_owner` faz tudo
- Sem SELECT público (token é validado server-side via edge function)

Função `expire_old_invites()` (chamada por edge function ou trigger leve antes de leitura) que marca como `expired` quem passou de `expires_at`.

Trigger `handle_new_user` mantido — `allowed_emails` continua sendo a fonte de verdade para o signup.

---

## 2. Edge Functions

### `invite-admin` (verify_jwt = true, admin_owner only)
- Input: `{ email, role }`
- Valida que caller é `admin_owner` (via JWT + `has_role`)
- Cria registro em `admin_invites` (status `pending`, token novo, expira em 7d)
- Envia email via gateway Gmail (mesmo padrão de `notify-internal`) com link:
  `https://acsbeautystudio.com/admin/accept-invite?token=XXX`
- Template bilíngue PT, branding ACS (cream/bronze)

### `accept-admin-invite` (verify_jwt = false, público)
- Input: `{ token }`
- Valida token: existe, status = `pending`, `expires_at > now()`
- Retorna `{ email, role, valid: true }` para a página exibir
- Endpoint separado `POST /confirm` que, após o usuário criar conta/logar, é chamado com JWT e:
  - Confirma que `auth.uid().email == invite.email`
  - Insere em `allowed_emails` (idempotente)
  - Insere em `user_roles` (caso conta já exista)
  - Marca invite como `accepted`

### `revoke-admin-invite` (verify_jwt = true, admin_owner only)
- Marca status como `revoked`

### `resend-admin-invite` (verify_jwt = true, admin_owner only)
- Re-envia email, opcionalmente regenera token e estende `expires_at`

---

## 3. Frontend

### Nova página `src/pages/AdminAcceptInvite.tsx` (rota `/admin/accept-invite`)
1. Lê `?token=` da URL
2. Chama `accept-admin-invite` para validar → mostra email + role + nome do convite
3. Se token inválido/expirado → mensagem de erro com CTA para contatar admin
4. Se válido:
   - Form de senha (signup) ou "Já tenho conta → fazer login"
   - Após auth bem-sucedida, chama `accept-admin-invite/confirm` com JWT
   - Redireciona para `/admin`

### Substituir `AllowedEmailsTab.tsx` por `AdminInvitesTab.tsx`
- Form: enviar convite (email + role)
- Tabela: email, role, status (badge colorido), enviado em, expira em, ações (reenviar, revogar)
- Mantém compatibilidade: lista também `allowed_emails` legados como "✓ ativo" no final

---

## 4. Fluxo do usuário

```
Admin abre painel → Convidar Admin
  → preenche email + role → "Enviar convite"
  → email chega na caixa do convidado com link único
Convidado clica no link
  → /admin/accept-invite?token=XXX
  → vê "Você foi convidado como Staff por Ane Caroline"
  → cria senha → conta criada → invite marcado como accepted
  → redirecionado para /admin com acesso total
```

---

## Detalhes técnicos

- Token: `crypto.randomUUID()` (32+ chars, suficiente)
- Email subject: `🎉 Você foi convidado para o ACS Beauty OS`
- Email body: branding ACS (cream `#f5f0eb`, bronze `#8b7355`, Playfair Display title)
- Reuso: cabeçalho/CTA do `notify-internal` (extrair `wrap()` para `_shared/email-wrapper.ts`)
- Idempotência: se email já em `allowed_emails`, convite ainda pode ser enviado (re-promoção de role)
- Cleanup: convites `expired`/`revoked` mantidos para auditoria

---

## Arquivos

**Criados:**
- `supabase/functions/invite-admin/index.ts`
- `supabase/functions/accept-admin-invite/index.ts`
- `supabase/functions/revoke-admin-invite/index.ts`
- `supabase/functions/resend-admin-invite/index.ts`
- `src/pages/AdminAcceptInvite.tsx`
- `src/components/admin/AdminInvitesTab.tsx`

**Editados:**
- `src/App.tsx` (nova rota)
- `src/pages/Admin.tsx` (substituir AllowedEmailsTab por AdminInvitesTab)
- `supabase/config.toml` (4 functions novas)

**Mantido:**
- `AllowedEmailsTab.tsx` fica como referência (pode ser removido depois) ou já removo na migração.

---

Confirma que posso implementar? Alguma decisão pra ajustar (expiração ≠ 7 dias, manter aba antiga, etc)?