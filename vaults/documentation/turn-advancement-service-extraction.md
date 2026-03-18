# Turn Advancement Service Extraction

A potential [[extract-class]] to address the [[next-turn-route-business-logic|846-line next-turn route]].

## The idea

Move the turn progression logic from `next-turn.post.ts` into a `turn-advancement.service.ts`. The route handler would shrink to ~50 lines: parse request, call `advanceTurn(encounterId)`, build response, broadcast via WebSocket.

The service would orchestrate the turn lifecycle: end-of-turn bookkeeping, [[heavily-injured-penalty-extraction|heavily injured penalty flow]], weather ability effects, status tick damage, hold queue checks, league battle phase transitions, action forfeit consumption, and move log construction.

## Principles improved

- [[single-responsibility-principle]] — the route handles HTTP; the service handles turn logic
- [[service-delegation-rule]] — restores the three-tier separation prescribed by the [[service-layer-pattern]]
- Testability — a service function is testable without an HTTP context

## Patterns and techniques

- [[extract-class]] — the core refactoring
- The service would be an orchestrator (see [[service-pattern-classification]]), coordinating calls to existing services like `status-automation.service`, `weather-automation.service`, and the proposed [[heavily-injured-penalty-extraction|heavily-injured penalty function]]
- [[facade-pattern]] — the service becomes a facade over turn-end subsystems

## Trade-offs

- Orchestrator services risk becoming god objects themselves — the complexity doesn't disappear, it moves. The service must be structured with clear internal delegation rather than becoming another 846-line file.
- Transaction boundaries: many turn-end effects need to be atomic (e.g., apply tick damage and check faint together). The current route handles this with sequential Prisma calls in a single handler context. A service would need explicit transaction scoping.
- WebSocket broadcasts currently happen at multiple points during the route (4 separate broadcast blocks). The service would need to either buffer broadcasts or accept multiple emissions per turn.

## Open questions

- Should the service return a rich result object describing everything that happened (for logging/broadcasting), or should it handle broadcasting internally?
- Should sub-steps (weather tick, heavily-injured check, tick damage) be private methods, separate functions, or calls to other services?
- Is the league battle / full contact mode split significant enough to warrant separate service methods, or should it be internal branching?

## See also

- [[heavily-injured-penalty-extraction]] — a prerequisite extraction that would simplify this service
- [[routes-bypass-service-layer]] — the broader pattern this addresses
- [[turn-lifecycle]] — the documented turn flow this service would implement
