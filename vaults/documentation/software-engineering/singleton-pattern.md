# Singleton Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that ensures a class has only one instance while providing a global access point to it.

## Problem

Two problems solved simultaneously: (1) restricting a class to a single instance for shared resources like databases or configuration, and (2) providing controlled global access to that instance — safer than raw global variables because the instance cannot be overwritten.

## Solution

Make the constructor private and provide a static factory method that creates the instance on first call and returns the cached instance on subsequent calls. This also enables lazy initialization — the object is created only when first needed.

## When to use

- A class should have exactly one instance available application-wide
- Stricter control over global state than plain variables provide

## Pros and cons

Guarantees a single instance. Provides a controlled global access point. Supports lazy initialization. The tradeoffs are that it violates the [[single-responsibility-principle]] by combining instance management with business logic, can mask poor architecture by hiding dependencies, complicates multithreaded environments, and makes unit testing harder.

## TypeScript implementation

Uses a private constructor to prevent direct `new` instantiation. Stores the single instance in a static private field using `#instance` syntax. Exposes access through a static getter that creates the instance on first access (lazy initialization) and returns the cached instance on subsequent calls. See [[typescript-pattern-techniques]].

## See also

- [[facade-pattern]] — a Facade often only needs one instance and can be implemented as a Singleton
- [[flyweight-pattern]] — similar sharing concept, but Flyweight allows multiple instances with different intrinsic states
- [[abstract-factory-pattern]] — Abstract Factories are often implemented as Singletons
