# Factory Method Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that provides an interface for creating objects in a superclass but allows subclasses to alter the type of objects created.

## Problem

Code becomes tightly coupled to concrete classes when object creation is scattered throughout the codebase. Adding a new product type requires modifying every place that creates objects, leading to fragile conditional logic.

## Solution

Replace direct construction with a factory method that subclasses override to produce different product types. All products share a common interface so client code stays agnostic to concrete implementations. This decouples business logic from object creation.

## When to use

- Exact object types and dependencies are not known in advance
- A framework needs to let users extend its internal components
- Object pooling or caching is needed without polluting constructors

## Pros and cons

Eliminates tight coupling between creators and products. Centralizes creation logic ([[single-responsibility-principle]]). New product types can be added without breaking existing code ([[open-closed-principle]]). The tradeoff is additional subclass hierarchies.

## TypeScript implementation

Uses an abstract class for the creator with an abstract `factoryMethod()` that subclasses override. Products implement a shared interface. The creator's business logic calls the factory method internally, staying agnostic to the concrete product type. Subclass factory methods return the product interface type even though they instantiate concrete classes, maintaining [[dependency-inversion-principle|dependency inversion]]. See [[typescript-pattern-techniques]].

## See also

- [[abstract-factory-pattern]] — Factory Method often evolves into Abstract Factory
- [[builder-pattern]] — another evolution path for more complex construction
- [[prototype-pattern]] — an alternative creational approach using cloning
- [[template-method-pattern]] — Factory Method is often a step within a Template Method
- [[replace-constructor-with-factory-method]] — the refactoring technique that introduces this pattern
