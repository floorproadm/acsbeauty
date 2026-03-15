

# Seed SKU Data for Design de Sobrancelhas

The database has 3 active services but zero variations and zero SKUs. This blocks Flow 3 testing and makes Passos 6/7 meaningless.

## What to Insert

### 1. Two Variations for "Design de Sobrancelhas" (id: `22222222-2222-2222-2222-222222222222`)

| Name | Slug | sort_order |
|------|------|-----------|
| Sem Henna | sem-henna | 0 |
| Com Henna | com-henna | 1 |

### 2. Two SKUs (one per variation)

| Name | Slug | Variation | Duration | Price | Promo |
|------|------|-----------|----------|-------|-------|
| Design de Sobrancelha — Sem Henna | design-sobrancelha-sem-henna | Sem Henna | 45 | 120.00 | null |
| Design de Sobrancelha — Com Henna | design-sobrancelha-com-henna | Com Henna | 60 | 150.00 | 135.00 |

### 3. One SKU for "Corte Feminino" (no variation, tests auto-skip)

| Name | Slug | Variation | Duration | Price |
|------|------|-----------|----------|-------|
| Corte Feminino — Padrão | corte-feminino-padrao | null | 60 | 75.00 |

## SQL Execution

Three INSERT statements via the data insert tool:
1. Insert 2 rows into `service_variations`
2. Insert 3 rows into `service_skus` (referencing the variation IDs from step 1)

Since we can't get the generated UUIDs back from the insert tool, we'll use deterministic UUIDs in the INSERT to link variations → SKUs.

## After Seeding

Test URLs:
- `/book?service=design-de-sobrancelhas` → shows 2 variations → then SKU picker
- `/book?service=design-de-sobrancelhas&sku=design-sobrancelha-sem-henna` → skips to date
- `/book?service=corte-feminino` → auto-skips variation + SKU (only 1 SKU, no variations)

## Files Changed

None. Database-only operation.

