# Iterator Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that provides a way to traverse elements of a collection without exposing its underlying representation.

## Problem

Collections vary in internal structure — lists, trees, graphs — and each needs different traversal strategies (depth-first, breadth-first, random). Adding traversal algorithms directly to collection classes blurs their responsibility. Client code becomes coupled to specific collection implementations.

## Solution

Extract traversal behavior into separate iterator objects. Each iterator encapsulates the traversal algorithm and its own state (current position, remaining elements). All iterators share a common interface, so clients can traverse any collection type uniformly. Multiple iterators can traverse the same collection simultaneously.

## When to use

- A collection has complex internal structure that should stay hidden
- Reducing duplication of traversal code across the application
- Code must handle different or unknown collection structures

## Pros and cons

Separates traversal logic from collection logic ([[single-responsibility-principle]]). New iterators and collections can be added independently ([[open-closed-principle]]). Enables parallel iteration and deferred traversal. The tradeoff is unnecessary overhead for simple collections.

## TypeScript implementation

Defines a generic `Iterator<T>` interface with `current()`, `next()`, `key()`, `valid()`, and `rewind()` methods, and a separate `Aggregator` interface for collections that produce iterators. The concrete iterator maintains internal position state and supports directional control via a `reverse` constructor parameter, enabling both forward and backward traversal from the same class. Collections expose factory methods (`getIterator()`, `getReverseIterator()`) for creating iterators. See [[typescript-pattern-techniques]].

## See also

- [[composite-pattern]] — Iterator traverses Composite tree structures
- [[factory-method-pattern]] — collection subclasses can return compatible iterators via factory methods
- [[memento-pattern]] — can capture and restore iteration state
- [[visitor-pattern]] — combines with Iterator for operating across heterogeneous collections
