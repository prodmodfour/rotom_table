# Dependency Inversion Principle

"Depend upon abstractions, not concretions."

High-level modules (core application logic) should not depend directly on low-level modules (database connections, file systems). Both should depend on abstractions (like interfaces).

Analogy: plugging a lamp into a standard wall socket rather than wiring it directly into the house's electrical framework. The socket abstraction lets you unplug the lamp and plug in a toaster.

In code: core logic that needs to save data should depend on a generic `DatabaseRepository` interface, not a specific SQL database. You can then swap SQL for NoSQL without touching the core logic.

Part of [[solid-principles]].

## See also

- [[abstract-factory-pattern]] — client code depends on factory abstractions, not concrete product classes
- [[strategy-pattern]] — the context depends on the strategy interface, not concrete algorithms
- [[solid-violation-causal-hierarchy]] — DIP is a root cause; its violations drive LSP and OCP symptoms downstream
