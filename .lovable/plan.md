

# Google Reviews Style — Testimonials Section

## What changes
Redesign the `Testimonials` section on the home page to look like authentic Google Reviews, matching the reference image style (dark cards, Google logo, avatar initials, star ratings, "Verified" badge, time ago, "Read more" link).

## Design details
- **Section header**: Playfair Display heading with gold color, subtitle "Real reviews from real clients — verified on Google."
- **Cards**: Dark background (`bg-[#1a1a1a]`), rounded corners, horizontal scroll on mobile (single card visible), grid on desktop
- **Each card contains**:
  - Colored circle avatar with initial letter (no stock photos — more authentic)
  - Name + "X months ago" subtitle
  - Google "G" logo icon (SVG) top-right
  - 5 gold stars + green "Verified" text
  - Review quote text in light gray
  - Gold "Read more" link at bottom (links to Google Review page)
- **Reviews**: Replace fake names/content with realistic beauty-specific reviews mentioning Ane, hair, brows, nails
- **CTA**: Below cards, small "Leave a Review" button linking to Google Review URL

## Files to edit
1. **`src/components/home/Testimonials.tsx`** — Full redesign with Google Review card style
2. **`src/contexts/LanguageContext.tsx`** — Update description strings for both languages

## No database changes needed
Static content only.

