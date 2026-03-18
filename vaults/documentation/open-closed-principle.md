# Open-Closed Principle

"Software entities should be open for extension, but closed for modification."

New functionality should be addable without changing existing code. This prevents breaking systems that are already working and tested.

Analogy: a web browser gains features through extensions (open for extension) without rewriting its core code (closed for modification).

In code: instead of massive if/else chains to handle different payment types, create a base `PaymentProcessor` interface and let new payment types extend it.

Part of [[solid-principles]].

## See also

- [[switch-statements-smell]] — switch statements violate OCP because adding a new type requires modifying the existing branching logic
- [[strategy-pattern]] — algorithms swap at runtime without modifying context code
- [[decorator-pattern]] — behaviors added dynamically without changing existing classes
- [[observer-pattern]] — new subscribers integrate without modifying the publisher
- [[websocket-union-extensibility]] — discriminated unions as OCP success in the codebase
- [[trigger-validation-switch-chains]] — switch statements that violate OCP
- [[grid-isometric-interaction-duplication]] — duplication that prevents clean extension
- [[status-condition-ripple-effect]] — adding a condition requires modifying many files
- [[solid-violation-causal-hierarchy]] — OCP violations here are symptoms of upstream SRP+DIP violations in the game-logic boundary
