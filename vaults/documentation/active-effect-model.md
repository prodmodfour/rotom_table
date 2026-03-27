# Active Effect Model

Generic, open-ended tracking for buffs and debuffs that don't fit the [[status-condition-categories|status/volatile condition]] system. Replaces named fields (`flashFireBonus`, `healBlocked`, `boundTo`) with a single extensible collection. Part of the [[game-state-interface]].

## Why not named fields

The state inventory initially proposed `HasBuffTracking` with named fields for each known effect: Flash Fire's damage bonus, Heal Block's suppression flag, Destiny Bond's binding. Three fields for three definitions from a 45-move sample. When scaled to 382 moves and 198 traits, each effect-specific tracking state becomes a new field. This violates:

- [[large-class-smell]] — the interface accumulates fields unboundedly
- [[divergent-change-smell]] — every new effect with persistent state requires modifying the interface
- [[temporary-field-smell]] — most fields are empty for most entities (`flashFireBonus` is meaningless unless Flash Fire is active)

Per trait composed domain model, the state model must be composable and open-ended.

## The ActiveEffect struct

```
ActiveEffect {
  effectId: string
  sourceEntityId: string
  state: Record<string, unknown>
  expiresAt?: { round: number } | { onEvent: EventType }
  triggers?: TriggerRegistration[]
  clearedBy?: ClearCondition[]
}

ClearCondition = 'switch-out' | 'take-a-breather' | 'end-of-action' | 'caster-faint'
```

- **effectId** — identifies this effect type. The engine uses it for filtering (`hasActiveEffect(lens, 'heal-block')`), stacking policy enforcement, and handler deduplication.
- **sourceEntityId** — who applied it. Used for source-dependent clearing, attribution, and caster-switch destruction.
- **state** — effect-specific mutable data. Each effect's handler documents what keys it stores. Handlers read/write these keys through the `state` record.
- **expiresAt** — when the effect ends. Round-based (`{ round: 5 }` = expires at end of round 5), event-based (`{ onEvent: 'user-turn-end' }` = expires when the source entity's turn ends), or string shorthand (`'end-of-action'` for Protect/Wide Guard).
- **triggers** — optional [[effect-trigger-event-bus|TriggerRegistration]] array. When the ActiveEffect is added to the lens, the engine registers these handlers with the event bus. When the effect expires or is removed, the engine unregisters them. This is the link between an ActiveEffect instance and its reactive behavior — Wide Guard's `damage-received/before` interception handler, Protect's interception handler, and Heal Block's `healing-attempted/before` suppression handler are all registered through this field.
- **clearedBy** — optional conditions that immediately remove this effect, independent of `expiresAt`. Heal Block is cleared by `switch-out` or `take-a-breather`. Protect and Wide Guard are cleared by `end-of-action`. The engine evaluates clear conditions at the appropriate lifecycle points.

## Examples

**Flash Fire** — type-absorb trait that grants a one-turn damage bonus:
```
{ effectId: 'flash-fire-boost', sourceEntityId: 'entity-self', state: { bonusDamage: 5 }, expiresAt: { onEvent: 'user-turn-end' } }
```

**Heal Block** — persistent suppression preventing all healing:
```
{ effectId: 'heal-block', sourceEntityId: 'entity-123', state: {}, expiresAt: undefined, triggers: [healBlockTrigger], clearedBy: ['switch-out', 'take-a-breather'] }
```
No time expiry — cleared by switch out or Take a Breather via `clearedBy`. The `triggers` field registers a `healing-attempted/before` handler with the [[effect-trigger-event-bus]] that calls `intercept()` to suppress healing.

**Destiny Bond** — mutual faint binding:
```
{ effectId: 'destiny-bond', sourceEntityId: 'entity-456', state: { boundTo: ['entity-789'] }, expiresAt: { onEvent: 'user-turn-end' } }
```

## How the engine uses ActiveEffect

The effect engine queries `activeEffects` during resolution:

1. **Filtering** — "does target have an active Heal Block?" → `activeEffects.some(e => e.effectId === 'heal-block')`
2. **Reading state** — "what is Flash Fire's bonus?" → look up the active effect, read `state.bonusDamage`
3. **Expiration** — at turn boundaries and event triggers, the engine sweeps `activeEffects` and removes expired entries
4. **Stacking** — the effect definition declares whether multiple instances stack (additive), replace, or are rejected. The engine enforces this on add.

## Acknowledged tension: untyped state

`ActiveEffect.state` uses `Record<string, unknown>` — the most permissive type possible. An effect that reads `state.bonusDamage` gets `unknown` back; an effect that writes `state.typo = 5` compiles fine. This contradicts the design's compile-time safety emphasis elsewhere (e.g., `StateDelta` excluding entity fields at the type level).

This is a genuine design tension, not an oversight. Named fields don't scale (the reason `HasBuffTracking` was replaced), but the replacement sacrifices the type safety the design champions. Possible future mitigation: make `ActiveEffect` generic — `ActiveEffect<T extends Record<string, unknown>>` — so each effect definition constrains its own state shape. The collection would use a discriminated union keyed by `effectId`. Not worth solving in R0, but the tension should not be forgotten.

## Relationship to BlessingInstance

`BlessingInstance` originally contained `effectDescription: string` — a prose description of what the blessing does mechanically. Under the function model, blessing activation is handled by trigger handler functions passed to [[effect-utility-catalog|addBlessing()]] at creation time. The handler is registered with the [[effect-trigger-event-bus]] when the blessing is created. The `BlessingInstance` struct holds `blessingType: string` (keyed to the registered handler), not a reference to an effect definition. This eliminates the [[primitive-obsession-smell]] and [[single-source-of-truth]] violation of having mechanical behavior described in both a string field and the effect engine.

## See also

- [[game-state-interface]] — the parent design
- [[combat-lens-sub-interfaces]] — `HasActiveEffects` hosts this collection
- [[state-delta-model]] — active effect mutations are part of `StateDelta`
- [[status-condition-categories]] — the structured condition system that handles Burned, Paralyzed, etc.
- [[condition-source-tracking]] — source tracking on conditions; parallel concept on ActiveEffect
- [[data-driven-rule-engine]] — effect definitions are data; the engine evaluates them
- [[effect-utility-catalog]] — `applyActiveEffect` utility manages the ActiveEffect collection
- [[effect-trigger-event-bus]] — active effects can register trigger handlers for event-driven activation
- [[effect-handler-format]] — ActiveEffect references are part of move/trait handler implementations
