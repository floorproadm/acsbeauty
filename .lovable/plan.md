
# Plano: Ativar Integração Google Calendar

## Diagnóstico
Após analisar o sistema, identifiquei que:
- ✅ O secret `GOOGLE_SERVICE_ACCOUNT_JSON` **já existe** no backend (só precisa ter o valor atualizado com o JSON correto)
- ✅ Edge Functions estão prontas e bem implementadas
- ✅ Configurações de horário e dias de funcionamento já existem
- ❌ **Problema:** A tabela `calendar_integrations` está **vazia** - não há registro conectando ao Google Calendar

## O que será feito

### 1. Atualizar Secret com JSON Correto
Configurar o `GOOGLE_SERVICE_ACCOUNT_JSON` com as credenciais que você forneceu.

### 2. Inserir Configuração do Calendário
Adicionar registro na tabela `calendar_integrations` com:
- **Calendar ID:** `acsbeautystudio@gmail.com` (o calendário que você compartilhou)
- **Provider:** `google`
- **Timezone:** `America/New_York`
- **Status:** Ativo

### 3. Testar Integração Completa
Verificar se:
- API de disponibilidade retorna horários
- Sistema de reserva funciona

---

## Detalhes Técnicos

### Estrutura Atual
```text
┌─────────────────────────────────────────────────────────────┐
│                        FLUXO DE BOOKING                      │
├─────────────────────────────────────────────────────────────┤
│  1. Cliente seleciona data → calendar-availability          │
│  2. Seleciona horário → calendar-hold (reserva 5 min)       │
│  3. Preenche dados → calendar-confirm-booking               │
│     └── Cria evento no Google Calendar                      │
│     └── Salva booking no banco                              │
│  4. Redirecionado para /confirm/:bookingId                  │
└─────────────────────────────────────────────────────────────┘
```

### Configurações Existentes
- **Dias abertos:** Terça a Sábado (10:00 - 19:00)
- **Dias fechados:** Domingo e Segunda
- **Buffer entre agendamentos:** 10 minutos
- **Intervalo de slots:** 30 minutos
- **Máximo de antecedência:** 60 dias

### SQL a Executar
```sql
INSERT INTO calendar_integrations (
  provider, 
  calendar_id, 
  timezone, 
  is_active
) VALUES (
  'google',
  'acsbeautystudio@gmail.com',
  'America/New_York',
  true
);
```

---

## Resultado Esperado
Após a implementação:
- Página `/book` mostrará horários disponíveis do Google Calendar
- Agendamentos criados aparecerão automaticamente no "ACS Calendar"
- Painel admin poderá gerenciar, remarcar e cancelar agendamentos

