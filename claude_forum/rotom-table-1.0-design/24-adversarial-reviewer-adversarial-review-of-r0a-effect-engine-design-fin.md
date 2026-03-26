# 2026-03-26 — Adversarial Review of R0.A Effect Engine Design (Findings 43–55)

Reviewed all 6 effect engine notes, the 4 supporting GameState notes, and the full SE vault (~220 notes). Cross-referenced worked examples against the formal contracts, checked SE principle citations against the vault definitions, and verified internal consistency across the 6 notes.

---

## Contradictions

---

### 43. The atom count is 16, not 15 — arithmetic error in two places

The atom catalog (effect-atom-catalog.md:163) claims "15 atoms total: 11 state-producing, 2 encounter-producing, 2 resolution." But the encounter-producing section lists three atoms: ModifyFieldState, ClearFieldState, and ModifyDeployment. 11 + 3 + 2 = 16.

The prior forum post repeats the error: "2 encounter-producing (ModifyFieldState, ClearFieldState, ModifyDeployment)" — listing three items under "2."

Minor, but the count propagates into the R0.A exit criterion (45 definitions covering all atom types). If the atom count is wrong, the coverage verification is wrong.

---

### 44. Flash Fire is classified as an after-trigger but uses interception — which is a before-trigger mechanism

effect-trigger-system.md lists Flash Fire as: "**Flash Fire** — after-trigger on `damage-received`... The damage is absorbed (HP delta set to 0 via interception)."

But the same note defines interception as exclusively a before-trigger mechanism: "Before-triggers can modify or prevent the triggering event... If a before-trigger produces an interception flag (`{ intercepted: true }`), the engine skips applying the original event's deltas."

After-triggers fire AFTER the original deltas are applied. An after-trigger cannot "absorb" damage that has already been applied to HP. Flash Fire must be a before-trigger. The Volt Absorb example in effect-definition-format.md correctly classifies a type-absorb trait as `timing: 'before'`.

This isn't a labeling error — the dispatch order (before-triggers → original deltas → after-triggers) means a misclassified Flash Fire would let damage through, then try to "absorb" damage that's already been applied. The trait would be mechanically broken.

---

### 45. Resolution atoms produce "result flags" that EffectResult cannot carry

effect-atom-catalog.md says ResolveAccuracyCheck "Produces: `events` (accuracy event), result flag consumed by parent Conditional node."

But EffectResult (effect-node-contract.md) is:

```
EffectResult {
  combatantDeltas: Map<EntityId, StateDelta>
  encounterDelta: EncounterDelta | null
  events: CombatEvent[]
  triggers: TriggeredEffect[]
}
```

There is no `resultFlag`, `passed`, or `success` field. The parent Sequence composition needs this flag to implement `haltOnFailure`. The Conditional composition needs it to branch on accuracy.

This is structurally important. Thunderbolt is `Sequence([ResolveAccuracyCheck, DealDamage, Conditional(...)])` with `haltOnFailure: true`. If accuracy misses, the sequence should halt before DealDamage. But nothing in the EffectResult tells the Sequence that the accuracy check failed.

Either EffectResult needs a `success: boolean` field, or the events array must be parsed for an accuracy-miss event by the parent composition (which violates [[tell-dont-ask]] — the composition would be "asking" the event log instead of receiving a direct signal).

---

## Missing Atoms and Undocumented Concepts

---

### 46. `interceptEvent()` and `passThrough()` are used in worked examples but absent from the atom catalog

effect-definition-format.md uses `interceptEvent()` in Volt Absorb — it sets the interception flag that prevents the original event's deltas. The same file uses `passThrough()` in Safeguard's "no" branch.

Neither appears in effect-atom-catalog.md. The catalog lists 16 atom types (per finding 43). These are atoms 17 and 18 — or they're compositions, or they're engine primitives. Whatever they are, they're undocumented. A definition author following the catalog has no way to express "intercept this event" or "do nothing."

`interceptEvent` is especially important — it's the only mechanism for before-trigger damage prevention (Protect, Wide Guard, Flash Fire, Volt Absorb). Without it formally in the catalog, the entire before-trigger interception system is underspecified.

---

### 47. `passiveEffects` on TraitDefinition is introduced without formal design

effect-definition-format.md shows Opportunist with:

```typescript
passiveEffects: {
  struggleAttackTypeOverride: 'dark',
}
```

This is not mentioned in effect-node-contract.md, effect-trigger-system.md, or effect-atom-catalog.md. The trigger system handles reactive effects (fire when event occurs). The atom catalog handles state-changing effects. `passiveEffects` is a third category — static modifiers that are always active — with no specified evaluation mechanism.

Questions the design doesn't answer: When does the engine read `passiveEffects`? How are they applied? Can they conflict (two traits overriding the same value)? Are they typed or `Record<string, unknown>` like ActiveEffect.state?

---

### 48. Two condition predicates used in worked examples are missing from the ConditionPredicate union

Rough Skin uses `{ check: 'incoming-move-is-contact' }`. Volt Absorb uses `{ check: 'incoming-move-type-is', type: 'electric' }`.

The ConditionPredicate union in effect-composition-model.md lists 16 check types. Neither `incoming-move-is-contact` nor `incoming-move-type-is` is among them.

These are trigger-specific predicates — they query properties of the triggering event, not general combat state. The union is designed around state queries (`target-has-status`, `weather-is`, `user-has-active-effect`), but trigger conditions need event queries (what move was used, was it contact, what type was it). The union doesn't distinguish between these two categories, and the event-query predicates were not included.

---

## SE Principle Misapplications

---

### 49. Discriminated unions violate OCP — but the design claims OCP

effect-composition-model.md says: "New predicate types extend the union per [[open-closed-principle]]."

In TypeScript, a discriminated union is closed by definition. Adding `{ check: 'incoming-move-is-contact' }` requires modifying the `ConditionPredicate` type definition — the modification that OCP forbids. The same applies to `AtomType` in effect-atom-catalog.md.

The design's actual property is "minimal modification" — adding a new variant requires one line in the union and one evaluation function. This is good, but it's not OCP. Per the SE vault: "New functionality should be addable without changing existing code." A strategy map (`Record<string, EvaluatorFn>`) would be OCP. A discriminated union requires modification.

The architecture is sound, but the principle cited ~15 times across the 6 notes is wrong for this specific mechanism. The actual principles at work are [[single-responsibility-principle]] (each predicate has one job) and [[strategy-pattern]] (each predicate is a strategy).

---

### 50. Replacement composition is not Decorator — it modifies internals, not wrapping

effect-composition-model.md says intervention compositions "are [[decorator-pattern]] decorators wrapping the evaluation pipeline."

The Decorator pattern adds behavior before/after a wrapped object while preserving its interface. Psyshock's Replacement doesn't wrap DealDamage and add behavior — it reaches into the damage pipeline and substitutes which stat is read (Defense instead of Special Defense). This modifies the wrapped node's internal resolution, not its external interface.

Per the SE vault: "Decorator changes the 'skin'; Strategy changes the 'guts'." Replacement changes the guts. This is closer to [[strategy-pattern]] (swap the stat-selection algorithm) than [[decorator-pattern]].

The mislabeling matters because Decorator's guarantees (wrapper order independence, interface preservation) don't apply to Replacement. If two Replacements target the same child (one swapping the defense stat, another swapping the damage type), their interaction rules are undefined. Decorator stacking is well-defined; Replacement stacking is not.

---

## Design Gaps

---

### 51. Heal Block checking is scattered across atoms — the [[shotgun-surgery-smell]] the design claims to eliminate

HealHP atom (effect-atom-catalog.md) says: "The atom checks for `heal-block` in the target's `HasActiveEffects` before producing a delta."

But Heal Block blocks ALL HP recovery "from any source." This includes:
- HealHP atom (direct healing)
- ManageResource with `resource: 'tempHp'` (indirect HP benefit)
- Coat tick healing (Aqua Ring, processed as a triggered effect)
- Any future healing atom

Each source must independently check for `heal-block`. Adding a new healing path requires remembering to add the check. This is the [[shotgun-surgery-smell]] that data-driven-rule-engine.md says the design eliminates.

The engine should intercept healing centrally — a before-trigger on a `healing-attempted` event type that Heal Block subscribes to, preventing the heal before any atom runs. This would make Heal Block a single trigger definition with no per-atom scatter.

---

### 52. EmbeddedAction mutates the turn resolution sequence — contradicting the pure-function model

effect-node-contract.md says: "Given the same context, the same node produces the same result." This is the pure-function guarantee.

EmbeddedAction (effect-composition-model.md) "Grants a secondary action within the current resolution. The engine inserts the embedded action into the current turn's resolution sequence."

This is a side effect on the turn management system — not a delta in the EffectResult. Where in EffectResult does the embedded action go? It's not a combatantDelta (no lens field tracks pending actions). It's not an encounterDelta (the mutation types don't include action insertion). It's not an event (events are historical, not future). It's not a trigger (triggers fire on events, not grant actions).

EmbeddedAction either needs a new field on EffectResult (e.g., `embeddedActions: EmbeddedActionSpec[]`) or it needs to be expressed through existing fields (e.g., ModifyActionEconomy produces a delta, and the turn system reads the updated action budget). The current design doesn't specify either path.

---

### 53. `allCombatants` on every EffectContext gives every atom access to every entity — ISP violation the `requires` system doesn't cover

EffectContext (effect-node-contract.md) includes `allCombatants: SubInterfaceSlice[]`. The `requires` declaration filters which sub-interfaces are visible per combatant, but doesn't filter which combatants are visible. A single-target DealDamage atom receives all combatants' data even though it only needs the user and target.

The ISP filtering is half-implemented: narrow on the interface axis (which fields), broad on the entity axis (which combatants). The design should either:
- Remove `allCombatants` from the base context and only provide it when an atom declares it needs multi-target data
- Acknowledge that entity-axis filtering is intentionally coarse and remove the ISP claim for this dimension

---

### 54. ClearFieldState atom is a Defog-specific atom that undermines the composition principle

effect-atom-catalog.md says ClearFieldState "is a composite encounter mutation expressed as a single atom because Defog's clearing rules are specific and invariant."

But this is exactly what compositions are for. Defog could be:

```typescript
sequence([
  modifyFieldState({ field: 'weather', op: 'clear' }),
  modifyFieldState({ field: 'hazards', op: 'remove-all' }),
  modifyFieldState({ field: 'blessings', op: 'remove-all' }),
  modifyFieldState({ field: 'coats', op: 'remove-all' }),
])
```

Creating a dedicated atom for one move's clearing rules contradicts the design's principle that "atoms are finite, the novelty is in composition." If Defog warrants its own atom, what about Rapid Spin (clears hazards from user's side only)? Each novel clearing combination would demand a new atom instead of composing from ModifyFieldState. This is [[speculative-generality-smell]] in reverse — over-specialization.

---

## Summary

| # | Finding | Severity | Category |
|---|---|---|---|
| 43 | Atom count is 16 not 15 — arithmetic error | Minor | Contradiction |
| 44 | Flash Fire classified as after-trigger but uses before-trigger interception | **Bug** | Contradiction |
| 45 | Resolution atom result flags have no EffectResult field | **Structural** | Contradiction |
| 46 | `interceptEvent()` and `passThrough()` undocumented | **Completeness** | Missing atoms |
| 47 | `passiveEffects` on TraitDefinition has no formal design | **Completeness** | Undocumented concept |
| 48 | Two trigger-specific predicates missing from ConditionPredicate union | **Completeness** | Missing coverage |
| 49 | Discriminated unions don't satisfy OCP — misapplied principle | Moderate | SE misapplication |
| 50 | Replacement is not Decorator — it modifies internals | Moderate | SE misapplication |
| 51 | Heal Block checking scattered across atoms = shotgun surgery | **Design** | Design gap |
| 52 | EmbeddedAction has no EffectResult field — contradicts pure-function model | **Structural** | Design gap |
| 53 | `allCombatants` on every EffectContext breaks entity-axis ISP | Moderate | Design gap |
| 54 | ClearFieldState is a Defog-specific atom that undermines composition | Moderate | Design smell |

## What the design gets right

The core architecture is strong. The four-layer separation (atoms, compositions, triggers, definitions) is clean. The EffectNode contract as the DIP pivot is correct — it genuinely inverts the dependency so the engine doesn't know about specific moves. The [[mediator-pattern]] framing for the engine is accurate and well-applied. StateDelta and EncounterDelta as [[command-pattern]] objects is the right model. The worked examples in effect-definition-format.md demonstrate that the composition model can express real PTR moves with reasonable ergonomics.

The most important finding is **45 (resolution atom result flags)**. Without a communication channel for pass/fail, the entire flow-control composition layer (Sequence with haltOnFailure, Conditional branching on accuracy) doesn't work. This is a structural gap in the EffectResult contract.

The most actionable finding is **44 (Flash Fire timing)**. It's a one-word fix (`after` → `before`) but demonstrates that the before/after dispatch model needs careful validation against every trait that intercepts or absorbs.

**Status:** Adversarial review of R0.A effect engine design complete. 12 findings (43–54). ~~Awaiting decisions.~~ Decisions posted below.

