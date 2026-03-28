# Effect Handler Contract

The shared interface for all move and trait effect implementations. Moves and traits are typed functions — `(ctx: EffectContext) => EffectResult` — not data structures evaluated by a generic engine. The engine calls handler functions, applies their results, and dispatches triggers. Part of the [[game-state-interface]].

## Handler types

```
MoveHandler = (ctx: EffectContext) => EffectResult
TraitTriggerHandler = (ctx: TriggerContext) => EffectResult
```

**MoveHandler** — a function that implements one move's combat effect. Receives the combat context (user, target, encounter state, resolution inputs), returns deltas and events. The function body uses [[effect-utility-catalog|utility functions]] (`dealDamage`, `applyStatus`, `rollAccuracy`, etc.) and standard TypeScript control flow (`if`, `for`, `map`, ternary).

**TraitTriggerHandler** — a function that implements one trait's reaction to a combat event. Receives a `TriggerContext` (extends `EffectContext` with the triggering event's data). Returns the same `EffectResult`. Registered with the [[effect-trigger-event-bus]] for specific event types.

Both return the same `EffectResult` type. The engine treats them identically after invocation — apply deltas, append events, dispatch triggers. Per [[liskov-substitution-principle]], any handler can be invoked through the same engine pathway.

## EffectContext

What the handler receives. Assembled by the engine before invocation.

```
EffectContext {
  user: CombatantLens          // user's full combat lens
  target: CombatantLens        // target's full combat lens
  allCombatants: CombatantLens[]  // for AoE, adjacency queries, Beat Up
  encounter: EncounterReadState   // field state, combat log, round number, deployment
  resolution: ResolutionContext   // rolls, decisions (from resolution-context-inputs)
  effectSource: EffectSource      // who/what caused this effect (move, trait, item)
}
```

**CombatantLens** exposes the full set of [[combat-lens-sub-interfaces]] — `HasStats`, `HasHealth`, `HasCombatStages`, `HasTypes`, etc. Handlers read what they need; TypeScript typing on the utility functions enforces correct access. There is no ISP filtering at the context level — utility function signatures provide the narrowing. A handler that calls `dealDamage(ctx, ...)` is constrained by `dealDamage`'s parameter types, not by a pre-filtered context slice.

**EncounterReadState** is read-only. It provides field state (weather, terrain, hazards, blessings, coats, vortexes from [[field-state-interfaces]]), the combat event log (from [[combat-event-log-schema]]), round/turn tracking, and deployment state (from [[deployment-state-model]]). Handlers do not write encounter state through the context — they produce an [[encounter-delta-model|EncounterDelta]] in the result.

**ResolutionContext** is injected per [[resolution-context-inputs]] — accuracy rolls, damage rolls, multi-hit count, player decisions. Handlers never generate randomness internally. Given the same context, the same handler produces the same result.

## TriggerContext

Extends `EffectContext` with event-specific data:

```
TriggerContext extends EffectContext {
  event: TriggerEvent         // the triggering event with full move metadata
  eventSource: CombatantLens  // who caused the triggering event
}
```

`TriggerEvent` is a superset of [[combat-event-log-schema|CombatEvent]]. The combat log stores the lean `CombatEvent` for historical queries. The trigger context provides `TriggerEvent` with transient metadata that handlers need during resolution but that doesn't persist in the log.

```
TriggerEvent extends CombatEvent {
  moveType?: PokemonType        // Fire, Water, etc. — read by Flash Fire, Volt Absorb, Water Absorb
  isContact?: boolean           // contact flag — read by Rough Skin
  damageClass?: 'physical' | 'special'  // read by Light Screen, Reflect
  moveRange?: 'melee' | 'ranged'       // read by Teamwork, Pack Hunt
  sourceEntityId: string        // alias for sourceId — consistent naming for handler use
}
```

Trait trigger handlers read `event` to inspect the triggering event's properties using inline conditions rather than declarative predicates. Example: `if (ctx.event.moveType === 'fire')` replaces `{ check: 'incoming-move-type-is', type: 'fire' }`.

## EffectResult

What the handler returns. Applied by the engine after invocation.

```
EffectResult {
  combatantDeltas: Map<EntityId, StateDelta>
  encounterDelta: EncounterDelta | null
  entityWriteDeltas: Map<EntityId, EntityWriteDelta>
  events: CombatEvent[]
  triggers: TriggeredEffect[]
  success: boolean
  intercepted: boolean
  embeddedActions: EmbeddedActionSpec[]
  pendingModifications: PendingModification[]
}
```

**combatantDeltas** — per-combatant lens changes keyed by entity ID. Multiple targets supported (AoE, Beat Up). Each delta follows the four application modes from [[state-delta-model]] (additive, additive-with-clamp, replacement, mutation). The engine applies them.

**encounterDelta** — encounter-level changes: field state mutations (set weather, place hazard, apply blessing), described by [[encounter-delta-model]]. Null if the handler doesn't touch encounter state.

**entityWriteDeltas** — per-entity permanent state changes keyed by entity ID, for [[entity-write-exception|tagged entity-write effects]] (e.g. Thief stealing a held item). Uses the narrow `EntityWriteDelta` type from [[state-delta-model]]. Empty map when no entity writes occur.

**events** — structured [[combat-event-log-schema|CombatEvent]] entries to append to the log. Every damage application, status infliction, and move use generates an event.

**triggers** — reactive effects to evaluate next. The engine processes triggers after applying the current result, using the updated state as the new context. See [[effect-trigger-event-bus]].

**success** — flow-control signal. Default `true`. Utility functions like `rollAccuracy` return results with `success: false` on miss. Handlers use this for conditional logic: `if (!acc.hit) return acc.result`.

**intercepted** — signals that a before-handler blocked the pending event entirely. Used by the `intercept()` utility. When `true`, the engine skips applying the blocked event's deltas. See [[before-handler-response-modes]].

**embeddedActions** — declarative action insertions for the turn system. The engine reads this field and inserts the actions into the current turn's resolution sequence.

**pendingModifications** — only meaningful for before-handler results. Declarative instructions that transform the pending event's delta before the engine applies it. See [[before-handler-response-modes]] for the three response modes (interception, modification, pass-through) and the `PendingModification` discriminated union.

## The engine's role

The engine is a [[mediator-pattern|mediator]]. It:

1. Assembles the `EffectContext` from current game state + resolution inputs
2. Calls the handler function
3. Applies `combatantDeltas` via [[state-delta-model]] application rules
4. Applies `encounterDelta` via [[encounter-delta-model]] application rules
5. Appends `events` to the combat log
6. Inserts `embeddedActions` into the current turn's resolution sequence
7. Dispatches to the [[effect-trigger-event-bus]] — matching triggers fire, producing new results
8. Repeats steps 3–7 until no new triggers fire (with a recursion depth limit)

The engine is simpler than in the composition framework model — it calls one function and processes the result. No tree assembly, no node traversal, no composition mediation. Effects never communicate directly with each other. All routing goes through the engine. This prevents the coupling that [[mediator-pattern]] exists to eliminate.

## The derived-vs-stored test

Per [[game-state-interface]] derived-vs-stored principle: handlers deal only in stored state. Derived values (evasion, initiative, effective stats) are computed by utility functions that read the lens, not by handlers reaching into raw fields and deriving manually. The `effectiveStat(lens, 'atk')` utility computes base stat × CS multiplier; handlers call it rather than reimplementing the derivation. This enforces [[law-of-demeter]] — handlers talk to utilities, not through chains of raw field access.

## Result merging

The `merge(...results)` utility combines multiple `EffectResult` values:

- **combatantDeltas** — merge by entity ID. Same-entity deltas combine (additive fields sum, replacement fields last-writer-wins, mutation fields concatenate).
- **encounterDelta** — mutations concatenate and are applied in order.
- **events** — concatenate in evaluation order.
- **triggers** — concatenate; the engine deduplicates by trigger ID.
- **success** — last-writer-wins.
- **embeddedActions** — concatenate in evaluation order.
- **pendingModifications** — concatenate; the engine applies in defined order (accuracy, then damage scaling, then flat reduction).

## SE principles applied

- [[dependency-inversion-principle]] — the engine depends on handler function types, not on concrete moves or traits
- [[liskov-substitution-principle]] — any handler returning `EffectResult` can substitute for any other
- [[single-responsibility-principle]] — each handler has one job; the engine has one job (orchestrate invocation and result application)
- [[strategy-pattern]] — each handler is a strategy for producing state changes from a given context
- [[mediator-pattern]] — the engine mediates all effect-to-effect communication
- [[observer-pattern]] — triggers are event subscriptions dispatched by the engine
- [[command-pattern]] — `EffectResult` is a command describing state changes; the engine executes it
- [[tell-dont-ask]] — handlers receive pre-assembled context and return results
- [[law-of-demeter]] — handlers access utilities, not chains through nested objects

## See also

- [[game-state-interface]] — the parent design; defines what state exists
- [[state-delta-model]] — per-combatant deltas produced by handlers
- [[encounter-delta-model]] — encounter-level deltas produced by handlers
- [[combat-lens-sub-interfaces]] — the sub-interfaces that the combat lens exposes
- [[resolution-context-inputs]] — external inputs injected into the context
- [[combat-event-log-schema]] — events produced by and consumed by handlers
- [[effect-utility-catalog]] — the utility functions handlers call
- [[effect-trigger-event-bus]] — how trait trigger handlers are discovered and dispatched
- [[before-handler-response-modes]] — the three response modes for before-handler results
- [[effect-handler-format]] — how handlers are structured as TypeScript functions
- [[active-effect-model]] — persistent effects whose handlers reference this contract
- [[trigger-event-field-semantics]] — what each TriggerEvent field means per event type
- [[status-application-must-use-applyStatus]] — convention: handlers must use `applyStatus`, not raw mutations
