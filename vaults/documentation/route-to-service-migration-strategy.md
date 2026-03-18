# Route-to-Service Migration Strategy

A potential incremental approach to address the [[routes-bypass-service-layer|137/158 routes importing Prisma directly]].

## The idea

Incrementally migrate business logic from routes into the [[service-inventory|service layer]]. Not all routes need migration — some simple CRUD routes where Prisma access is the entire business logic may be fine as-is. The goal is to establish a consistent boundary: routes parse requests, call services, return JSON.

**Proposed tiers:**

| Priority | Routes | Reason |
|---|---|---|
| Tier 1 | `next-turn`, `move`, `damage`, `capture/attempt` | Largest, most logic, highest bug risk |
| Tier 2 | `switch`, `release`, `recall`, `breather`, `use-item` | Contain [[heavily-injured-penalty-duplication|duplicated penalty flow]] |
| Tier 3 | `sprint`, `mount`, `action`, `living-weapon/*` | Moderate logic, moderate size |
| Tier 4 | Simple CRUD routes | Low value — Prisma calls are the logic |

## Principles improved

- [[dependency-inversion-principle]] — routes depend on service abstractions, not Prisma
- [[single-responsibility-principle]] — routes handle HTTP concerns only
- [[service-delegation-rule]] — restored
- Testability — services are testable without HTTP context

## Patterns and techniques

- [[service-layer-pattern]] — the target architecture
- [[facade-pattern]] — each service acts as a facade over Prisma + business logic
- Incremental refactoring — see [[refactoring-in-small-changes]]

## Trade-offs

- Incremental migration means the codebase is temporarily inconsistent — some routes delegate, others don't. This can confuse developers who use one route as a template for another.
- Tier 4 routes (simple CRUD) may not benefit from service extraction — adding a service layer to `GET /api/characters/:id` that just calls `prisma.humanCharacter.findUnique()` adds a pass-through layer with no new capability.
- Each extraction requires moving transaction boundaries from the route to the service, which can be tricky when a route currently does multiple sequential Prisma calls with conditional logic between them.
- The service layer has no formal interface contracts (no TypeScript interfaces defining service APIs) — so "depending on a service" is still depending on a concrete implementation, just one step removed from Prisma.

## Open questions

- Where's the line for Tier 4? Should truly simple CRUD routes be migrated for consistency, or is the consistency not worth the pass-through boilerplate?
- Should new services be created for missing domains (e.g., `capture.service.ts`, `turn-advancement.service.ts`), or should existing services grow to absorb the logic?
- Would this be a good time to introduce service interfaces (TypeScript `interface`s defining the service API), creating a formal abstraction layer? Or is that over-engineering for the current scale?
- What testing strategy accompanies the migration — write tests as services are extracted, or extract first and test later?

## See also

- [[turn-advancement-service-extraction]] — the highest-impact single extraction
- [[heavily-injured-penalty-extraction]] — a cross-cutting extraction that simplifies many Tier 2 routes
- [[refactoring-when-adding-features]] — could time migrations to when a route is being modified for a feature
- [[refactoring-in-small-changes]] — the approach to incremental migration
