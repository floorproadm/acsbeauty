

# Diagnóstico: O código ESTÁ implementado — o problema é dados

## O que existe agora (já funcional)
As 3 sub-abas estão implementadas e renderizando corretamente:

1. **Membros** — CRUD funcionando (Ane Caroline aparece, modal de edição abre)
2. **Performance** — Mostra estado vazio porque há **0 bookings confirmados/concluídos** no banco
3. **Escalas** — Mostra "Padrão geral" para todos porque nenhum `business_hours` tem `staff_id` vinculado

## Problema real
- **0 bookings** com status `confirmed` ou `completed` → Performance vazia
- **7 business_hours** todas com `staff_id = null` → Escalas sem dados individuais
- **3 staff_profiles** ativos mas sem bookings vinculados

## Plano de ação imediata

### 1. Tornar Performance útil mesmo sem bookings históricos
- Adicionar contadores de **bookings futuros agendados** por profissional (status `requested`)
- Mostrar resumo geral mesmo quando `staff_id` é null nos bookings
- Adicionar botão para **atribuir profissional a bookings existentes** diretamente da aba

### 2. Vincular Escalas aos team_members (não só staff_profiles)
- Atualmente Escalas depende de `staff_profiles` (login de staff), mas o CRUD de membros usa `team_members`
- Unificar: mostrar `team_members` na aba de Escalas quando não há `staff_profiles` correspondente
- Permitir criar horários para qualquer membro da equipe, não só quem tem login

### 3. Atribuição de staff_id nos bookings
- No `BookingDetailModal` ou na lista de bookings, adicionar dropdown para atribuir profissional
- Isso alimenta automaticamente os relatórios de Performance

## Arquivos a modificar
1. **`TeamPerformanceSubTab.tsx`** — Incluir bookings com qualquer status (não só confirmed), mostrar dados mesmo sem staff_id
2. **`TeamScheduleSubTab.tsx`** — Usar `team_members` como fonte principal em vez de `staff_profiles`
3. **`BookingDetailModal.tsx`** — Adicionar seletor de profissional (staff assignment)

## Sem mudanças no banco
Todas as colunas necessárias já existem (`bookings.staff_id`, `business_hours.staff_id`).

