# Prototype Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that creates new objects by cloning existing ones, without coupling code to their concrete classes.

## Problem

Creating an exact copy of an object from outside requires knowledge of its concrete class and access to private fields. Sometimes only an interface is known, making direct construction impossible.

## Solution

Delegate cloning to the objects themselves. Objects that support copying implement a common interface with a single `clone` method. Pre-built prototypes in various configurations serve as templates — clone them instead of constructing from scratch.

## When to use

- Code works with objects received through interfaces where the concrete class is unknown
- Reducing subclasses that differ only in how they are initialized

## Pros and cons

Decouples cloning from concrete class dependencies. Eliminates repeated initialization code. Provides an alternative to inheritance for configuration variants. The tradeoff is that cloning objects with circular references is difficult.

## TypeScript implementation

Uses `Object.create()` for prototype chain cloning. The `clone()` method returns the `this` type to preserve the concrete type in clones. Nested objects require deep cloning — simple `Object.create()` copies references, so complex objects and those with circular back-references need explicit reassignment after cloning. See [[typescript-pattern-techniques]].

## See also

- [[factory-method-pattern]] — often evolves toward Prototype as flexibility needs grow
- [[abstract-factory-pattern]] — factory methods can be composed using Prototype cloning
- [[composite-pattern]] — Prototype can clone complex Composite structures
- [[decorator-pattern]] — designs heavy on Decorator benefit from Prototype for cloning wrapped structures
