# Routes Bypass Service Layer

137 of 158 API route files import Prisma directly instead of going through the [[service-inventory|service layer]]. Within encounter routes specifically, there are 79 direct Prisma calls across 44 files.

Examples:
- `next-turn.post.ts` calls `prisma.encounter.findUnique()` and `prisma.encounter.update()` directly
- `capture/attempt.post.ts` has multiple `prisma.pokemon.update()` calls with no capture service
- `breather.post.ts` has 3 separate `prisma.encounter.update()` calls in different branches

This violates both the [[dependency-inversion-principle]] (routes depend on the concrete Prisma ORM rather than service abstractions) and the [[service-delegation-rule]] (routes should parse requests, call services, return JSON — not perform persistence directly).

The [[service-layer-pattern]] prescribes three tiers: controller → service → repository. When routes access Prisma directly, they collapse controller and repository into one layer, making the business logic untestable without a database.

## See also

- [[single-responsibility-principle]] — routes handling persistence have two reasons to change (HTTP contract + DB schema)
- [[feature-envy-smell]] — routes reaching into Prisma instead of asking a service to do it
- [[pure-service-testability-boundary]] — contrast with the pure services that enforce clean separation
- [[next-turn-route-business-logic]] — the most extreme example
- [[heavily-injured-penalty-duplication]] — a direct consequence of logic living in routes instead of services
- [[route-to-service-migration-strategy]] — a potential incremental migration plan
- [[typed-rpc-api-layer]] — a destructive proposal that structurally eliminates route-level bypass by replacing routes with typed procedures
- [[repository-use-case-architecture]] — a destructive proposal that eliminates routes bypassing services by replacing the service layer entirely
- [[kill-the-api-directory]] — a destructive proposal that replaces file-based routes with domain controllers using injected dependencies
