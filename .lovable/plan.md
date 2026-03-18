

## Plan: Separate Admin Auth from Client Auth

### Changes

1. **Create `src/pages/AdminAuth.tsx`** -- Copy the uploaded AdminAuth.tsx file exactly as provided (admin-only login with email/password, redirects to `/admin` on success).

2. **Replace `src/pages/Auth.tsx`** -- Replace with the uploaded Auth.tsx file (client login/register using phone number, blocks admin users, uses framer-motion animations).

3. **Create `src/pages/Onboarding.tsx`** -- Copy the uploaded Onboarding.tsx file exactly as provided (3-slide intro carousel with bilingual support).

4. **Update `src/App.tsx`** -- Add imports for `AdminAuth` and `Onboarding`, add routes `/admin/auth` and `/onboarding`.

5. **Update `src/components/admin/AdminLayout.tsx`** -- Change both `navigate("/auth")` calls to `navigate("/admin/auth")` so admin auth redirects go to the correct page.

### Notes
- No database changes needed.
- The Auth.tsx uses `framer-motion` which is already in the project dependencies.
- The client auth uses a `phoneToEmail()` pattern to create fake emails from phone numbers, keeping client accounts separate from admin accounts.

