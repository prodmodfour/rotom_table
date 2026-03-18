# Abstract Factory Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that produces families of related objects without specifying their concrete classes.

## Problem

When a system must create groups of related objects (e.g., UI elements matching a single theme), direct instantiation risks mixing incompatible variants. Client code becomes dependent on concrete classes and must change whenever a new family is introduced.

## Solution

Declare interfaces for each product type, then create concrete factories — one per family — that produce only compatible products. Client code works through the abstract factory and product interfaces, never touching concrete classes.

## When to use

- Code must interact with related product families but should not depend on concrete classes
- New product variants are expected in the future
- Objects from the same family must be compatible with each other

## Pros and cons

Guarantees product compatibility within a family. Decouples client code from concrete implementations ([[open-closed-principle]]). Centralizes creation logic. The tradeoff is additional interfaces and classes for each family.

## TypeScript implementation

Declares interfaces for both the factory and each product type. Concrete factories implement the factory interface and return compatible product variants. Client code depends entirely on interface types — the function signature accepts the abstract factory, enabling any concrete factory to be passed in. Products from the same factory are guaranteed compatible because each factory only creates its own family. See [[typescript-pattern-techniques]].

## See also

- [[factory-method-pattern]] — a simpler predecessor; Abstract Factory often evolves from it
- [[builder-pattern]] — both create object families, but Builder emphasizes step-by-step construction
- [[prototype-pattern]] — factory methods can be composed through prototype cloning
- [[facade-pattern]] — an alternative way to hide subsystem object creation
- [[bridge-pattern]] — can pair with Abstract Factory to encapsulate platform relations
- [[singleton-pattern]] — an Abstract Factory itself is often implemented as a Singleton
- [[dependency-inversion-principle]] — client code depends on factory abstractions, not concretions
