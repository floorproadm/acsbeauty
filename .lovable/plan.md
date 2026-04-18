

## Plano: ACS OS Inbox — Base Conversacional Multi-Canal (estilo Asky.ai+)

Vou montar um **inbox conversacional unificado** dentro do admin com automações WhatsApp, AI assistant para triagem de leads e agendamento via chat. Inspirado no Asky.ai, mas integrado nativamente ao seu CRM/Bookings/Clients.

### O que vamos construir

**1. Inbox Unificado (`/admin` → nova aba "Conversas")**
- Lista de conversas estilo WhatsApp/Intercom (avatar, última msg, badge não-lido, filtros por canal/status)
- Painel de chat central com histórico bidirecional
- Sidebar direita com perfil do cliente: histórico de bookings, tags, pontos ACS, notas
- Canais: WhatsApp (Cloud API), Site (contact form), Instagram DM (futuro), Manual

**2. WhatsApp Cloud API (Meta) — Camada de Mensageria**
- Edge function `whatsapp-send` (envio: template + texto livre)
- Edge function `whatsapp-webhook` (recebimento: mensagens, status delivery, read receipts)
- Templates aprovados na Meta (PT/EN): boas-vindas, confirmação, lembrete 24h, reagendamento, lead notification
- Janela de 24h respeitada (templates fora, livre dentro)

**3. AI Assistant (Lovable AI — google/gemini-2.5-flash)**
- Triagem automática de leads novos: identifica serviço de interesse, urgência, sentimento
- Sugestão de resposta para staff (1 clique pra enviar)
- Modo "Auto-reply" opcional: responde FAQs comuns (preço, horários, localização) fora do horário comercial
- Booking via chat: AI extrai serviço/data/hora da conversa e gera link `/book?service=X&date=Y`

**4. Automações Plugadas nos Eventos Existentes**
- `bookings INSERT (confirmed)` → WhatsApp confirmação cliente + notificação admin
- `bookings UPDATE (cancelled/rescheduled)` → WhatsApp cliente + admin
- `contact_submissions INSERT` → WhatsApp admin com card do lead + AI summary
- `whatsapp_clicks INSERT` → conta como lead inbound, abre conversa
- Cron 24h antes → lembrete (já existe `send-booking-reminders`, só plugar canal WA real)

### Arquitetura técnica

```text
┌─────────────────────────────────────────────────────┐
│                  ADMIN /admin                        │
│  ┌──────────────────────────────────────────────┐   │
│  │  Aba "Conversas" (ConversationsTab.tsx)      │   │
│  │  ┌─────────┬──────────────────┬───────────┐  │   │
│  │  │ Lista   │  Chat Window     │ Cliente   │  │   │
│  │  │ convs   │  (mensagens)     │ Sidebar   │  │   │
│  │  └─────────┴──────────────────┴───────────┘  │   │
│  └──────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────┘
               │ Realtime (postgres_changes)
               ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (Lovable Cloud)                │
│  Tabelas novas:                                      │
│    • conversations  (1 por cliente+canal)           │
│    • messages       (todas msgs in/out, multi-canal)│
│    • whatsapp_templates (cache templates Meta)      │
│    • automation_rules (triggers configuráveis)      │
└──────────────┬──────────────────────────────────────┘
               │
        ┌──────┴──────┬─────────────┬──────────────┐
        ▼             ▼             ▼              ▼
   whatsapp-      whatsapp-      ai-assist      send-booking-
   webhook        send           (Lovable AI)   reminders
   (recebe)       (envia)        (triagem)      (já existe)
        │             │
        └──────┬──────┘
               ▼
      Meta WhatsApp Cloud API
```

### Tabelas novas (additive — Safe Mode ✅)

```sql
conversations:
  id, client_id (nullable), channel (whatsapp|site|instagram|manual),
  external_id (phone/email), status (open|pending|closed|snoozed),
  assigned_to, last_message_at, unread_count, created_at

messages:
  id, conversation_id, direction (in|out), channel,
  body, media_url, template_name, sender_id (staff uuid se out),
  whatsapp_message_id, delivery_status (sent|delivered|read|failed),
  ai_generated (bool), created_at

whatsapp_templates:
  id, name, language (pt_BR|en_US), category, body_text,
  variables jsonb, status (approved|pending), created_at

automation_rules:
  id, trigger_event, conditions jsonb, action_type, template_id,
  is_active, created_at
```

### Setup Meta (você faz, eu te guio)

1. Meta Business Suite → criar app WhatsApp Business
2. Adicionar número (decisão pendente: 732-915-3430 dedicado vs novo)
3. Criar 5 templates bilíngues (eu te dou textos prontos pra copiar)
4. Configurar webhook URL: `https://jendyjqowldjzkityjse.supabase.co/functions/v1/whatsapp-webhook`
5. Me passar 3 secrets via Lovable Cloud: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`

### Diferenciais vs Asky.ai

| Recurso | Asky.ai | ACS OS (nosso) |
|---|---|---|
| Inbox unificado | ✅ | ✅ |
| WhatsApp Cloud API | ✅ | ✅ |
| AI triagem | ✅ | ✅ (Gemini 2.5 Flash gratuito via Lovable AI) |
| Booking via chat | ⚠️ limitado | ✅ integrado ao seu engine real |
| CRM nativo | ❌ separado | ✅ tudo na mesma base (clients, bookings, points) |
| Pontos ACS na conversa | ❌ | ✅ |
| Reengajamento auto | ⚠️ | ✅ (já existe ReengagementTab) |
| Custo mensal | ~$50-100 | $0 SaaS + ~$0.005-0.05/msg Meta |

### Implementação faseada (sugestão)

**Fase 1 — Fundação (esta sprint)**
- Migration: 4 tabelas novas + RLS
- Edge functions: `whatsapp-webhook`, `whatsapp-send`
- Aba "Conversas" no admin (UI básica: lista + chat + sidebar cliente)
- Realtime nas mensagens
- Plug nos eventos existentes (booking confirm/cancel/reschedule + lembrete + contact form)

**Fase 2 — AI Layer**
- Edge function `ai-conversation-assist` (Lovable AI)
- Botão "Sugerir resposta" no chat
- Auto-tag de leads (serviço, urgência, sentimento)
- Resumo de conversa longa

**Fase 3 — Automações Avançadas**
- Auto-reply fora do horário comercial
- Booking via chat (AI gera link contextual)
- Templates configuráveis no admin
- Métricas: tempo de resposta, taxa de conversão lead→booking

### O que fica pendente até você decidir

1. **Número WhatsApp** (732-915-3430 vs novo) — bloqueia setup Meta
2. **Aprovação dos 5 templates na Meta** (24-48h após você submeter)
3. **3 secrets** após setup Meta concluído

### Confirmação antes de começar

Posso ir direto pra **Fase 1** assumindo:
- Você vai decidir o número e fazer setup Meta em paralelo
- Eu construo toda infra (DB + edge functions + UI) usando placeholder seguro até você ter as credenciais
- Quando vierem os secrets, basta plugar e tudo funciona end-to-end

