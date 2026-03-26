# Decorator Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that attaches new behaviors to objects dynamically by placing them inside wrapper objects. Also known as "Wrapper."

## Problem

Extending behavior through inheritance is static — it cannot be changed at runtime — and subclasses cannot inherit from multiple parents. When multiple optional behaviors can be combined (e.g., notification channels: email + SMS + Slack), the number of subclasses for every combination explodes.

## Solution

Create wrapper objects that implement the same interface as the wrapped object. The wrapper delegates calls to the inner object and adds behavior before or after. Multiple decorators can be stacked, each layer adding its own functionality while preserving the original interface.

## When to use

- Assigning extra behaviors to objects at runtime without breaking existing code
- Structuring business logic into independent layers that compose at runtime
- Extending a final class where inheritance is impossible

## Pros and cons

Extends behavior without new subclasses. Responsibilities can be added or removed dynamically. Multiple decorators compose freely ([[single-responsibility-principle]]). The tradeoffs are that removing a specific wrapper from the middle of a stack is difficult, and behavior may depend on wrapper order.

## TypeScript implementation

Defines a component interface as the shared contract. The base decorator class implements the interface and holds a `protected` component reference via constructor injection. Its default `operation()` delegates to the wrapped component. Concrete decorators extend the base decorator and call `super.operation()` for delegation, adding behavior before or after. Stacking decorators layers behavior through nested wrapping — each layer contributes to the final result. See [[typescript-pattern-techniques]].

## See also

- [[adapter-pattern]] — Adapter changes interfaces; Decorator extends behavior while keeping the same interface
- [[proxy-pattern]] — both wrap objects, but Proxy manages service lifecycle while Decorator composition is client-controlled
- [[chain-of-responsibility-pattern]] — similar linked structure, but CoR handlers can stop propagation independently
- [[composite-pattern]] — Decorator has one child, Composite aggregates many; they often cooperate
- [[strategy-pattern]] — Decorator changes the "skin"; Strategy changes the "guts"
- [[prototype-pattern]] — designs heavy on Decorator benefit from Prototype for cloning wrapped structures
