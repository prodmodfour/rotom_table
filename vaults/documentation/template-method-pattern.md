# Template Method Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that defines an algorithm's skeleton in a base class, letting subclasses override specific steps without changing the overall structure.

## Problem

Multiple classes implement nearly identical algorithms with minor variations, leading to substantial code duplication. Changes to the shared logic must be replicated across all variants.

## Solution

Decompose the algorithm into discrete steps as methods in a base class. A single template method orchestrates the step calls. Steps can be:

- **Abstract** — subclasses must implement them
- **Optional** — have default implementations that subclasses may override
- **Hooks** — empty extension points that subclasses may optionally fill in

Common logic lives in the base class; only the varying parts are overridden.

## When to use

- Clients should extend only particular steps of an algorithm, not the whole thing
- Several classes have nearly identical algorithms with minor differences
- Standardizing algorithm structure while allowing implementation variation

## Pros and cons

Clients modify only specific segments. Common code consolidates in the base class. The tradeoffs are rigid algorithm structure, risk of violating [[liskov-substitution-principle]] through step suppression, and maintainability challenges as steps increase.

## TypeScript implementation

Uses an abstract class that defines the template method as a concrete `public` method orchestrating the step calls. Required steps are marked `protected abstract` — subclasses must implement them. Optional hooks are `protected` methods with empty default implementations that subclasses may override. Base operations are concrete `protected` methods providing shared behavior. This three-tier approach (required, optional, fixed) maps directly to TypeScript's access modifiers and abstract keyword. See [[typescript-pattern-techniques]].

## See also

- [[factory-method-pattern]] — Factory Method is often a step within a Template Method
- [[strategy-pattern]] — Template Method uses inheritance (compile-time); Strategy uses composition (runtime)
- [[switching-validation-duplication]] — shared validation skeleton with variant-specific steps
- [[grid-isometric-interaction-duplication]] — shared interaction logic with coordinate-system-specific steps
- [[composition-over-inheritance]] — when the algorithm skeleton may itself need to vary, composition via [[strategy-pattern]] is safer than Template Method's inheritance
