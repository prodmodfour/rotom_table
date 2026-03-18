# Memento Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that captures and restores an object's previous state without revealing the details of its implementation.

## Problem

Implementing undo or rollback requires capturing an object's internal state, but accessing private fields from outside violates encapsulation. Exposing internals makes the class fragile and dependent on implementation details.

## Solution

Delegate snapshot creation to the object itself (the **originator**). The originator stores its state in a special **memento** object that only the originator can read. A **caretaker** maintains a stack of mementos without ever tampering with their contents. To undo, the originator retrieves and applies a memento's data through its own mechanisms.

## When to use

- Implementing undo/redo requiring previous state recovery
- Managing transactions where operations must roll back on error
- External classes cannot access an object's internal fields

## Pros and cons

Preserves encapsulation while enabling state snapshots. Simplifies the originator by offloading history management to the caretaker. The tradeoffs are high memory consumption from frequent snapshots and the need to track originator lifecycles for cleanup.

## TypeScript implementation

Uses an interface for the memento that exposes only metadata (`getName()`, `getDate()`) — not the stored state. The concrete memento stores state privately alongside a timestamp. The originator creates mementos via `save()` and reads them via `restore()`. The caretaker maintains a memento array as a history stack, calling `push` to save and `pop` to undo, without ever accessing memento contents directly. See [[typescript-pattern-techniques]].

## See also

- [[command-pattern]] — together with Memento, enables undo by storing command history alongside state snapshots
- [[iterator-pattern]] — Memento can capture and roll back iteration state
- [[prototype-pattern]] — a simpler alternative for straightforward objects without external dependencies
- [[undo-redo-as-memento-pattern]] — the encounter undo/redo system as a memento implementation
