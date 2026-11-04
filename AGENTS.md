# Architecture rules
- Preserve LanguageContext identity through Vite hot updates so retained providers and refreshed consumers share the same context.
- Centralize public WhatsApp message resolution and booking availability behind a reversible frontend flag; never mount the booking engine when public booking is disabled.
- Shared Header and Footer must preserve their original behavior on Contact and Ane Caroline, which are frozen pages.

- Keep studio information in the Newark location page; redirect the legacy Studio URL there to preserve existing inbound links without duplicating content.
- Keep the public About page as the sole studio introduction; redirect the legacy Team URL to About to preserve inbound links without duplicate content.
