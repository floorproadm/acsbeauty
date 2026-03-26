

# Fix GPS Picker -- Correct Address for All Navigation Apps

## Problem
The GPS coordinates (`40.7357, -74.1724`) used in both the Contact page and Footer are incorrect, sending users to the wrong location.

## Solution
Replace coordinate-based URLs with **address-based URLs** using `375+Chestnut+St+Newark+NJ` as the destination. This lets each GPS app resolve the exact address itself, which is more reliable than hardcoded lat/lng.

## Changes

**Files:** `src/pages/Contact.tsx` and `src/components/layout/Footer.tsx`

Replace the GPS URLs in both files:

| App | Current (wrong coords) | New (address-based) |
|-----|----------------------|---------------------|
| Google Maps | `destination=40.7357,-74.1724` | `destination=375+Chestnut+St+Newark+NJ` |
| Apple Maps | `daddr=40.7357,-74.1724` | `daddr=375+Chestnut+St,+Newark,+NJ` |
| Waze | `ll=40.7357,-74.1724` | `q=375+Chestnut+St,+Newark,+NJ` |

Remove the `STUDIO_COORDS` constant from both files since it's no longer needed.

