# Effect Node Contract

The shared interface that every effect — whether a single atom or a composed tree — must satisfy. This is the abstraction that the engine depends on per [[dependency-inversion-principle]]. All atoms are substitutable for all compositions per [[liskov-substitution-principle]]. New atom types extend the catalog without modifying the engine — each new atom is a [[strategy-pattern|strategy]] with [[single-responsibility-principle|single responsibility]], requiring only one addition to the catalog and one evaluation function. Part of the [[game-state-interface]].

## The interface

```
EffectNode {
  evaluate(context: EffectContext): EffectResult
}
```

Every atom implements this. Every composition implements this. The engine calls `evaluate` without knowing whether it received a single damage atom or a tree of 12 nodes with conditions and branches. This is [[composite-pattern]] — individual objects and compositions treated uniformly through a shared interface.

## EffectContext

What the node receives. Assembled by the engine before evaluation.

```
EffectContext {
  user: SubInterfaceSlice       // user's declared sub-interfaces (ISP-filtered)
  target: SubInterfaceSlice     // target's declared sub-interfaces
  allCombatants: SubInterfaceSlice[]  // for AoE, adjacency queries, Beat Up (entity-axis intentionally unfiltered)
  encounter: EncounterReadState // field state, combat log, round number, deployment
  resolution: ResolutionContext // rolls, decisions (from resolution-context-inputs)
  effectSource: EffectSource    // who/what caused this effect (move, trait, item)
}
```

**ISP filtering.** Each atom declares which [[combat-lens-sub-interfaces]] it reads via a static `requires` field. The engine assembles `SubInterfaceSlice` containing only the declared interfaces. An atom that declares `[HasStats, HasCombatStages, HasHealth]` receives those three; it cannot access `HasPosition` or `HasActions`. This is [[interface-segregation-principle]] enforced at the data level on the **interface axis** (which sub-interface fields are visible). The **entity axis** (which combatants are visible via `allCombatants`) is intentionally coarse — all combatants are available because multi-target effects (spread moves, Beat Up, field-wide effects) need them, and building entity-scoping machinery adds complexity disproportionate to the risk. In practice, single-target atoms access `user` and `target` via named fields and ignore `allCombatants`.

**EncounterReadState** is read-only. It provides field state (weather, terrain, hazards, blessings, coats, vortexes from [[field-state-interfaces]]), the combat event log (from [[combat-event-log-schema]]), round/turn tracking (from [[encounter-context-interfaces]]), and deployment state (from [[deployment-state-model]]). Effects do not write encounter state through the context — they produce an [[encounter-delta-model|EncounterDelta]] in the result.

**ResolutionContext** is injected per [[resolution-context-inputs]] — accuracy rolls, damage rolls, multi-hit count, player decisions, interrupt decisions. Effects never generate randomness internally. Given the same context, the same node produces the same result.

## EffectResult

What the node returns. Applied by the engine after evaluation.

```
EffectResult {
  combatantDeltas: Map<EntityId, StateDelta>
  encounterDelta: EncounterDelta | null
  events: CombatEvent[]
  triggers: TriggeredEffect[]
  success: boolean
  embeddedActions: EmbeddedActionSpec[]
}
```

**combatantDeltas** — per-combatant lens changes keyed by entity ID. Multiple targets are supported (AoE, Beat Up). Each delta follows the four application modes from [[state-delta-model]] (additive, additive-with-clamp, replacement, mutation). The engine applies them.

**encounterDelta** — encounter-level changes: field state mutations (set weather, place hazard, apply blessing), described by [[encounter-delta-model]]. Null if the effect doesn't touch encounter state.

**events** — structured [[combat-event-log-schema|CombatEvent]] entries to append to the log. Every damage application, status infliction, and move use generates an event. Effects that depend on history (Retaliate, Destiny Bond) read events from the context; effects that produce history append events to the result.

**triggers** — reactive effects to evaluate next. When a damage atom fires and the target has Rough Skin, the engine discovers this from the target's `activeEffects` and queues the Rough Skin effect for evaluation. The engine processes triggers after applying the current result, using the updated state as the new context. This is [[observer-pattern]] — traits subscribe to event types, the engine dispatches. See [[effect-trigger-system]].

**success** — flow-control signal for parent compositions. Default `true`. Resolution atoms (ResolveAccuracyCheck, ResolveSkillCheck) set this to `false` on miss/failure. [[effect-composition-model|Sequence]] reads this for `haltOnFailure`; [[effect-composition-model|Conditional]] reads this for accuracy-dependent branching. This is a direct signal — not derived from parsing the events array, which would violate [[tell-dont-ask]].

**embeddedActions** — declarative action insertions for the turn system. When an [[effect-composition-model|EmbeddedAction]] composition fires, it produces an `EmbeddedActionSpec` here. The engine reads this field and inserts the actions into the current turn's resolution sequence. The atom remains pure — it declares intent, the engine acts on it. Same pattern as `triggers`.

## The engine's role

The engine is a [[mediator-pattern|mediator]]. It:

1. Assembles the `EffectContext` from current game state + resolution inputs
2. Calls `evaluate` on the root `EffectNode`
3. Applies `combatantDeltas` via [[state-delta-model]] application rules
4. Applies `encounterDelta` via [[encounter-delta-model]] application rules
5. Appends `events` to the combat log
6. Inserts `embeddedActions` into the current turn's resolution sequence
7. Processes `triggers` by assembling new contexts and evaluating triggered effect nodes
8. Repeats steps 3–7 until no new triggers fire (with a recursion depth limit)

Effects never communicate directly with each other. A move fires, produces results, the engine applies them, which may trigger traits, which produce more results. All routing goes through the engine. This prevents the coupling that [[mediator-pattern]] exists to eliminate.

## Atom vs composition

Both implement `EffectNode`. The difference is internal:

- **Atoms** are leaf nodes. They read context, compute, and return a result. Each atom type is a [[strategy-pattern|strategy]] — a distinct algorithm for producing state changes. See [[effect-atom-catalog]].
- **Compositions** are branch nodes. They contain child `EffectNode`s and orchestrate their evaluation — sequencing, conditionally skipping, repeating, or intercepting. See [[effect-composition-model]].

A composition's `evaluate` calls its children's `evaluate`, merges their results, and returns a single `EffectResult`. The engine never knows the difference. This is [[composite-pattern]] applied to effect evaluation.

## The derived-vs-stored test

Per [[game-state-interface]] derived-vs-stored principle: the effect node contract deals only in stored state. Derived values (evasion, initiative, effective stats) are computed by the engine when assembling the context, not by the effect nodes. An atom that needs "effective Defense" receives it pre-computed in the context — it doesn't reach into `HasStats` and `HasCombatStages` to derive it. This enforces [[law-of-demeter]] — atoms talk to their immediate inputs, not through chains.

## SE principles applied

- [[dependency-inversion-principle]] — the engine depends on `EffectNode`, not on concrete atoms or moves
- [[liskov-substitution-principle]] — any `EffectNode` (atom or composition) can substitute for any other
- [[single-responsibility-principle]] — each atom has one job; the engine has one job (orchestrate evaluation). Each new atom type is a single-responsibility addition to the catalog.
- [[interface-segregation-principle]] — atoms declare narrow input requirements via `requires` (interface-axis filtering). Entity-axis filtering is intentionally coarse — see EffectContext.
- [[composite-pattern]] — atoms and compositions share the `evaluate` interface
- [[strategy-pattern]] — each atom type is a strategy for producing state changes
- [[mediator-pattern]] — the engine mediates all effect-to-effect communication
- [[observer-pattern]] — triggers are event subscriptions dispatched by the engine
- [[command-pattern]] — `EffectResult` is a command describing state changes; the engine executes it
- [[tell-dont-ask]] — atoms don't query state and compute externally; they receive pre-assembled context and return results
- [[law-of-demeter]] — atoms access only their direct inputs (context fields), not chains through nested objects

## See also

- [[game-state-interface]] — the parent design; defines what state exists
- [[state-delta-model]] — per-combatant deltas produced by effect nodes
- [[encounter-delta-model]] — encounter-level deltas produced by effect nodes
- [[combat-lens-sub-interfaces]] — the sub-interfaces that atoms declare as requirements
- [[resolution-context-inputs]] — external inputs injected into the context
- [[combat-event-log-schema]] — events produced by and consumed by effect nodes
- [[effect-atom-catalog]] — the 18 atom types implementing this contract
- [[effect-composition-model]] — how atoms compose into trees
- [[effect-trigger-system]] — how triggered effects are discovered and dispatched
- [[data-driven-rule-engine]] — the conceptual ancestor; this contract formalizes its vision
- [[active-effect-model]] — persistent effects whose definitions reference this contract
