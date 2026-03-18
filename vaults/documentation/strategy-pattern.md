# Strategy Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that defines a family of algorithms, places each in a separate class, and makes their objects interchangeable at runtime.

## Problem

A class accumulates numerous conditional branches for different algorithmic approaches (e.g., routing methods: car, walking, transit, cycling). The class becomes unwieldy, hard to maintain, and risky to modify.

## Solution

Extract each algorithm into its own class implementing a common interface. The context object holds a reference to a strategy and delegates work to it. Clients select or swap strategies at runtime without modifying the context.

## When to use

- Multiple ways to perform the same task with runtime switching
- Similar classes differ only in execution behavior
- Isolating algorithmic complexity from core business logic
- A class contains massive conditional statements selecting between algorithm variants

## Pros and cons

Runtime algorithm swapping. Isolated implementations. Composition over inheritance ([[open-closed-principle]]). The tradeoffs are unnecessary complexity for few algorithms and the fact that clients must understand strategy differences. Modern functional programming (passing functions) can reduce the need for this pattern.

## TypeScript implementation

Defines a strategy interface declaring the algorithm method. The context holds a private strategy reference, accepts one via the constructor, and provides a setter for runtime swapping. Concrete strategies implement the interface with different algorithms. The context delegates work to `this.strategy.doAlgorithm()` without knowing which concrete strategy is active. See [[typescript-pattern-techniques]].

## See also

- [[state-pattern]] — same composition structure, but State allows inter-state dependencies while Strategy keeps implementations independent
- [[bridge-pattern]] — similar composition-based delegation for a different problem
- [[command-pattern]] — both parameterize objects, but Command converts operations into objects while Strategy describes algorithmic alternatives
- [[decorator-pattern]] — Decorator changes the "skin"; Strategy changes the "guts"
- [[template-method-pattern]] — Template Method uses inheritance for algorithm variation; Strategy uses composition
- [[replace-type-code-with-state-strategy]] — the refactoring technique that introduces this pattern
- [[replace-conditional-with-polymorphism]] — a related technique for eliminating type-based branching
- [[dependency-inversion-principle]] — the context depends on the strategy abstraction, not concrete algorithms
- [[trigger-validation-switch-chains]] — switches that could be replaced with strategy registries
- [[status-condition-ripple-effect]] — a condition registry as a strategy application
- [[status-condition-registry]] — a potential condition property registry
- [[trigger-validation-strategy-registry]] — a potential validation dispatch registry
