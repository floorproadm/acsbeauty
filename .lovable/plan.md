
User está olhando o modal "Novo Agendamento" (NewBookingModal.tsx) e percebeu que falta seleção de profissional/colaborador. Vou analisar o que existe vs o que precisa ter.

**O que tem hoje no modal:**
- Nome, Email, Telefone do cliente (campos livres, sem autocomplete)
- Serviço (apenas o serviço base, sem técnica/opção)
- Data
- Horário (slots automáticos)
- Observações

**O que falta (problemas reais):**

1. **Sem seleção de profissional** — modal cria booking sem `staff_id`, mesmo já tendo a coluna no DB e UI de atribuição depois.
2. **Sem autocomplete de cliente existente** — staff digita tudo manualmente mesmo se cliente já está cadastrado. Risco de duplicar registros.
3. **Sem seleção de Técnica/Opção (SKU)** — só escolhe o serviço pai. Mas o sistema tem 3 níveis (Serviço → Técnicas → Opções) com preços diferentes. Booking fica sem `sku_id` e sem preço correto.
4. **Sem opção de marcar status inicial** — sempre cria como "confirmed" via skip_hold. Talvez staff queira criar como "requested" para confirmar depois.
5. **Validação fraca de telefone** — placeholder "(11) 99999-9999" é formato BR; mercado é US "(XXX) XXX-XXXX".
6. **Email obrigatório** — mas no admin muitos clientes walk-in não dão email. Deveria ser opcional (gerar fake tipo `walkin_+phone@acsbeauty.app`).
7. **Sem opção "agendamento recorrente"** — cliente que faz manutenção a cada 4 semanas.
8. **Disponibilidade não considera staff selecionado** — se filtrar por profissional, slots deveriam refletir agenda dele.
9. **Sem indicação visual** se cliente é novo ou recorrente após digitar telefone/email.
10. **Sem "duração customizada"** — staff pode querer reservar 2h para algo especial sem amarrar a um SKU.

**Priorização sugerida (Tier 1 = essencial agora):**

**Tier 1 — Crítico**
- Seleção de profissional (staff_id) — bloqueia atribuição correta
- Autocomplete de cliente existente (busca por telefone/nome) — evita duplicação
- Seleção de Técnica/Opção (SKU) quando o serviço tiver — preço correto
- Telefone formato US + email opcional (auto-gerar walk-in email)

**Tier 2 — UX/Operação**
- Status inicial selecionável (Confirmado / Aguardando)
- Indicador "novo cliente" / "recorrente" após digitar contato
- Disponibilidade respeitando staff selecionado

**Tier 3 — Avançado**
- Duração customizada (override do SKU)
- Agendamento recorrente (criar N bookings espaçados)
- Bloquear horário sem cliente (espaço pessoal/folga) — mas isso é outra feature

Plano enxuto, vou apresentar com pergunta no fim.
