# Composite Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that composes objects into tree structures and lets clients treat individual objects and compositions uniformly.

## Problem

When data naturally forms a hierarchy (e.g., products inside boxes inside bigger boxes), calculating aggregate properties requires knowing concrete types and nesting depth. Client code must treat simple elements and containers differently.

## Solution

Introduce a common interface that both leaves and containers implement. Leaves perform direct operations; containers recursively delegate to their children and aggregate results. Clients interact with all elements through the shared interface using polymorphism.

## When to use

- The core model can be represented as a tree of leaves and containers
- Client code should handle simple and complex elements identically without type-checking

## Pros and cons

Complex tree structures become easier to work with through polymorphism and recursion. New element types can be added without modifying existing code ([[open-closed-principle]]). The tradeoff is that the common interface may become overly general for classes with very different functionality.

## TypeScript implementation

Uses an abstract class for the base component, declaring an abstract `operation()` method. The parent reference uses the non-null assertion (`!`) since it is set after construction. Leaf implements `operation()` directly. Composite maintains a children array, delegates `operation()` recursively through its children, and aggregates results. An `isComposite()` method enables client code to safely manage children without type-checking. See [[typescript-pattern-techniques]].

## See also

- [[builder-pattern]] — effective for constructing Composite trees recursively
- [[chain-of-responsibility-pattern]] — often pairs with Composite for request propagation through trees
- [[iterator-pattern]] — traverses Composite trees
- [[visitor-pattern]] — executes operations across entire Composite trees
- [[decorator-pattern]] — similar structure with one child; Decorator adds behavior, Composite aggregates results
- [[prototype-pattern]] — clone complex Composite structures instead of reconstructing them
- [[flyweight-pattern]] — Flyweight can implement shared Composite leaf nodes to save memory
