# Interface Segregation Principle

"Clients should not be forced to depend upon interfaces that they do not use."

Many small, specific interfaces are better than one massive general-purpose interface. A class should not have to implement methods it will never use just because they are grouped together.

Analogy: a streaming subscription that forces you to pay for a sports package when you only watch documentaries. Segregated packages would be better.

In code: instead of one large `MultiFunctionDevice` interface with `print()`, `scan()`, and `fax()` methods, split into `Printer`, `Scanner`, and `Fax` interfaces. A simple printer class only implements `print()`.

Part of [[solid-principles]].

## See also

- [[extract-interface]] — the refactoring technique that directly applies ISP
- [[pinia-store-classification]] — the zero-state ISP stores (e.g., `encounterCombat`) apply this principle by exposing only actions with no state/getters
- [[combatant-interface-breadth]] — 35-field interface mixing 8+ concerns
- [[player-action-request-optionals]] — 20 optional fields instead of a discriminated union
- [[encounter-store-god-object-risk]] — consumers forced to depend on the full encounter store surface
- [[trait-composed-domain-model]] — a destructive proposal that applies ISP to the Combatant via narrow trait interfaces
- [[combatant-interface-bloat]] — the Combatant interface forces consumers to depend on 30+ fields they don't use
- [[solid-violation-causal-hierarchy]] — ISP violations here are symptoms of upstream SRP violations in the combatant service
