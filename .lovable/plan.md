

# Auditoria de Governança de Dados - ACS Beauty OS

## Sumário Executivo

Esta auditoria analisa a consistência de dados entre o painel Admin e o Frontend público, identifica gaps de sincronização, e avalia a preparação para features futuras (SKUs, variações, loyalty, referrals).

---

## 1. Mapa de Tabelas e Responsabilidades

| Tabela | Admin CRUD | Front Read | Front Write | Sync Status |
|--------|------------|------------|-------------|-------------|
| `services` | ServicesTab | /book, /services | - | OK |
| `clients` | ClientsTab | - | Edge Function | OK |
| `bookings` | BookingsTab | /confirm/:id | Edge Function | OK |
| `tasks` | Pendente | - | - | INCOMPLETO |
| `business_hours` | - | Edge Function | - | OK |
| `calendar_integrations` | - | Edge Function | - | OK |
| `quiz_responses` | LeadsTab | - | /quiz/:slug | OK |
| `whatsapp_clicks` | WhatsAppLeadsTab | - | WhatsAppDrawer | OK |
| `packages` | ARQUIVADO | ARQUIVADO | - | N/A |
| `offers` | ARQUIVADO | ARQUIVADO | - | N/A |

---

## 2. Gaps Identificados

### 2.1 CRÍTICO: UI de Tarefas Não Implementada

**Status**: A tabela `tasks` existe no banco com a estrutura correta, MAS os componentes de UI não foram criados.

**Evidências**:
- Migração executada com sucesso (tabela existe)
- Arquivos ausentes: `TasksTab.tsx`, `TaskModal.tsx`, `TaskKanbanView.tsx`, `TaskCalendarView.tsx`
- `AdminTab` type não inclui "tasks"
- `Admin.tsx` não renderiza TasksTab

**Impacto**: Funcionalidade prometida está inacessível.

---

### 2.2 CRÍTICO: Birthday Widget Não Implementado

**Status**: A coluna `birthday` existe na tabela `clients`, MAS:
- O `ClientEditModal.tsx` não tem campo para editar aniversário
- O `BirthdayWidget.tsx` não foi criado
- O `DashboardTab.tsx` não exibe aniversariantes

**Evidência**: O arquivo `src/components/admin/BirthdayWidget.tsx` não existe.

---

### 2.3 Serviços: Gap entre Admin e Front

**Admin (ServicesTab.tsx)**:
```typescript
// Admin pode criar serviços em QUALQUER categoria
const CATEGORIES = ["Cabelo", "Sobrancelhas", "Unhas"];
```

**Front (Services.tsx)**:
```typescript
// Front usa lista ESTÁTICA hardcoded
const services = [
  { id: "cabelo", namePt: "Cabelo", ... },
  { id: "sobrancelhas", namePt: "Sobrancelhas", ... },
  { id: "unhas", namePt: "Unhas", ... },
];
```

**Problema**: Se o admin criar um serviço com categoria diferente (ex: "Maquiagem"), ele aparece no `/book` mas NÃO tem uma página `/servicos/maquiagem`.

**Risco**: Baixo (estratégia é Hair/Brows/Nails ONLY), mas não há validação de enforcement.

---

### 2.4 Serviços: Detalhes Não Dinâmicos

**Front (Cabelo.tsx, Sobrancelhas.tsx, Unhas.tsx)**:
- Usam textos hardcoded via `useLanguage()`
- NÃO buscam serviços reais do banco
- Botão "Agendar" vai para `/book` genérico (não passa `service_id`)

**Impacto**: Cliente vê descrições genéricas, não os serviços reais cadastrados no admin.

---

### 2.5 Booking Flow: Sincronização OK

**Fluxo Verificado**:
```text
/book → calendar-availability → calendar-hold → calendar-confirm-booking → /confirm/:id
```

**Pontos Fortes**:
- Edge Functions usam `service_role_key` (bypass RLS)
- Cliente criado/atualizado automaticamente via `upsert by phone`
- Booking retorna dados completos para página de confirmação (evita SELECT com RLS)
- Google Calendar é fonte autoritativa

---

### 2.6 RLS Policies: 5 Warnings

**Políticas com `true` (potencialmente permissivas)**:

| Tabela | Policy | Comando | Risco |
|--------|--------|---------|-------|
| `booking_holds` | Anyone can create | INSERT | Baixo (funcional) |
| `bookings` | Anyone can create | INSERT | Baixo (funcional) |
| `clients` | Anyone can create | INSERT | Baixo (funcional) |
| `whatsapp_clicks` | Anyone can insert | INSERT | Baixo (funcional) |
| `quiz_responses` | Anyone can submit | INSERT | Baixo (funcional) |

**Avaliação**: Estas policies são **intencionais** para permitir agendamento anônimo. O risco é aceitável pois:
- Não há SELECT público em dados sensíveis
- Edge Functions validam dados antes de persistir
- Dados inseridos são de baixo valor para atacantes

---

## 3. Matriz de Consistência Admin → Front

### Serviços

| Campo Admin | Usado no Front? | Onde |
|-------------|-----------------|------|
| `name` | Sim | /book (picker) |
| `description` | Parcial | /book (truncado) |
| `category` | Sim | /book (filtro) |
| `duration_minutes` | Sim | calendar-availability |
| `price` | Sim | /book |
| `promo_price` | Sim | /book |
| `status` (entry/upsell/premium) | Não | - |
| `is_active` | Sim | RLS filter |

**Gap**: O campo `status` não é usado no front. Serviços "premium" aparecem igual aos "entry".

---

### Clientes

| Campo Admin | Usado no Front? | Onde |
|-------------|-----------------|------|
| `name` | Escrita | Edge Function |
| `phone` | Escrita | Edge Function |
| `email` | Não | - |
| `instagram` | Escrita | Edge Function |
| `tags` | Não | Admin only |
| `birthday` | Não | Coluna existe, UI ausente |
| `last_visit_at` | Escrita | Edge Function |

---

### Bookings

| Campo Admin | Usado no Front? | Onde |
|-------------|-----------------|------|
| `client_name` | Escrita/Leitura | /book, /confirm |
| `start_time` | Escrita/Leitura | Full flow |
| `service_id` | Opcional | /book |
| `google_calendar_event_id` | Escrita | Edge Function |
| `status` | Escrita | Edge Function (default: "confirmed") |
| `notes` | Não | - |

---

## 4. Preparação para Features Futuras

### 4.1 SKUs e Variações de Serviços

**Estado Atual**: NÃO PREPARADO

**Necessário**:
- Tabela `service_variants` (ex: "Corte Curto", "Corte Longo")
- Coluna `sku` em services
- Relação N:N entre bookings e variants

---

### 4.2 Loyalty Program

**Estado Atual**: PARCIALMENTE PREPARADO

**Existente**:
- Tabela `clients` com histórico de visitas
- `last_visit_at` atualizado automaticamente

**Necessário**:
- Tabela `loyalty_points`
- Tabela `loyalty_tiers`
- Lógica de acúmulo em `calendar-confirm-booking`

---

### 4.3 Referrals

**Estado Atual**: NÃO PREPARADO

**Necessário**:
- Coluna `referred_by` em `clients`
- Tabela `referral_codes`
- Tracking de conversões

---

### 4.4 Agentes (Multi-Staff)

**Estado Atual**: PARCIALMENTE PREPARADO

**Existente**:
- Tabela `staff_profiles`
- Coluna `staff_id` em `bookings` (nullable)
- Coluna `staff_id` em `business_hours` (nullable)

**Necessário**:
- UI para seleção de profissional no `/book`
- Calendários separados por staff
- Dashboard por profissional

---

## 5. Ações Recomendadas

### Prioridade ALTA (Corrigir Imediatamente)

1. **Implementar UI de Tarefas**
   - Criar `TasksTab.tsx`, `TaskModal.tsx`, `TaskKanbanView.tsx`, `TaskCalendarView.tsx`
   - Adicionar "tasks" ao `AdminTab` type
   - Adicionar renderização em `Admin.tsx`

2. **Implementar Birthday Feature**
   - Criar `BirthdayWidget.tsx`
   - Adicionar campo `birthday` ao `ClientEditModal.tsx`
   - Integrar widget no `DashboardTab.tsx`

### Prioridade MÉDIA (Próximas Sprints)

3. **Dinamizar Páginas de Serviço**
   - Fazer `/servicos/cabelo` buscar serviços do banco
   - Passar `service_id` no botão "Agendar"

4. **Usar Campo `status` no Front**
   - Filtrar serviços "inactive" e "premium" no picker público
   - Mostrar badge de "Premium" quando aplicável

### Prioridade BAIXA (Fase 2+)

5. **Habilitar Leaked Password Protection**
   - Ativar no Supabase Dashboard (Auth > Settings)

6. **Preparar Schema para Loyalty/Referrals**
   - Criar tabelas quando feature for priorizada

---

## 6. Estado Atual vs Plano Original

| Item do Plano | Status |
|---------------|--------|
| Tabela `tasks` | Criada |
| Enums `task_status`, `task_priority` | Criados |
| RLS em `tasks` | Configurado |
| Coluna `birthday` em `clients` | Criada |
| `TasksTab.tsx` | NÃO CRIADO |
| `TaskModal.tsx` | NÃO CRIADO |
| `TaskKanbanView.tsx` | NÃO CRIADO |
| `TaskCalendarView.tsx` | NÃO CRIADO |
| `BirthdayWidget.tsx` | NÃO CRIADO |
| Campo birthday no ClientEditModal | NÃO ADICIONADO |
| Tab "Tarefas" no menu | NÃO ADICIONADA |

---

## 7. Conclusão

O sistema tem uma **arquitetura sólida** com:
- Separação clara Admin/Front via RLS
- Edge Functions como camada de governança
- Google Calendar como fonte autoritativa de disponibilidade

**Gaps principais são de UI**, não de arquitetura. A migração de banco foi executada corretamente, mas os componentes visuais para Tarefas e Aniversários não foram implementados.

**Recomendação**: Completar a implementação dos componentes pendentes antes de avançar para novas features.

