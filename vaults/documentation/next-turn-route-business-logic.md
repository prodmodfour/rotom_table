# Next-Turn Route Business Logic

The `next-turn.post.ts` route at 846 lines is the largest API route in the codebase. It contains inline business logic for at least 12 distinct concerns: turn end bookkeeping, [[heavily-injured-penalty-duplication|heavily injured penalty flow]], weather ability effects (Dry Skin, Ice Body, Rain Dish, Solar Power), Hydration/Leaf Guard status cures, tick damage processing, auto-dismount on faint, hold queue checks, league battle phase transitions, weather CS bonus reversal, defeated enemy tracking, action forfeit consumption, and move log construction.

This violates the [[service-delegation-rule]] and [[single-responsibility-principle]] — the route has at least 12 distinct reasons to change. The [[service-layer-pattern]] prescribes that routes parse requests, call services, and return JSON. A turn-advancement service would bring this in line.

## See also

- [[large-class-smell]] — 846 lines in a single handler
- [[long-method-smell]] — the handler function itself is one enormous method
- [[divergent-change-smell]] — changes to weather rules, turn rules, or death rules all modify this one file
- [[routes-bypass-service-layer]] — this route also accesses Prisma directly
- [[turn-advancement-service-extraction]] — a potential design to move this logic into a service
