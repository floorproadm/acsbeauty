
The user wants to seed the database with services and SKUs. This is a database-only operation, no code changes. I'll execute the two SQL files via migrations after approval.

Validation:
- `acs_services_seed.sql`: Inserts services in 3 categories. No `ON CONFLICT` clause — re-running would create duplicates. Need to check if `slug` is unique in `services` table.
- `acs_highlights_skus.sql`: Uses `ON CONFLICT (service_id, name)` — requires unique constraint on those columns. Need to verify it exists.

Let me note both risks and proceed with the plan. The user has stated they will run via SQL Editor themselves, but I can run them as migrations from Lovable side too (cleaner, tracked).

## Plan: Seed Services + Highlights SKUs

### What I'll do
Run both SQL files as Supabase migrations (in order), then verify counts.

### Execution order
1. **Migration 1** — `acs_services_seed.sql`: Insert 10 services across Cabelo, Sobrancelhas, Unhas with placeholder prices (0.00) for Ane to fill via admin.
2. **Migration 2** — `acs_highlights_skus.sql`: Insert 3 SKUs (Highlights Clássico, Balayage, Money Piece) for the `highlights-tecnicas` service.
3. **Verification** — Run SELECT queries to confirm row counts and category distribution.

### Pre-flight checks (will validate before running)
- Confirm `services.slug` uniqueness handling — seed has no `ON CONFLICT`, so re-running would fail/duplicate. Will check existing rows first and skip insert if `slug` already exists.
- Confirm `service_skus` has unique constraint on `(service_id, name)` for the SKU seed's `ON CONFLICT` to work; if missing, will adapt the SQL.

### What I won't touch
- No code changes (Book.tsx, Confirmation.tsx, edge functions remain intact).
- No price values — Ane fills via `/admin → Serviços`.
- No frontend price exposure (margin protection rule preserved).

### After seeding
You'll be able to:
- Visit `/services` and see the 3 category cards.
- Visit `/servicos/cabelo` and see Cortes, Tratamentos Capilares, Highlights Técnicas.
- Visit `/servicos/cabelo/highlights-tecnicas` and see the 3 SKUs (Clássico, Balayage, Money Piece) without prices.
- Use the `acs_services_flow_checklist.md` for manual QA.

Approve and I'll run both migrations + verification.
