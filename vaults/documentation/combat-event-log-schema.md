# Combat Event Log Schema

Structured historical record of combat events, queryable by effects that depend on past actions. Part of the [[game-state-interface]] encounter context layer.

## Why a structured log

Some effects require historical queries:

- **Retaliate** — "did an ally of mine faint from a damaging move by the target in the last 2 rounds?" If yes, DB is doubled.
- **Destiny Bond** — "did the bound target cause the user to faint?" If yes, mutual faint.

These are not optional logging concerns — they are load-bearing game state that effects read from during resolution. The log must be structured (typed events with fields) not prose (text strings).

## The event struct

```
CombatEvent {
  round: number
  type: 'damage' | 'faint' | 'status-applied' | 'move-used' | 'switch' | 'heal' | ...
  sourceId: string
  targetId: string
  moveId?: string
  isDamagingMove?: boolean
  amount?: number
}
```

- **round** — which round the event occurred in. Enables recency queries (Retaliate checks "last 2 rounds").
- **type** — discriminant for the event kind. Each type has its own relevant optional fields.
- **sourceId / targetId** — who caused it and who it happened to. Always present for attribution.
- **moveId** — which move, if any. Present on `damage`, `status-applied`, and `move-used` events.
- **isDamagingMove** — whether the source move was damaging. Retaliate specifically checks "fainted by a Damaging Move," not just "fainted."
- **amount** — numeric value (damage dealt, HP healed) for magnitude queries.

## CombatEvent vs TriggerEvent

`CombatEvent` is the lean historical record stored in the log. The [[effect-handler-contract|TriggerContext]] provides a richer `TriggerEvent` type that extends `CombatEvent` with transient metadata (move type, contact flag, damage class, move range) that trigger handlers need during resolution but that doesn't persist in the log. This keeps the log slim for storage and querying while giving handlers the context they need.

## Encounter context interface

```
HasCombatLog {
  events: CombatEvent[]
}
```

The event log lives on encounter state, not per-combatant. Events are appended by the engine after every damage application, faint, status infliction, move use, switch, and heal. Effects query the log as part of their [[resolution-context-inputs]] — the engine provides a filtered view (e.g., "events involving target X in the last 2 rounds").

## See also

- [[game-state-interface]] — the parent design
- [[resolution-context-inputs]] — the log is part of the context effects receive
- [[turn-lifecycle]] — events are generated during turn resolution
- [[effect-handler-contract]] — handlers produce CombatEvents in their EffectResult
- [[effect-trigger-event-bus]] — trigger handlers subscribe to combat event types
- [[trigger-event-field-semantics]] — what each TriggerEvent field means per event type
