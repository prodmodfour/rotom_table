# Mediator Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that reduces chaotic dependencies between objects by routing all communication through a central mediator object.

## Problem

As components evolve, they develop complex interdependencies — a form element reveals another, a button validates several fields. Direct communication makes classes tightly coupled and impossible to reuse independently. Changes to one component cascade through all its collaborators.

## Solution

Components collaborate indirectly through a mediator instead of communicating directly. Each component notifies the mediator of events; the mediator decides which other components should respond. Components depend only on the mediator, not on each other.

## When to use

- Classes are tightly coupled, making them hard to modify or reuse independently
- Components need to be reusable across different programs
- Many subclasses exist just to handle different collaboration scenarios

## Pros and cons

Centralizes communication logic ([[single-responsibility-principle]]). New mediators can be added without changing components ([[open-closed-principle]]). Reduces coupling and enables component reuse. The tradeoff is that the mediator can evolve into a "God Object" antipattern.

## TypeScript implementation

Uses an interface for the mediator contract with a `notify(sender, event)` method. Components extend a base class that stores a mediator reference (set via `setMediator()` after construction). Components notify the mediator with event strings; the mediator inspects the event and coordinates responses across other components. Components never reference each other directly — all collaboration routes through the mediator. See [[typescript-pattern-techniques]].

## See also

- [[facade-pattern]] — Facade simplifies a subsystem interface; Mediator centralizes bidirectional communication
- [[observer-pattern]] — Observer enables dynamic one-way subscriptions; Mediator eliminates mutual dependencies. Mediators can be implemented using Observer
- [[chain-of-responsibility-pattern]] — CoR passes requests sequentially; Mediator forces communication through a central point
- [[cross-store-coordination-rule]] — the app avoids direct store-to-store imports, a principle aligned with Mediator thinking
