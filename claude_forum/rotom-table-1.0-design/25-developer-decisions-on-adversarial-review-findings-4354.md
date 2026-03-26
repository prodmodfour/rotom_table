# 2026-03-26 — Decisions on Adversarial Review (Findings 43–54)

All 12 findings accepted. No pushbacks. The core architecture is confirmed sound — every finding either completes a contract, corrects a label, or improves consistency.

---

## Must-fix — structural gaps in EffectResult contract

| # | Finding | Decision |
|---|---|---|
| 45 | Resolution atom result flags have no EffectResult field | **Accepted.** Add `success: boolean` to EffectResult. This is the flow-control signal that Sequence (`haltOnFailure`) and Conditional (branching on accuracy) depend on. Default `true` — only resolution atoms set it to `false`. Parsing the events array for an accuracy-miss event would violate [[tell-dont-ask]]; a direct signal is the correct model. |
| 52 | EmbeddedAction has no EffectResult field — contradicts pure-function model | **Accepted.** Add `embeddedActions: EmbeddedActionSpec[]` to EffectResult. The engine reads this field and inserts the actions into the turn resolution sequence. The atom itself remains pure — it declares intent, the engine acts on it. Same pattern as `triggers: TriggeredEffect[]` already on EffectResult. |

---

## Must-fix — bugs and contradictions

| # | Finding | Decision |
|---|---|---|
| 44 | Flash Fire classified as after-trigger but uses before-trigger interception | **Accepted.** Change to `timing: 'before'`. An after-trigger cannot absorb damage that's already been applied. Every type-absorb trait (Flash Fire, Volt Absorb, Water Absorb, Lightning Rod, Storm Drain, Motor Drive, Sap Sipper) must be validated as before-triggers during the 45 sample definitions task. |
| 43 | Atom count is 16 not 15 — arithmetic error | **Accepted.** Fix count to 16 (11 state-producing + 3 encounter-producing + 2 resolution). Minor, but the R0.A exit criterion references this count for coverage verification. |

---

## Must-fix — completeness gaps

| # | Finding | Decision |
|---|---|---|
| 46 | `interceptEvent()` and `passThrough()` undocumented | **Accepted.** Add both to the atom catalog as engine primitives. `InterceptEvent` is atom 17 — it sets the interception flag that prevents the original event's deltas. `PassThrough` is atom 18 — an explicit no-op for else-branches. Without InterceptEvent formally catalogued, the entire before-trigger interception system (Protect, Wide Guard, Flash Fire, Volt Absorb) is underspecified. Updated atom count: 18. |
| 47 | `passiveEffects` on TraitDefinition has no formal design | **Accepted.** Passive effects are a third category alongside triggered effects and atom-produced effects. They are static modifiers always active while the trait is present. Design needed: evaluation order, conflict resolution (two traits overriding the same value), and typed fields (not `Record<string, unknown>`). Add a `PassiveEffectSpec` section to effect-definition-format.md specifying the known passive keys, their types, and the engine's read points. |
| 48 | Two trigger-specific predicates missing from ConditionPredicate union | **Accepted.** Add `incoming-move-is-contact` and `incoming-move-type-is` to the ConditionPredicate union. The union needs a new category: event-query predicates (properties of the triggering event) alongside the existing state-query predicates (properties of combat state). Enumerate the full set of event-query predicates needed during the 45 sample definitions task — contact, type, damage class, range, and source-entity are the likely set. |

---

## Correct SE principle labels

| # | Finding | Decision |
|---|---|---|
| 49 | Discriminated unions don't satisfy OCP — misapplied principle | **Accepted.** Relabel all ~15 OCP citations across the 6 notes. The actual principles at work: [[single-responsibility-principle]] (each variant has one job) and [[strategy-pattern]] (each variant is a strategy with a shared evaluation interface). The architecture is correct — the principle name is wrong. A strategy map (`Record<string, EvaluatorFn>`) would be OCP; discriminated unions require modification by definition. |
| 50 | Replacement composition is not Decorator — it modifies internals | **Accepted.** Relabel Replacement from [[decorator-pattern]] to [[strategy-pattern]]. Decorator wraps and preserves the interface; Replacement reaches into the damage pipeline and swaps which stat is read. "Changes the guts, not the skin." The relabeling also surfaces a real design question: if two Replacements target the same child, what are the stacking rules? Decorator stacking is well-defined (order-independent); Replacement stacking is not. Add stacking rules for Replacement to effect-composition-model.md. |

---

## Design improvements

| # | Finding | Decision |
|---|---|---|
| 51 | Heal Block checking scattered across atoms = shotgun surgery | **Accepted.** Centralize Heal Block as a before-trigger on a `healing-attempted` event type. The engine emits `healing-attempted` before any healing atom runs; Heal Block subscribes as a before-trigger with interception. One trigger definition, zero per-atom checks. This is consistent with how the trigger system already handles damage prevention (Protect, type-absorb traits). Remove the per-atom Heal Block check from HealHP and any other healing atoms. |
| 54 | ClearFieldState is a Defog-specific atom that undermines composition | **Accepted.** Remove ClearFieldState from the atom catalog. Defog becomes a sequence of ModifyFieldState atoms with appropriate field/op combinations. "Atoms are finite, the novelty is in composition" — Defog is novel composition, not a novel atom. Updated atom count: 17 (18 minus ClearFieldState). |
| 53 | `allCombatants` on every EffectContext breaks entity-axis ISP | **Accepted — with pragmatic scoping.** Acknowledge that entity-axis filtering is intentionally coarse. Building entity-scoping machinery (declaring which combatants an atom needs) adds complexity disproportionate to the risk. The ISP claim applies to the interface axis (which sub-interface fields); remove the ISP claim for the entity axis. In practice, atoms access user + target via named fields and `allCombatants` is only used by multi-target effects (spread moves, field-wide effects). Document this as an intentional design tradeoff. |

---

## What changes in the effect engine design

**EffectResult gains two fields:**
- `success: boolean` (default `true`) — flow-control signal for Sequence and Conditional
- `embeddedActions: EmbeddedActionSpec[]` — declarative action insertion for the turn system

**Atom catalog changes:**
- Add `InterceptEvent` (atom 17) — sets interception flag for before-triggers
- Add `PassThrough` (atom 18) — explicit no-op for else-branches
- Remove `ClearFieldState` — replaced by ModifyFieldState composition
- Fix count: 17 atoms total (13 state-producing, 2 encounter-producing, 2 resolution) plus InterceptEvent and PassThrough as engine primitives = 17 if we count primitives in the total, or 15 + 2 primitives if kept separate. **Decision: count them in.** 17 atoms.

**ConditionPredicate union gains event-query category:**
- `incoming-move-is-contact`, `incoming-move-type-is` added immediately
- Full event-query predicate set enumerated during 45 sample definitions task

**New design section:**
- `PassiveEffectSpec` added to effect-definition-format.md — typed passive keys, evaluation order, conflict resolution

**SE principle relabeling:**
- ~15 OCP citations → SRP + Strategy
- Replacement composition: Decorator → Strategy
- Replacement stacking rules added to effect-composition-model.md

**Heal Block centralization:**
- New event type: `healing-attempted`
- Heal Block becomes a single before-trigger with interception
- Per-atom Heal Block checks removed

**ISP scope clarification:**
- ISP applies to interface axis (sub-interface fields), not entity axis (which combatants)
- `allCombatants` remains on EffectContext — documented as intentional

**Validation task added:**
- All type-absorb traits verified as before-triggers during 45 sample definitions

**Status:** All 12 findings (43–54) from adversarial review accepted and resolved. Effect engine design amendments defined. ~~Next step: amend the 6 effect engine vault notes and update the atom catalog, then proceed to the 45 sample definitions task (R0.A exit criterion).~~ Vault amendments complete — see below.

