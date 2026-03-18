# Chain of Responsibility Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that passes requests along a chain of handlers, where each handler decides whether to process the request or forward it to the next.

## Problem

Sequential validation or processing steps become tangled when hardcoded into a single place. Adding new checks requires modifying existing code, and the logic cannot be reused across different system components.

## Solution

Transform each check into an independent handler object with a common interface. Link handlers into a chain where each holds a reference to the next. A handler either processes the request and stops, or passes it forward. Chains can be composed dynamically at runtime.

## When to use

- Request types or processing sequences are unknown at compile time
- Handlers must execute in a specific order
- The handler set should be configurable at runtime

## Pros and cons

Controls processing order explicitly. Decouples senders from processors ([[single-responsibility-principle]]). New handlers can be added without changing existing ones ([[open-closed-principle]]). The tradeoff is that some requests may go unhandled if no handler accepts them.

## TypeScript implementation

Uses a generic handler interface `Handler<Request, Result>` for flexible request and result typing. An abstract handler class encapsulates the default chaining logic — if no concrete handler processes the request, it passes to the next handler. `setNext()` returns the handler for fluent chain construction (`monkey.setNext(squirrel).setNext(dog)`). Concrete handlers call `super.handle()` to delegate to the next link. See [[typescript-pattern-techniques]].

## See also

- [[composite-pattern]] — chains can be built from Composite object trees
- [[command-pattern]] — handlers can implement Command objects for flexible operations
- [[decorator-pattern]] — similar linked structure, but Decorator cannot stop propagation independently
- [[mediator-pattern]] — Mediator routes through a central object; CoR passes along a sequence
- [[observer-pattern]] — Observer allows dynamic subscription; CoR enforces sequential processing
- [[damage-pipeline-as-chain-of-responsibility]] — the damage flow pipeline as a chain of responsibility
