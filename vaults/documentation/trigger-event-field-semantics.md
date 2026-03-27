# TriggerEvent Field Semantics

[[combat-event-log-schema|TriggerEvent]] fields carry different meanings depending on the event type. The `amount` field on a `damage-dealt` event is the damage value; on an `accuracy-check` event, it is the roll value. Handlers must read the semantically correct field for their purpose, not reinterpret a generic field.

## CombatEvent base fields

These fields are present on all events and have stable semantics:

| Field | Meaning |
|---|---|
| `round` | The combat round number |
| `type` | The [[combat-event-log-schema|CombatEventType]] discriminant |
| `sourceId` | Entity ID of the actor who caused the event |
| `targetId` | Entity ID of the entity affected by the event |
| `moveId` | The move that produced this event (optional) |
| `isDamagingMove` | Whether the source move deals damage (optional) |
| `amount` | **Event-type-dependent** — see table below |

## `amount` semantics by event type

| Event type | `amount` meaning |
|---|---|
| `damage-dealt` / `damage-received` | Damage value dealt or received |
| `heal` / `healing-attempted` | HP restored |
| `accuracy-check` | The raw accuracy roll (1d20 value) |
| `roll-completed` | The completed roll value |
| Other event types | Not populated (undefined) |

## TriggerEvent transient fields

These fields are populated by the engine on trigger dispatch and do not persist in the combat log:

| Field | Meaning | Populated on |
|---|---|---|
| `moveType` | The move's Pokemon type | `damage-dealt`, `damage-received`, `move-used` |
| `isContact` | Whether the move makes physical contact | `damage-dealt`, `damage-received` |
| `damageClass` | `'physical'` or `'special'` | `damage-dealt`, `damage-received` |
| `moveRange` | `'melee'` or `'ranged'` | `damage-dealt`, `damage-received` |
| `sourceEntityId` | Alias for sourceId | All trigger events |
| `accuracyRoll` | The accuracy roll that produced this hit | `damage-dealt`, `damage-received` |

## The convention

When a trigger handler needs a specific value, read the field whose name matches the concept:

```
// Correct — reads the accuracy roll from the dedicated field
if ((ctx.event.accuracyRoll ?? 0) < 18) return noEffect()

// Wrong — reads `amount` on a damage-dealt event, which is the damage value
if ((ctx.event.amount ?? 0) < 18) return noEffect()
```

Finding 139 demonstrated the consequence: Poison Coated read `ctx.event.amount` on a `damage-dealt` event, treating the damage value as an accuracy roll. High-damage hits would always trigger poison; low-damage hits never would — regardless of the actual roll.

## See also

- [[combat-event-log-schema]] — the base CombatEvent type and CombatEventType union
- [[effect-handler-contract]] — TriggerContext provides TriggerEvent to trait handlers
- [[effect-trigger-event-bus]] — the dispatch system that populates TriggerEvent fields
- [[inappropriate-intimacy-smell]] — reading a field whose semantics belong to a different event type
