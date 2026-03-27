# Event-Sourced Encounter State

A destructive restructuring to replace mutable encounter CRUD with an append-only event log and computed state.

## The idea

Currently, encounter state is a mutable blob. Each API route reads the current state, mutates it, and writes it back. The ~44 encounter routes each perform their own read-mutate-write cycle against [[denormalized-encounter-combatants|JSON columns]]. The encounter store mirrors this on the client, receiving full state snapshots via WebSocket.

Model every encounter action as an immutable event. The encounter's current state is computed by replaying the event log from the beginning.

```typescript
type EncounterEvent =
  | { type: 'COMBATANT_ADDED'; combatant: CombatantData; timestamp: number }
  | { type: 'DAMAGE_DEALT'; targetId: string; amount: number; source: string }
  | { type: 'STATUS_APPLIED'; targetId: string; condition: StatusCondition }
  | { type: 'TURN_ADVANCED'; newTurn: number; newRound: number }
  | { type: 'MOVE_DECLARED'; combatantId: string; moveId: string; targetId: string }
  | { type: 'POKEMON_SWITCHED'; oldId: string; newId: string }
  | { type: 'POKEMON_CAPTURED'; pokemonId: string; ballType: string }
  // ... one event type per atomic game action

function computeState(events: EncounterEvent[]): EncounterState {
  return events.reduce(applyEvent, initialEncounterState())
}
```

Every route becomes: validate the action, emit an event, broadcast the event via WebSocket. No more read-mutate-write. No more full-state sync.

## Why this is destructive

- **All 44 encounter routes** are rewritten — each emits events instead of mutating state
- **The database schema** changes from a single mutable Encounter row (with ~15 JSON columns) to an append-only `EncounterEvent` table
- **The encounter store** is rewritten as an event log reducer
- **WebSocket sync** changes from full-state broadcasts to event streaming — clients apply events locally
- **The undo/redo system** is replaced — undo is "remove the last event and recompute"
- **The combat log** becomes a natural projection of the event stream — no separate `moveLog` JSON column needed

## Principles improved

- [[single-responsibility-principle]] — each event handler has one job; validation is separate from state mutation
- [[open-closed-principle]] — new actions mean new event types, not modifications to existing mutation code
- [[command-pattern]] — events are commands that have been executed and recorded
- Eliminates the encounter store god object risk — the store becomes a simple reducer function
- Eliminates the WebSocket sync problem — clients and server share the same event reducer

## Patterns and techniques

- [[command-pattern]] — events are executed commands
- [[observer-pattern]] — clients subscribe to the event stream
- [[memento-pattern]] — the event log IS the history; snapshots are optional performance optimizations
- CQRS (Command Query Responsibility Segregation) — writes append events; reads compute state from the log

## Trade-offs

- **Replay cost.** Long encounters accumulate hundreds of events. Recomputing state from scratch on every request is expensive. Snapshots (periodic state checkpoints) mitigate this but add complexity.
- **Event schema evolution.** Once events are persisted, their schema is immutable. Adding new fields to an event type requires migration logic ("events before v2 don't have this field, default to X"). This is harder than adding a column to a mutable table.
- **Debugging difficulty.** The current system lets you inspect state directly in the database. With event sourcing, you must replay events to see state, or maintain a separate projection table.
- **Client complexity.** The client must maintain a local event log and reducer. If events arrive out of order (network latency), the client must handle reordering or conflict resolution.
- **Tooling absence.** The current stack (Prisma, SQLite, Nuxt) has no event-sourcing framework. This is entirely hand-rolled.

## Open questions

- Should the event store be a separate SQLite table, or should the encounter row hold a JSON array of events (ironic given [[encounter-schema-normalization]] proposes eliminating JSON columns)?
- How granular should events be? `DAMAGE_DEALT` vs `ATTACK_RESOLVED` (which bundles accuracy check, damage calc, status effects)?
- How does this interact with [[game-engine-extraction]]? If the engine is event-sourced, it produces events; if not, events are emitted by the service layer.
- Is the complexity justified for a single-GM, single-encounter app? Event sourcing shines with concurrent writers and audit requirements — does this app have those needs?
- How to handle "what-if" scenarios (damage preview, capture probability display) that currently compute tentative state? Do they create speculative events?

## See also

- [[command-pattern]] — the theoretical foundation
- [[denormalized-encounter-combatants]] — the mutable pattern being replaced
- [[encounter-schema-normalization]] — an alternative (but compatible) destructive approach to the data model
- [[encounter-lifecycle-state-machine]] — events become state transitions in the machine
