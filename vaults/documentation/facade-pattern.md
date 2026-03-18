# Facade Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that provides a simplified interface to a complex subsystem — a library, framework, or set of interrelated classes.

## Problem

Integrating with a sophisticated subsystem requires managing numerous objects, initialization sequences, and implementation details. Business logic becomes tightly coupled to the subsystem's internals, making the code hard to maintain and understand.

## Solution

Create a class that encapsulates the complex interactions and exposes only the functionality clients actually need. Clients interact through this streamlined intermediary instead of touching dozens of subsystem components. The tradeoff is intentionally limited functionality in exchange for clarity.

## When to use

- A complex subsystem needs a straightforward entry point
- Structuring a system into layers, with facades as communication points between them
- Shielding application code from changes in third-party dependencies

## Pros and cons

Isolates client code from subsystem complexity. Shields clients from implementation changes. The tradeoff is that the Facade can evolve into a "God Object" if it accumulates unrelated responsibilities.

## TypeScript implementation

The constructor accepts optional subsystem parameters using `?` syntax, creating default instances when none are provided. This supports both dependency injection and self-sufficient operation. The facade composes multiple subsystem objects as `protected` members and exposes simplified methods that orchestrate subsystem calls in the correct sequence. See [[typescript-pattern-techniques]].

## See also

- [[adapter-pattern]] — Adapter retrofits individual interfaces; Facade simplifies access to entire subsystems
- [[mediator-pattern]] — similar coordination role, but Mediator centralizes bidirectional component communication
- [[proxy-pattern]] — Proxy maintains the service's interface; Facade defines a new simplified one
- [[singleton-pattern]] — a Facade often only needs one instance
- [[abstract-factory-pattern]] — can serve as an alternative for hiding object creation
- [[service-layer-pattern]] — the app's service layer acts as a facade over Prisma and business logic
- [[single-responsibility-principle]] — a well-scoped Facade keeps subsystem concerns out of client code
- [[encounter-store-as-facade]] — the encounter store acts as a facade over 5 composables
