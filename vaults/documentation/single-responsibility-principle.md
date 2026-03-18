# Single Responsibility Principle

"A class should have one, and only one, reason to change."

Every class, module, or function should have only one primary job. If a class does too many things, it becomes tightly coupled and harder to update.

Analogy: a chef cooks food, a delivery driver delivers it. If the chef had to do both, cooking would stop every time a delivery had to be made.

In code: a class that handles user authentication should not also format the welcome email.

Part of [[solid-principles]].

## See also

- [[large-class-smell]] — a large class almost always violates SRP
- [[divergent-change-smell]] — a direct symptom of SRP violations in a class
- [[service-layer-pattern]] — the three-tier separation is a direct application of this principle
- [[service-delegation-rule]] — enforces that API routes only handle HTTP concerns
- [[service-pattern-classification]] — pure services staying pure is a responsibility boundary
- [[facade-pattern]] — keeps subsystem concerns out of client code
- [[command-pattern]] — decouples invoking from performing operations
- [[pure-service-testability-boundary]] — the purity contract as an SRP success
- [[next-turn-route-business-logic]] — 846-line route as an SRP violation
- [[combatant-service-mixed-domains]] — five domains in one service
- [[out-of-turn-service-bundled-actions]] — four action types in one service
- [[encounter-store-god-object-risk]] — encounter store as potential God Object
- [[separation-of-concerns]] — related but distinct; SRP focuses on reasons to change, SoC focuses on domain boundaries
- [[solid-violation-causal-hierarchy]] — SRP is a root cause in this codebase; its violations drive ISP and OCP symptoms downstream
