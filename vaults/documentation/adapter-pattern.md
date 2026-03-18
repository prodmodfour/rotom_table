# Adapter Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that makes objects with incompatible interfaces work together by wrapping one object in a translator.

## Problem

Integrating a third-party library or legacy system whose interface does not match what the client code expects. Modifying either side may not be feasible — the library's source is unavailable, or changing the client would break other consumers.

## Solution

Create an adapter class that implements the interface the client expects, wraps the incompatible object, and translates incoming calls into the format the wrapped object understands. Two variants exist: object adapters (composition) and class adapters (multiple inheritance).

## When to use

- Integrating existing classes with incompatible interfaces
- Reusing subclasses that lack common functionality — add it through an adapter rather than duplicating code

## Pros and cons

Separates interface conversion from business logic ([[single-responsibility-principle]]). New adapters can be introduced without modifying client code ([[open-closed-principle]]). The tradeoff is added complexity — sometimes it is simpler to just change the service class.

## TypeScript implementation

The adapter extends the target class to maintain interface compatibility via inheritance, while wrapping the adaptee through composition (constructor injection). The overridden method translates incoming calls into the format the adaptee understands. Since TypeScript lacks multiple inheritance, the object adapter variant (composition) is the standard approach over the class adapter variant. See [[typescript-pattern-techniques]].

## See also

- [[bridge-pattern]] — Bridge is designed upfront; Adapter retrofits existing incompatible systems
- [[decorator-pattern]] — Adapter changes interfaces; Decorator extends behavior while keeping the same interface
- [[facade-pattern]] — Facade creates a new interface for a subsystem; Adapter makes an existing interface usable
- [[proxy-pattern]] — both wrap objects, but Proxy keeps the same interface
- [[encounter-store-surface-reduction]] — potential adapter composables wrapping the encounter store for focused consumers
