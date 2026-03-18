# Large Class

A [[bloater-smells|bloater]] [[code-smells|smell]]. A class with too many fields, methods, or lines of code. Like [[long-method-smell|long methods]], large classes accumulate because it feels easier to add functionality to an existing class than to create a new one.

Large classes have multiple reasons to change, unclear primary purposes, and tangled internal dependencies.

## See also

- [[extract-class]] — the primary technique for splitting a large class
- [[single-responsibility-principle]] — a large class almost always violates SRP
- [[divergent-change-smell]] — a large class often forces divergent changes since it handles multiple concerns
- [[encounter-store-god-object-risk]] — the encounter store's total surface area
- [[next-turn-route-business-logic]] — 846-line route handler
- [[combatant-service-mixed-domains]] — 792-line service with five responsibility domains
- [[combatant-interface-breadth]] — the type-level equivalent: a 35-field interface mixing 8+ concerns
