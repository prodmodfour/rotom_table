# Liskov Substitution Principle

"Subtypes must be substitutable for their base types without altering the correctness of the program."

If you have a base class and a child class, swapping the base for the child should not break or produce unexpected behavior. The child must honor the contract of the parent.

Analogy: ordering a regular coffee and getting decaf — it fits the cup and looks the same, but fails to deliver the expected behavior (caffeine).

In code: if a `Bird` class has a `fly()` method and you create a `Penguin` subclass, calling `fly()` on the penguin causes an error because penguins can't fly. This violates LSP. The fix is to rethink the hierarchy (e.g., separating birds into flying and non-flying categories).

Part of [[solid-principles]].

## See also

- [[refused-bequest-smell]] — subclasses that don't honor the parent's contract violate LSP
- [[combatant-type-hierarchy]] — the Pokemon/HumanCharacter → Combatant hierarchy must satisfy this principle
- [[template-method-pattern]] — suppressing inherited steps in subclasses risks violating LSP
- [[entity-union-unsafe-downcasts]] — 144 unsafe type casts from the Pokemon/HumanCharacter union
- [[entity-shared-field-incompatibility]] — shared field names with incompatible types
- [[solid-violation-causal-hierarchy]] — LSP violations here are symptoms of upstream DIP violations in the entity data model
