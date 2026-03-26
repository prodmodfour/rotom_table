# Effect Trigger System

How traits and persistent effects activate in response to combat events. The engine is the [[observer-pattern|publisher]]; trait definitions are [[observer-pattern|subscribers]]. When a combat event occurs (damage dealt, status applied, turn started), the engine checks all active effects for matching triggers and evaluates their effect trees. Part of the [[game-state-interface]].

## Trigger registration

Each trait or persistent effect that reacts to events declares a trigger:

```
TriggerDefinition {
  eventType: CombatEventType
  timing: 'before' | 'after'
  condition: ConditionPredicate | null
  effect: EffectNode
  scope: 'self' | 'ally' | 'enemy' | 'any'
}
```

**eventType** — which [[combat-event-log-schema|CombatEvent]] type activates this trigger. Examples: `damage-dealt`, `damage-received`, `status-applied`, `turn-start`, `turn-end`, `switch-in`, `switch-out`, `faint`, `move-used`, `healing-attempted`.

**timing** — `before` triggers can intercept or modify the event (Wide Guard preventing damage). `after` triggers react to the completed event (Rough Skin dealing recoil after contact damage). Before-triggers produce results that the engine applies BEFORE the triggering event's results. After-triggers are processed AFTER.

**condition** — optional [[effect-composition-model|ConditionPredicate]] that must be true for the trigger to fire. Ice Body requires `{ check: 'weather-is', type: 'hail' }`. Rough Skin requires the incoming move to be a contact move. Conditions are declarative data, not procedural checks per [[tell-dont-ask]].

**effect** — the [[effect-node-contract|EffectNode]] tree to evaluate when the trigger fires. Can be a single atom or a full composition.

**scope** — whose events this trigger listens to. Rough Skin listens to `damage-received` on `self`. Teamwork listens to `move-used` on `ally` (adjacency required). This is the subscription filter.

## Dispatch order

When a combat event occurs, the engine:

1. **Collects** all triggers matching the event type and scope from all active combatants' traits and active effects.
2. **Filters** by condition predicate — only triggers whose condition evaluates to true proceed.
3. **Partitions** into `before` and `after` groups.
4. **Evaluates before-triggers** in priority order (speed-based tie-breaking, consistent with PTR initiative rules). Their results are applied before the triggering event's results.
5. **Applies** the triggering event's results (the original effect's deltas).
6. **Evaluates after-triggers** in priority order. Their results are applied after the triggering event.
7. **Recursion check** — if any trigger's result itself contains events that match other triggers, repeat from step 1 with updated state. Depth limit prevents infinite loops.

This is [[chain-of-responsibility-pattern]] applied to event processing — each trigger is a handler in the chain, deciding whether to process the event.

## Before-trigger interception

Before-triggers can modify or prevent the triggering event. The trigger intercepts the event before its deltas are applied, potentially replacing or canceling them.

**Wide Guard** — before-trigger on `damage-received` when the incoming move targets multiple entities. The trigger's effect replaces the damage delta with zero damage: `{ hpDelta: 0 }`.

**Protect** — before-trigger on `damage-received` or `status-applied`. Full interception — the original event's result is discarded.

The engine achieves this by collecting before-trigger results first. If a before-trigger produces an interception flag via the [[effect-atom-catalog|InterceptEvent]] atom (`{ intercepted: true }` in its result), the engine skips applying the original event's deltas.

## Before-trigger examples

**Flash Fire** — before-trigger on `damage-received` where the incoming move is Fire-type (`{ check: 'incoming-move-type-is', type: 'fire' }`). Effect: `Sequence([InterceptEvent(), ApplyActiveEffect(flash-fire-boost)])`. The [[effect-atom-catalog|InterceptEvent]] atom prevents the damage deltas from applying, and the Flash Fire boost is applied. This must be a before-trigger — an after-trigger would fire after damage is already applied to HP, making "absorption" impossible. All type-absorb traits (Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper) are before-triggers for this reason.

## After-trigger examples

**Rough Skin** — after-trigger on `damage-received` where the incoming move was contact (`{ check: 'incoming-move-is-contact' }`). Effect: `DealDamage(1 tick)` to the attacker. The attacker's entity ID comes from the triggering event's `sourceId`.

**Seed Sower** — after-trigger on `damage-received`. Effect: `ModifyFieldState({ field: 'terrain', op: 'set', type: 'grassy', rounds: 5 })`. Getting hit sets Grassy Terrain.

## Recursive triggers

Triggers can produce events that fire other triggers. Rough Skin deals damage → the attacker's trait may trigger on `damage-received` → producing another event. The engine must handle this recursion.

**Depth limit.** The engine tracks recursion depth. At depth 5 (configurable), further triggers are suppressed with a warning. This prevents infinite loops (e.g., two entities with mutual recoil traits).

**State freshness.** Each recursion level evaluates against the current state — including deltas applied from the previous level. A trigger that checks `target-hp-below(50%)` evaluates against HP after prior triggers have applied.

## Centralized healing suppression

Heal Block is implemented as a before-trigger on the `healing-attempted` event type — not as per-atom checks. The engine emits `healing-attempted` before any healing atom (HealHP, ManageResource with `resource: 'tempHp'`, coat tick healing) runs. Heal Block subscribes as a before-trigger with [[effect-atom-catalog|InterceptEvent]], preventing the heal before any atom executes.

This eliminates [[shotgun-surgery-smell]]: without centralization, every healing source (HealHP, ManageResource, coat ticks, any future healing atom) would independently check for Heal Block. Adding a new healing path would require remembering to add the check. With the centralized trigger, Heal Block is one definition — zero per-atom scatter.

The same pattern applies to any future blanket suppression effect (e.g., an effect that blocks all stat stage changes).

## Trigger sources

Triggers come from two places:

1. **Trait definitions** — static triggers that activate when the trait is known. A Pokemon with Rough Skin always has the `damage-received/after/contact` trigger active. These are registered when the entity enters combat.
2. **Active effects** — dynamic triggers from [[active-effect-model|ActiveEffect]] instances. Destiny Bond creates a trigger on `faint` that fires mutual faint logic. These are registered when the ActiveEffect is added and unregistered when it expires or is removed.

The engine maintains a trigger registry per encounter, updated when entities enter/exit combat and when active effects are added/removed.

## Engine as mediator

The engine is the sole [[mediator-pattern|mediator]] for all trigger communication:

- Effects never directly invoke other effects. A damage atom doesn't call Rough Skin — it produces a `damage-dealt` event, and the engine routes it to Rough Skin's trigger.
- Triggers never inspect other triggers. Rough Skin doesn't check if Flash Fire already absorbed the damage — it reads the current state (where damage has or hasn't been applied) and acts accordingly.
- The engine owns the ordering, the recursion limit, and the state updates between trigger evaluations.

This eliminates the coupling between effect definitions. Adding a new trait with a new trigger requires only a new trigger definition — no modification to existing moves, traits, or the engine.

## SE principles applied

- [[observer-pattern]] — triggers subscribe to event types; the engine dispatches events to matching subscribers
- [[mediator-pattern]] — the engine mediates all effect-to-effect communication via events
- [[chain-of-responsibility-pattern]] — trigger dispatch is a chain of handlers processing events
- [[strategy-pattern]] — each trigger's condition predicate and effect tree are strategies for handling specific events
- [[single-responsibility-principle]] — each trigger has one job: react to one event type with one effect. New triggers are single-responsibility additions.
- [[tell-dont-ask]] — triggers declare conditions as data; the engine evaluates them
- [[separation-of-concerns]] — trigger registration (what listens), dispatch (what fires), and evaluation (what happens) are distinct engine phases

## See also

- [[effect-node-contract]] — triggers evaluate EffectNode trees
- [[effect-atom-catalog]] — trigger effects use the same atoms as move effects
- [[effect-composition-model]] — trigger effects use the same compositions, including Conditional
- [[combat-event-log-schema]] — the event types that triggers subscribe to
- [[active-effect-model]] — dynamic trigger source; active effects can carry trigger definitions
- [[resolution-context-inputs]] — trigger evaluation receives its own resolution context (separate rolls)
- [[data-driven-rule-engine]] — triggers are the "event-driven rules" from the data-driven vision
