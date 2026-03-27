# Effect Trigger Event Bus

How traits and persistent effects activate in response to combat events. The engine is the publisher; trait handler functions are subscribers. When a combat event occurs (damage dealt, status applied, turn started), the engine checks all registered handlers for matches and invokes them. Part of the [[game-state-interface]].

## Handler registration

Each trait or persistent effect that reacts to events registers a handler:

```typescript
TriggerRegistration {
  eventType: CombatEventType
  timing: 'before' | 'after'
  scope: 'self' | 'ally' | 'enemy' | 'any'
  handler: TraitTriggerHandler    // (ctx: TriggerContext) => EffectResult
}
```

**eventType** — which [[combat-event-log-schema|CombatEvent]] type activates this handler. Examples: `damage-dealt`, `damage-received`, `status-applied`, `turn-start`, `turn-end`, `switch-in`, `switch-out`, `faint`, `move-used`, `healing-attempted`.

**timing** — `before` handlers can intercept, modify, or pass through the event (see [[before-handler-response-modes]]). `after` handlers react to the completed event (Rough Skin dealing recoil after contact damage). Before-handlers produce results that the engine applies BEFORE the triggering event's results. After-handlers are processed AFTER.

**scope** — whose events this handler listens to. Rough Skin listens to `damage-received` on `self`. Teamwork listens to `move-used` on `ally`.

**handler** — a [[effect-handler-contract|TraitTriggerHandler]] function. Receives a `TriggerContext` with the triggering event's data. Conditions are inline code in the handler body — `if (ctx.event.moveType === 'fire')` — not declarative predicate data structures.

## Dispatch order

When a combat event occurs, the engine:

1. **Collects** all registered handlers matching the event type and scope from all active combatants' traits, active effects, and field state instances.
2. **Invokes** before-handlers in priority order (speed-based tie-breaking, consistent with PTR initiative rules). Each handler's inline conditions determine whether it produces effects, modifications, interception, or `noEffect()`. Their own results (deltas, events) are applied before the triggering event's results.
3. **Collects** all `pendingModifications` from before-handler results (see [[before-handler-response-modes]]). If any handler returned `intercept()`, skip step 4 entirely. Otherwise, applies collected modifications to the original event's pending delta in defined order: accuracy adjustments, then damage scaling, then flat damage reduction.
4. **Applies** the (potentially modified) triggering event's results to state.
5. **Invokes** after-handlers in priority order. Their results are applied after the triggering event.
6. **Recursion check** — if any handler's result itself contains events that match other handlers, repeat from step 1 with updated state. Depth limit prevents infinite loops.

The handler functions themselves decide whether to act — the engine invokes all matching handlers, and handlers that don't apply return `noEffect()`. This replaces the engine-side predicate evaluation from the composition model with handler-side conditions.

## Before-handler response modes

Before-handlers have three response modes. The handler's [[effect-handler-contract|EffectResult]] communicates what should happen to the pending event via the `pendingModifications` field.

### Interception (block entirely)

The handler calls [[effect-utility-catalog|intercept()]] to set the interception flag. When the engine sees `{ intercepted: true }` in any before-handler's result, it skips applying the original event's deltas entirely. Interception overrides all modifications — if any before-handler intercepts, the event is blocked regardless of other before-handlers' modifications.

**Protect** — full interception. **Wide Guard** — interception for multi-target moves. **Volt Absorb** — intercept damage + gain energy.

### Modification (adjust the pending event)

The handler returns `pendingModifications` in its `EffectResult` — declarative instructions that transform the original event's delta before the engine applies it. For effects that reduce, scale, or augment an incoming event without blocking it.

```
PendingModification =
  | { type: 'scale-damage', factor: number }
  | { type: 'flat-damage-reduction', amount: number }
  | { type: 'accuracy-bonus', amount: number }
```

**`scale-damage`** — multiplies the pending `hpDelta` by `factor`. Light Screen and Reflect pass `0.5` to halve damage of their respective damage class.

**`flat-damage-reduction`** — subtracts `amount` from the pending `hpDelta` (floor 1 per [[non-immune-attacks-deal-damage]]).

**`accuracy-bonus`** — adds `amount` to the accuracy check before hit/miss determination. Teamwork passes `+2`.

The engine collects all `pendingModifications` from all before-handlers for a given event, then applies them in a defined order: accuracy adjustments first (they affect hit/miss), then damage scaling (multiplicative), then flat damage reduction (subtractive). Multiple modifications of the same type accumulate: two `scale-damage` factors multiply together; two `accuracy-bonus` amounts sum.

The `PendingModification` union starts narrow. New modification types are added when a PTR mechanic requires them per [[rule-of-three]] — not anticipated in advance.

### Pass-through (no effect)

The handler returns `noEffect()`. The event proceeds unchanged.

### Modification interaction with recursive triggers

Modifications are scoped to the event they modify. If applying a modified delta produces a new event (e.g., reduced damage still crosses an HP marker, generating an injury event), that new event goes through its own trigger cycle with fresh before-handlers. Modifications from the outer cycle do not carry over — each event's before-handlers operate only on that event's pending delta.

## Before-handler examples

**Flash Fire:**

```typescript
const flashFire: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'before',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    return merge(
      intercept(),
      applyActiveEffect(ctx, {
        op: 'add',
        effect: { effectId: 'flash-fire-boost', state: { bonusDamage: 5 }, expiresAt: { onEvent: 'user-turn-end' } },
        target: 'self',
      })
    )
  },
}
```

The handler checks the condition inline (`moveType !== 'fire'`), intercepts the damage, and applies the boost. All type-absorb traits (Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper) are before-handlers — an after-handler would fire after damage is already applied to HP, making absorption impossible.

**Flash Fire consumption** (addresses finding 62): The boost expires at `user-turn-end`. If "next Fire move only" semantics are needed, an after-handler on `move-used` checks if the user used a Fire move and removes the boost:

```typescript
const flashFireConsumption: TriggerRegistration = {
  eventType: 'move-used',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (ctx.event.moveType !== 'fire') return noEffect()
    if (!hasActiveEffect(ctx.user, 'flash-fire-boost')) return noEffect()
    return applyActiveEffect(ctx, { op: 'remove', effectId: 'flash-fire-boost' })
  },
}
```

## After-handler examples

**Rough Skin:**

```typescript
const roughSkin: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    if (!ctx.event.isContact) return noEffect()
    return dealTickDamage(ctx, { ticks: 1, target: ctx.event.sourceEntityId })
  },
}
```

**Seed Sower:**

```typescript
const seedSower: TriggerRegistration = {
  eventType: 'damage-received',
  timing: 'after',
  scope: 'self',
  handler: (ctx) => {
    return modifyFieldState(ctx, { field: 'terrain', op: 'set', type: 'grassy', rounds: 5 })
  },
}
```

## Recursive triggers

Triggers can produce events that fire other triggers. Rough Skin deals damage → the attacker's trait may trigger on `damage-received` → producing another event.

**Depth limit.** The engine tracks recursion depth. At depth 5 (configurable), further triggers are suppressed with a warning.

**State freshness.** Each recursion level evaluates against the current state — including deltas applied from the previous level.

## Centralized healing suppression

Heal Block is a before-handler on `healing-attempted`. The engine emits `healing-attempted` before any healing utility's result is applied. Heal Block subscribes with `intercept()`, preventing the heal before any result is applied.

This eliminates [[shotgun-surgery-smell]]: without centralization, every healing source would independently check for Heal Block. With the centralized handler, Heal Block is one registration. The same pattern applies to any future blanket suppression effect.

## Trigger sources

Handlers come from three places:

1. **Trait definitions** — static handlers registered when the entity enters combat. A Pokemon with Rough Skin always has the `damage-received/after` handler active.
2. **Active effects** — dynamic handlers from [[active-effect-model|ActiveEffect]] instances. Destiny Bond creates a handler on `faint` that fires mutual faint logic. Registered when the ActiveEffect is added; unregistered when it expires or is removed.
3. **Field state instances** — handlers from blessings, coats, hazards, and vortexes. Safeguard's blessing registers a `status-applied/before` handler. Registered when the field state is created; unregistered when it's removed. This addresses finding 59 — handlers are registered with the event bus, not embedded as data inside field state params.

The engine maintains a handler registry per encounter, updated when entities enter/exit combat, when active effects are added/removed, and when field state instances are created/destroyed.

## Engine as mediator

The engine is the sole [[mediator-pattern|mediator]] for all trigger communication:

- Effects never directly invoke other effects. A damage handler doesn't call Rough Skin — it produces a `damage-dealt` event, and the engine routes it to Rough Skin's handler.
- Handlers never inspect other handlers. Rough Skin doesn't check if Flash Fire already absorbed the damage — it reads the current state (where damage has or hasn't been applied) and acts accordingly.
- The engine owns the ordering, the recursion limit, and the state updates between handler invocations.

Adding a new trait with a new trigger requires only a new handler registration — no modification to existing moves, traits, or the engine.

## SE principles applied

- [[observer-pattern]] — handlers subscribe to event types; the engine dispatches events to matching subscribers
- [[mediator-pattern]] — the engine mediates all effect-to-effect communication via events
- [[strategy-pattern]] — each handler is a strategy for reacting to a specific event type
- [[single-responsibility-principle]] — each handler has one job: react to one event type. New handlers are single-responsibility additions.
- [[separation-of-concerns]] — handler registration (what listens), dispatch (what fires), and invocation (what happens) are distinct engine phases

## See also

- [[effect-handler-contract]] — trigger handlers return EffectResult; TraitTriggerHandler type defined here
- [[effect-utility-catalog]] — trigger handlers use the same utilities as move handlers
- [[combat-event-log-schema]] — the event types that handlers subscribe to
- [[active-effect-model]] — dynamic trigger source; active effects can carry handler registrations
- [[field-state-interfaces]] — field state instances (blessings, hazards) register handlers
- [[resolution-context-inputs]] — trigger handler invocation receives its own resolution context
- [[data-driven-rule-engine]] — triggers are the "event-driven rules" from the data-driven vision
- [[trigger-event-field-semantics]] — what each TriggerEvent field means per event type
