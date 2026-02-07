

# Plano: Unificar WhatsApp Drawer com Contact Submissions

## Resumo
Remover o formulário de contato da página `/contact`, manter apenas o botão WhatsApp flutuante, e fazer o drawer salvar os dados na tabela `contact_submissions` em vez de `whatsapp_clicks`.

## Mudanças

### 1. Página /contact (Contact.tsx)
- Remover a importação e uso do componente `ContactForm`
- Manter o layout da página com informações de contato (telefone, email, endereço, horários)
- Ajustar o grid para ocupar espaço total sem o formulário
- O botão WhatsApp flutuante já aparece nesta página

### 2. WhatsApp Drawer (WhatsAppDrawer.tsx)
- Mudar a inserção de `whatsapp_clicks` para `contact_submissions`
- Mapear os campos:
  - `client_name` → `name`
  - `service_interest` → `service_interest`
  - `urgency` → incluir na `message` (mensagem formatada)
  - `page_path` + `utm_*` → manter
- Adicionar campo `message` com texto formatado incluindo urgência
- Status padrão: `'novo'`

### 3. CRM UnifiedLeadsTab (UnifiedLeadsTab.tsx)
- Remover referências à tabela `whatsapp_clicks`
- Manter apenas `quiz_responses` e `contact_submissions` como fontes
- Atualizar filtros e lógica de status/delete

### 4. Arquivos para remover
- `src/components/contact/ContactForm.tsx` (não mais necessário)

## Detalhes Técnicos

### Mapeamento de dados (WhatsApp → contact_submissions)

```text
┌─────────────────────┬────────────────────────────┐
│ Campo antigo        │ Campo novo                 │
├─────────────────────┼────────────────────────────┤
│ client_name         │ name                       │
│ service_interest    │ service_interest           │
│ urgency             │ (incluído em message)      │
│ page_path           │ (não existe, usar UTM)     │
│ utm_source          │ utm_source                 │
│ utm_campaign        │ utm_campaign               │
│ utm_medium          │ utm_medium                 │
│ -                   │ message (texto formatado)  │
│ -                   │ email (null)               │
│ -                   │ phone (null)               │
└─────────────────────┴────────────────────────────┘
```

### Formato da mensagem salva
```
Contato via WhatsApp
Serviço: [nome do serviço]
Urgência: [urgência selecionada]
Página: [path da página]
```

## Resultado
- Uma única tabela `contact_submissions` para todos os leads de contato
- Pipeline unificado no CRM
- Página `/contact` mais limpa com apenas informações e botão WhatsApp

