# Effect Composition Model

How [[effect-atom-catalog|atoms]] combine into trees. Every composition implements [[effect-node-contract|EffectNode]] — the engine treats a composed tree identically to a single atom per [[composite-pattern]]. Compositions are the source of per-move/trait novelty: the atoms are finite (18), but their arrangements are unbounded. Part of the [[game-state-interface]].

## Composition categories

Three categories from the consolidated ring plan, each with distinct character.

### Flow compositions

Control the order of atom evaluation. Pure — they don't modify how atoms resolve, only whether and when they fire.

#### Sequence

Evaluates children in order. Each child's result is merged into the cumulative result. If any child fails (e.g., accuracy miss), the sequence can be configured to halt or continue.

```
Sequence {
  children: EffectNode[]
  haltOnFailure: boolean
}
```

**Example:** Thunderbolt = `Sequence([ResolveAccuracyCheck, DealDamage, Conditional(roll ≥ 19, ApplyStatus(Paralysis))])`. Accuracy check first; if hit, deal damage; then conditionally apply paralysis.

#### Conditional

Evaluates a predicate against the context. If true, evaluates the `then` branch. If false, evaluates the optional `else` branch. The predicate is a declarative state query — data, not code — resolving the [[tell-dont-ask]] tension (see "Condition predicates" below).

```
Conditional {
  predicate: ConditionPredicate
  then: EffectNode
  else: EffectNode | null
}
```

**Example:** Hex = `Conditional(targetHasAnyStatus, DealDamage{db:13}, DealDamage{db:7})`. If the target has any status condition, use DB 13; otherwise DB 7.

#### Repeat

Evaluates a child multiple times. Count comes from resolution context (multi-hit) or is fixed.

```
Repeat {
  child: EffectNode
  count: number | 'from-resolution'
}
```

**Example:** Bullet Seed = `Repeat(Sequence([ResolveAccuracyCheck, DealDamage]), 'from-resolution')`. Multi-hit count (2–5) determined before resolution, each hit resolved independently.

### Intervention compositions

Modify how other effects resolve. These change the internals of how a child node resolves — swapping inputs, filtering targets, or altering the evaluation pipeline.

#### Replacement

Substitutes one value for another during evaluation. The child atom evaluates normally, but one of its inputs or outputs is replaced. This is [[strategy-pattern]] — the replacement swaps the algorithm for selecting a value (e.g., which defensive stat to read), not wrapping the child's interface.

```
Replacement {
  child: EffectNode
  replace: ReplacementSpec
  priority: number
}
```

**Example:** Psyshock = `Replacement(DealDamage{class:special}, { defenderStat: 'def' instead of 'spdef' })`. The move is Special (uses SpAtk) but targets physical Defense. The replacement intercepts the damage pipeline's step 7.

**Stacking rules.** When multiple Replacements target the same child and the same value, `priority` determines which wins (higher priority wins). If two Replacements target different values on the same child (one swapping the defense stat, another swapping the damage type), both apply independently. Stacking is explicit — unlike [[decorator-pattern|Decorator]], where wrappers are order-independent, Replacement stacking requires defined precedence.

#### CrossEntityFilter

Applies an atom across multiple entities matching a filter. The engine iterates combatants, applies the filter predicate, and evaluates the child for each match.

```
CrossEntityFilter {
  child: EffectNode
  filter: ConditionPredicate
  scope: 'allies' | 'enemies' | 'all' | 'adjacent'
}
```

**Example:** Earthquake = `CrossEntityFilter(DealDamage, { scope: 'all-in-range', aoe: 'burst-3' })`. AoE — the damage atom fires once per target in the burst area.

### Interaction compositions

Require expanded inputs — player decisions or action economy mutations.

#### ChoicePoint

Pauses evaluation to collect a player decision. The engine suspends, presents the choice to the UI, receives the answer via [[resolution-context-inputs|playerDecisions]], and resumes with the chosen branch.

```
ChoicePoint {
  choiceId: string
  options: Map<string, EffectNode>
  default: EffectNode | null
}
```

**Example:** Safeguard activation = `ChoicePoint('activate-safeguard', { 'yes': RemoveStatus(incoming), 'no': PassThrough })`. The player decides whether to spend a Safeguard activation when a status is about to be applied.

#### EmbeddedAction

Grants a secondary action within the current resolution. The engine inserts the embedded action into the current turn's resolution sequence.

```
EmbeddedAction {
  child: EffectNode
  actionType: 'swift' | 'movement' | 'free'
  cost: ActionCost | null
}
```

**Example:** Sand Tomb = `Sequence([DealDamage, EmbeddedAction(ModifyFieldState(vortex), 'swift')])`. Damage plus a swift-action Vortex application embedded in the Standard Action move.

## Condition predicates

Conditions are declarative state queries — data structures, not procedural code. The engine evaluates them against the context. This resolves the [[tell-dont-ask]] tension: the composition says "check if X" as data, the engine does the checking.

```
ConditionPredicate =
  // State-query predicates (query combat state)
  | { check: 'target-has-status', condition: StatusType }
  | { check: 'target-has-any-status' }
  | { check: 'weather-is', type: WeatherType }
  | { check: 'terrain-is', type: TerrainType }
  | { check: 'target-type-is', type: PokemonType }
  | { check: 'user-type-matches-move' }              // STAB check
  | { check: 'roll-at-least', threshold: number }     // accuracy roll ≥ N
  | { check: 'target-hp-below', percentage: number }
  | { check: 'ally-fainted-by-target', withinRounds: number }  // Retaliate
  | { check: 'user-has-active-effect', effectId: string }
  | { check: 'user-moved-distance', min: number, direction: 'line' }  // Supersonic Wind Blade
  | { check: 'target-is-adjacent' }
  | { check: 'user-item-slot-empty' }                 // Thief precondition
  | { check: 'user-resource-at-least', resource: ResourceType, min: number }  // Mettle spend check
  | { check: 'hazard-layer-count', hazard: HazardType, min: number }          // Toxic Spikes layer branching
  // Event-query predicates (query properties of the triggering event — used by triggers)
  | { check: 'incoming-move-is-contact' }
  | { check: 'incoming-move-type-is', type: PokemonType }
  | { check: 'incoming-move-damage-class-is', damageClass: 'physical' | 'special' | 'status' }
  | { check: 'incoming-move-range-is', range: 'melee' | 'ranged' }
  | { check: 'event-source-is', scope: 'ally' | 'enemy' | 'self' }
  | { check: 'incoming-status-is', condition: StatusType }                    // Limber immunity check
  // Boolean composition
  | { check: 'not', inner: ConditionPredicate }
  | { check: 'and', predicates: ConditionPredicate[] }
  | { check: 'or', predicates: ConditionPredicate[] }
```

This is a discriminated union — each check type is a [[strategy-pattern|strategy]] with its own evaluation logic in the engine. Boolean composition (`not`, `and`, `or`) enables arbitrary logical combinations without procedural code.

Predicates fall into two categories: **state-query** predicates (query combat state — weather, HP, status, position) and **event-query** predicates (query properties of the triggering event — move type, contact flag, damage class, range, source entity). Event-query predicates are used by [[effect-trigger-system|trigger]] conditions; state-query predicates are used everywhere.

The predicate set is not finite by design — it grows as new moves and traits introduce novel conditions. Each new predicate type is a [[single-responsibility-principle|single-responsibility]] addition: one variant in the union and one evaluation function in the engine. The full set of event-query predicates will be enumerated during the 45 sample definitions task.

## Result merging

When a composition evaluates multiple children, their `EffectResult`s must merge:

- **combatantDeltas** — merge by entity ID. If two children both produce deltas for the same entity, the deltas are combined (additive fields sum, replacement fields last-writer-wins, mutation fields concatenate).
- **encounterDelta** — mutations concatenate and are applied in order.
- **events** — concatenate in evaluation order.
- **triggers** — concatenate; the engine deduplicates by trigger ID.
- **success** — last-writer-wins. In a Sequence, the final child's `success` determines the merged result's `success`. This means an accuracy miss early in the sequence (with `haltOnFailure: true`) propagates because the sequence halts and returns the failing child's result.
- **embeddedActions** — concatenate in evaluation order.

This is [[composite-pattern]] result aggregation — the parent collects children's results into a single result that satisfies the same `EffectResult` type.

## SE principles applied

- [[composite-pattern]] — atoms and compositions share the [[effect-node-contract|EffectNode]] interface; compositions contain children
- [[strategy-pattern]] — each predicate type is a strategy for evaluation; Replacement swaps the strategy for value selection within a child node
- [[single-responsibility-principle]] — each composition type has one job (sequence, branch, repeat, replace, filter, choose, embed). Each predicate type has one job.
- [[tell-dont-ask]] — condition predicates are data, not procedural queries; the engine evaluates them
- [[separation-of-concerns]] — flow (when atoms fire), intervention (how atoms resolve), and interaction (what inputs are needed) are distinct concerns with distinct composition types

## See also

- [[effect-node-contract]] — the shared interface compositions implement
- [[effect-atom-catalog]] — the leaf nodes compositions orchestrate
- [[effect-trigger-system]] — triggers are another source of composition activation
- [[resolution-context-inputs]] — ChoicePoint collects decisions; Repeat reads multi-hit count
- [[effect-definition-format]] — how compositions are expressed as TypeScript constants
- [[data-driven-rule-engine]] — condition predicates are the "rule conditions" from the data-driven vision
