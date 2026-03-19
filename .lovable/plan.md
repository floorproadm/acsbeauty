

# Gift Cards -- Detail Modal + Delete

## What changes

### 1. Gift Card Detail Sheet (new component)
Create a `Sheet` (bottom drawer on mobile) that opens when clicking any gift card row. Shows all gift card info in a readable layout:
- Code, amount, balance, status
- Buyer info (name, email)
- Recipient info (name, email)
- Occasion, personal message
- Payment method, dates (created, delivered, expires)
- Status change dropdown (pending/paid/delivered/redeemed)
- Delete button with confirmation dialog

### 2. Update GiftCardsTab
- Make each row/card clickable to open the detail sheet
- On mobile (390px viewport), switch from table to a card-based list for better usability
- Add delete mutation with `AlertDialog` confirmation
- Add status update mutation from the detail sheet

### 3. Delete with confirmation
- `AlertDialog` asking "Tem certeza que deseja excluir este gift card?"
- Calls `supabase.from("gift_cards").delete().eq("id", id)`
- Invalidates query cache and closes the sheet

## Technical details

**Files modified:**
- `src/components/admin/GiftCardsTab.tsx` -- add click handler, mobile card layout, detail sheet inline or as separate component

**No database changes needed** -- RLS already allows admin_owner full access (ALL command) on `gift_cards`.

**UI pattern:** Reuse `Sheet` from `@/components/ui/sheet` and `AlertDialog` from `@/components/ui/alert-dialog`, consistent with other admin tabs.

