# Bridge Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that splits a large class or set of related classes into two separate hierarchies — abstraction and implementation — so they can vary independently.

## Problem

Extending classes along multiple independent dimensions simultaneously causes exponential subclass growth. Adding both shape variants and color variants means every combination needs its own class.

## Solution

Extract one dimension into a separate hierarchy and hold a reference to it via composition instead of inheritance. The abstraction (high-level control layer) delegates actual work to the implementation (platform-specific layer). Both hierarchies evolve independently.

## When to use

- A monolithic class has variant functionality along multiple independent axes
- Runtime switching of the implementation object is needed
- Avoiding exponential subclass growth across orthogonal dimensions

## Pros and cons

Creates platform-independent abstractions. Client code works at a high level, isolated from platform details ([[open-closed-principle]], [[single-responsibility-principle]]). The tradeoff is added complexity when applied to tightly cohesive classes.

## TypeScript implementation

The abstraction class holds a `protected` reference to an implementation interface, injected via the constructor. Extended abstractions inherit from the base abstraction and override its operation to add higher-level behavior. Implementations follow a separate interface hierarchy. The two hierarchies evolve independently — adding a new abstraction variant or implementation requires no changes to the other side. See [[typescript-pattern-techniques]].

## See also

- [[adapter-pattern]] — Adapter retrofits existing systems; Bridge is designed upfront
- [[state-pattern]] — shares a similar composition structure but solves a different problem
- [[strategy-pattern]] — same structural similarity; Strategy describes algorithmic variation
- [[abstract-factory-pattern]] — can pair with Bridge when certain abstractions only work with certain implementations
- [[builder-pattern]] — the director acts as abstraction, builders as implementations
- [[composition-over-inheritance]] — Bridge is a direct application of this principle, composing abstraction and implementation via a reference
