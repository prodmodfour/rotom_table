# Service Layer Pattern

The app enforces a three-tier separation on the server side:

1. **Controller** (`server/api/*.ts`) — Parses the request, calls the service, returns JSON. No business logic. See [[service-delegation-rule]].
2. **Service** (`server/services/*.ts`) — Contains validation and business logic. See [[service-inventory]].
3. **Repository** (Prisma) — Talks to the database only.

This mirrors the [[single-responsibility-principle]]: API routes handle HTTP concerns, services handle domain logic, Prisma handles persistence.

On the client side, the same separation applies:
- Vue components handle layout only.
- Composables handle data fetching and logic. See [[composable-domain-grouping]].
- Utility functions handle pure transformations.

## See also

- [[facade-pattern]] — the service layer acts as a facade over Prisma and business logic
- [[api-endpoint-layout]]
- [[dependency-inversion-principle]] — services depend on Prisma abstractions, not raw DB access
- [[turn-advancement-service-extraction]] — restoring the three-tier separation for the turn advancement route
- [[typed-rpc-api-layer]] — a destructive proposal that enforces the three-tier pattern structurally via typed RPC
- [[game-engine-extraction]] — a destructive proposal that redefines what "service logic" means by extracting game rules to a standalone engine
- [[repository-use-case-architecture]] — a destructive proposal that supersedes the service layer with repositories and use cases
- [[service-responsibility-conflation]] — the current services conflate three concerns the pattern intended to separate
