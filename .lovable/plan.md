
User wants: When booking via portal, the SKUs/Variations (Técnicas/Opções) configured in admin should appear during booking flow. Currently in portal it goes from service → staff directly because services have no SKUs filled in yet (data gap), but the user wants the admin-configured techniques/options to actually show up in the booking flow.

Let me check what's happening. From earlier analysis:
- Portal/Book.tsx skips SKU step if no SKUs exist for service
- Most hair services have $0 price and no SKUs
- BUT user mentioned "tem técnicas e opções" — meaning they DO see Técnicas/Opções in admin but those don't surface in booking

Let me check the data more carefully and the booking flow.

Need to verify:
1. Does "Botox Capilar" (the one user clicked) actually have variations/SKUs in DB?
2. How does Book.tsx handle variations vs SKUs?

Let me query the DB and check Book.tsx flow.
