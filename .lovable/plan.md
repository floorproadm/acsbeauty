

## Replace Instagram with Phone Number on Team Members

### What changes

1. **Database migration** -- Add a `phone` column to `team_members` table. The existing `instagram` column stays (data preservation) but will no longer be used in the UI.

2. **Admin TeamTab modal** -- Replace the Instagram field with a Phone field:
   - Label: "Telefone"
   - Placeholder: "(xxx) xxx-xxxx"
   - Save/load `phone` instead of `instagram`

3. **Public Team page** (`src/pages/Team.tsx`) -- Replace the Instagram link with a phone link:
   - Show phone number with a Phone icon instead of Instagram icon
   - Link uses `tel:` protocol so clients can tap to call

4. **Admin card list** -- No change needed (doesn't show Instagram currently)

### Technical details

- Migration: `ALTER TABLE public.team_members ADD COLUMN phone text;`
- Update `TeamMember` interface in both `TeamTab.tsx` and `Team.tsx` to include `phone`
- Replace `instagram` references with `phone` in the form state, save mutation, and UI rendering
- The `instagram` column remains in the database but is unused in the UI

