# Command Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that encapsulates a request as a standalone object containing all the information needed to perform the action.

## Problem

When multiple UI elements (buttons, menus, shortcuts) trigger the same business logic, implementations get duplicated and GUI components become tightly coupled to volatile business logic. Each element variant needs its own subclass.

## Solution

Encapsulate each request as a command object with a common execution interface. Commands decouple senders (UI) from receivers (business logic) by acting as a middle layer. Commands can be parameterized, queued, logged, serialized, or scheduled for later execution.

## When to use

- Parameterizing objects with operations or passing commands as arguments
- Queuing, scheduling, or executing operations remotely
- Implementing undo/redo by maintaining a command history with state snapshots

## Pros and cons

Decouples invokers from performers ([[single-responsibility-principle]]). New commands can be added without modifying existing code ([[open-closed-principle]]). Supports deferred and reversible operations. Simple commands compose into complex sequences. The tradeoff is an additional abstraction layer.

## TypeScript implementation

Defines a command interface with a single `execute()` method. Simple commands carry their own payload and act directly. Complex commands hold a reference to a receiver object and delegate the actual work. The invoker stores command references and uses a type guard predicate (`object is Command`) for runtime type checking before execution. See [[typescript-pattern-techniques]].

## See also

- [[strategy-pattern]] — both parameterize objects, but Command converts operations into objects while Strategy describes algorithmic alternatives
- [[memento-pattern]] — together they enable undo by combining command history with state snapshots
- [[chain-of-responsibility-pattern]] — CoR passes requests sequentially; Command establishes direct sender-receiver links
- [[observer-pattern]] — Observer uses dynamic subscriptions; Command uses fixed links
- [[visitor-pattern]] — a more powerful variant for executing operations across diverse object types
- [[undo-redo-as-memento-pattern]] — current undo/redo uses memento; command pattern is an alternative approach
- [[event-sourced-encounter-state]] — a destructive proposal where encounter events are executed commands recorded as an immutable log
