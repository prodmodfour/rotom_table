# Builder Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that constructs complex objects step by step, allowing the same construction process to produce different types and representations.

## Problem

Complex objects with many optional parameters lead to telescoping constructors — unwieldy calls with numerous arguments, most of which are defaults. Alternatively, creating a subclass for every configuration causes class explosion.

## Solution

Extract construction logic into a separate builder object. The builder provides step-by-step methods (e.g., `buildWalls`, `buildDoor`) that the client calls selectively. An optional director class encapsulates common construction sequences for reuse.

Only the steps that are needed get called — the rest are skipped. Different builder implementations produce different representations while sharing the same construction interface.

## When to use

- Eliminating telescoping constructors with many optional parameters
- Building different representations of a product using similar steps
- Constructing composite trees or other recursive structures

## Pros and cons

Enables step-by-step, deferred, or recursive construction. Reuses the same construction code for different representations ([[single-responsibility-principle]]). The tradeoff is multiple new classes.

## TypeScript implementation

Defines a builder interface declaring the step methods. Concrete builders implement the interface, maintain an internal product instance, and expose a `getProduct()` method that returns the built object and resets the builder for reuse. An optional director class coordinates step sequences for common configurations. Clients can also call builder steps directly for custom builds. See [[typescript-pattern-techniques]].

## See also

- [[factory-method-pattern]] — simpler; patterns often evolve from Factory Method toward Builder
- [[abstract-factory-pattern]] — returns products immediately, while Builder adds extra construction steps
- [[composite-pattern]] — Builder works well for constructing Composite trees
- [[bridge-pattern]] — the director acts as abstraction, builders as implementations
