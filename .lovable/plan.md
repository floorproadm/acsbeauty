

# Plano: Transformar a aba "Equipe" em um hub completo de gestão de staff

## Problema
A aba atual é apenas um CRUD básico de membros da página `/team` + um widget de performance que depende de bookings com `staff_id` (que geralmente são nulos). É superficial e não agrega valor operacional real.

## Visão
Transformar em uma **central de gestão de equipe** com 3 sub-abas internas:

### 1. Membros (tab existente, refinada)
- Manter o CRUD de `team_members` como está
- Adicionar preview da foto inline no modal de edição

### 2. Performance (tab dedicada)
- Mover o `StaffPerformanceWidget` para uma sub-aba própria
- Adicionar **filtro de período** (último mês, 3 meses, 6 meses, custom)
- Adicionar **ranking visual** — medalha 🥇🥈🥉 para os top 3
- Mostrar **gráfico de barras simples** (receita por profissional) usando Recharts (já disponível via shadcn chart)
- Incluir contagem de **clientes únicos atendidos** por profissional

### 3. Escalas / Disponibilidade
- Visualizar as `business_hours` por profissional (já existe `staff_id` na tabela)
- Permitir configurar horários individuais por membro da equipe
- Mostrar quem está disponível hoje em um resumo rápido

## Estrutura técnica

```text
TeamTab.tsx
├── Tabs (Membros | Performance | Escalas)
│   ├── TeamMembersSubTab.tsx   ← CRUD existente extraído
│   ├── TeamPerformanceSubTab.tsx ← Widget expandido + charts
│   └── TeamScheduleSubTab.tsx   ← business_hours por staff
```

## Arquivos modificados
1. **`src/components/admin/TeamTab.tsx`** — Refatorar para usar sub-abas internas com `Tabs` do shadcn
2. **`src/components/admin/team/TeamMembersSubTab.tsx`** — Extrair CRUD atual
3. **`src/components/admin/team/TeamPerformanceSubTab.tsx`** — Widget expandido com filtros e chart
4. **`src/components/admin/team/TeamScheduleSubTab.tsx`** — Grid de horários por profissional

## Sem mudanças no banco
Todas as tabelas necessárias já existem (`team_members`, `staff_profiles`, `bookings`, `business_hours`).

