# Visitor Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that separates algorithms from the objects they operate on, adding new operations without modifying existing classes.

## Problem

Adding a new operation (e.g., XML export) to a complex object hierarchy requires modifying every class in the hierarchy — risky in production, violates [[single-responsibility-principle]], and couples auxiliary logic to core domain classes.

## Solution

Place the new behavior in a separate visitor class. Objects accept visitors and delegate the operation via "double dispatch" — the object calls the appropriate visitor method based on its own type, eliminating type-checking conditionals. Each visitor encapsulates one operation across the entire hierarchy.

## When to use

- Performing multiple distinct operations across a class hierarchy without modifying the classes
- Keeping primary domain classes focused on their core responsibility
- Certain operations apply only to specific classes in the hierarchy

## Pros and cons

New operations don't require modifying existing classes ([[open-closed-principle]]). Related algorithm variants consolidate in one visitor. Visitors can accumulate state while traversing. The tradeoffs are that adding new element types forces updates to all existing visitors, and visitors may lack access to private members.

## TypeScript implementation

Defines a component interface with an `accept(visitor)` method and a visitor interface with a visit method per concrete component type (e.g., `visitConcreteComponentA(element)`). Each component's `accept` implementation calls the visitor's matching method, passing `this` — this is double dispatch, resolving both the component and visitor types at runtime. Visitors receive the concrete component type, giving them access to component-specific methods. See [[typescript-pattern-techniques]].

## See also

- [[command-pattern]] — Visitor is a more powerful variant for operations across diverse object types
- [[composite-pattern]] — Visitor traverses and operates on Composite trees
- [[iterator-pattern]] — complements Visitor for traversing heterogeneous collections
