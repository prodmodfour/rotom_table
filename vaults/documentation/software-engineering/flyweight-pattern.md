# Flyweight Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that conserves memory by sharing common parts of state across many similar objects instead of storing all data in each one.

## Problem

An application spawns a massive number of similar objects (e.g., particles in a game), and each object carries duplicate data that exhausts available RAM.

## Solution

Separate object state into two categories:

- **Intrinsic state** — unchanging data shared across objects, stored inside the flyweight
- **Extrinsic state** — contextual data unique to each object, passed in as method parameters or held externally

A flyweight factory manages the pool of shared objects, creating new instances only when no matching flyweight exists.

## When to use

- The application creates enormous quantities of similar objects
- RAM is the limiting resource
- Objects contain duplicate state that can be extracted and shared

## Pros and cons

Dramatic RAM savings when dealing with many similar objects. The tradeoffs are increased CPU cost if extrinsic data requires recalculation, and added code complexity from the state separation logic.

## TypeScript implementation

The flyweight factory uses a dictionary type (`{[key: string]: Flyweight}`) for its cache. It generates string keys by joining shared state arrays. When a flyweight is requested, the factory returns the cached instance or creates a new one. The flyweight stores intrinsic (shared) state privately and receives extrinsic (unique) state as method parameters. See [[typescript-pattern-techniques]].

## See also

- [[composite-pattern]] — Flyweight can implement shared leaf nodes in a Composite tree
- [[singleton-pattern]] — both involve sharing, but Singleton restricts to one instance while Flyweight allows many with different intrinsic states
- [[facade-pattern]] — Flyweight creates many small objects; Facade creates a single object representing a subsystem
