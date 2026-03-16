

## Problem

The "Ver Nossos Serviços" button uses `variant="rose"` (`bg-gold text-white`) on a `bg-primary` section — both are similar brown/gold tones, so the button blends into the background with poor contrast. The screenshot confirms this clearly.

## Solution

Change the primary CTA button to a **white background with gold/dark text**, creating strong contrast against the brown background. This is the standard pattern for CTAs on dark sections.

### Changes in `src/components/home/CTASection.tsx`

- Replace `variant="rose" size="xl"` with explicit white styling:
  - `bg-white text-primary font-medium hover:bg-white/90` — white button with the brand brown text
  - Keep the arrow icon and calendar icon as-is, they'll inherit the dark color

- For the "Fale Conosco" outline button, update to use white border/text for better contrast:
  - `border-white/60 text-white hover:bg-white/10` instead of current `border-rose-gold/50 text-rose-gold`

This matches the visual hierarchy: strong white primary CTA + subtle white-outline secondary CTA, both readable against the brown `bg-primary` background.

### File: `src/components/home/CTASection.tsx` — 2 button class changes only.

