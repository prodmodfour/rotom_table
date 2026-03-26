# 2026-03-26 — Adversarial Review of R0.A Sample Definitions (Findings 55–66)

Reviewed all 45 definitions against the effect engine design (6 vault notes), the GameState interface (10 vault notes), the PTR vault, and the SE vault (~220 notes). Cross-referenced each gap against the R0.A exit criterion to determine whether it's a Ring 0 blocker or a Ring 1 deferral.

---

## R0 Exit Criterion Violations

---

### 55. Five missing predicates are R0 gaps, not R1 deferrals — the exit criterion says "all composition patterns covered"

The gap summary categorizes all 5 missing predicates as extensions. But the R0 exit criterion says: "The effect engine can express and correctly evaluate all 45 sample definitions." It does NOT say "38 of 45." If Roar, Gyro Ball, After You, Beat Up, and Teamwork cannot be expressed, the exit criterion fails.

The definitions post itself classifies these as "gaps" — places "where the current engine design cannot fully express a definition." That's a failed exit criterion by the post's own language.

Sorting by severity:

| Predicate | Blocking move/trait | R0 or defer? | Rationale |
|---|---|---|---|
| `target-effective-stat-exceeds-user` | Gyro Ball | **R0** — it's a state-query predicate. The engine already has state queries. Adding one that compares effective stats (stat × CS multiplier) between two entities is a straightforward ConditionPredicate variant. No new machinery. |
| `target-has-not-acted-this-round` | After You | **R0** — reads `actedThisRound` from `HasInitiative`, which already exists on the lens. Trivial predicate. |
| `target-within-recall-range` | Roar | **Defer** — requires spatial engine (distance calculation to trainer/Poke Ball). Spatial is Ring 3B. Roar's forced displacement works in R0; the recall-if-close check is a spatial concern. |
| `target-is-willing` | After You | **Defer** — player consent is an interaction concern that belongs with the turn lifecycle. After You's initiative reorder works without this check; the check prevents griefing (targeting unwilling allies). |
| `user-is-adjacent-to-target` (three-entity) | Teamwork | **Defer** — three-entity spatial queries require spatial engine infrastructure. Teamwork's mechanical effect (accuracy bonus) works via the composition model; the spatial trigger condition is Ring 3B. |

**Impact:** Add `target-effective-stat-exceeds-user` and `target-has-not-acted-this-round` to the ConditionPredicate union now. Defer the other three. This raises the fully expressible count from 38 to 40 (Gyro Ball and After You become expressible), with 5 remaining definitions having documented spatial or interaction deferrals.

---

### 56. DealDamage `bonusDamage` is an R0 gap — it exposes an insufficient atom parameterization

Gyro Ball needs `bonusDamage: { source: 'stat-difference', stat: 'spd', formula: 'target-minus-user' }`. The current DealDamage atom has `damageBase` but no mechanism for variable bonus damage computed from state.

This isn't a niche case. PTR has many moves with stat-derived bonus damage:
- Gyro Ball (Speed difference)
- Electro Ball (Speed ratio)
- Heavy Slam (Weight difference)
- Grass Knot (target weight)
- Low Kick (target weight)

The `bonusDamage` param pattern will be needed for ~10+ moves in Ring 1's "50 damage moves" content task. If DealDamage can't express it, those moves are also inexpressible.

This is a DealDamage params extension, not a new atom. The atom's `evaluate` function reads the bonus source from params, computes the bonus from context (effective stats), and adds it to the damage pipeline. Per [[single-responsibility-principle]], the damage atom already owns the damage computation — adding a bonus source input is extending its responsibility, not adding a new one.

**Impact:** Add `bonusDamage?: BonusDamageSpec` to DealDamage params in R0. The spec needs: `source` (stat-difference, stat-ratio, weight-based), `stat` (which stat), `formula` (how to compute). Without this, Ring 1's content task will immediately rediscover the same gap.

---

### 57. `applyDamageResistance` is R0 — the damage pipeline lacks a resistance step

Light Screen says "resist Special damage one step." The gap summary says this depends on "PTR resistance step system formalization." But resistance steps are part of the nine-step damage formula — they modify how much damage gets through. The damage pipeline is R1.1, which the exit criterion says must be usable by Ring 1.

The PTR vault's `damage-resistance-tiers.md` defines: Normal → Resisted (×0.5) → Doubly Resisted (×0.25) → Triply Resisted (immune). Light Screen shifts damage one tier toward Resisted.

If the DealDamage atom's pipeline doesn't account for resistance tiers, then Light Screen — a Blessing in the Ring 0 exit criterion sample — doesn't work. And Light Screen is one of the most common defensive moves in the game.

**Impact:** Add resistance tier as a damage pipeline parameter. `DealDamage` needs to receive `resistanceModifier: number` (default 0, Light Screen sets -1) as part of its pipeline. This can be delivered via a before-trigger that modifies the DealDamage params — or as a passive effect the pipeline reads. Either way, it must be expressible in R0.

---

## Composition Model Gaps

---

### 58. CrossEntityFilter context switching is unspecified and Beat Up can't work without it

Beat Up's gap says: "when an ally performs the Struggle Attack, the ally becomes the 'user' for that evaluation." This is a fundamental composition question, not a DealDamage extension.

The EffectContext has `user` and `target` as named fields. CrossEntityFilter iterates entities and evaluates a child for each. But the child receives the SAME context — `user` is still the original user (Beat Up's caster), not the filtered ally. DealDamage's attack stat, STAB check, and type effectiveness all read from `user`. If `user` doesn't change, the ally's stats aren't used.

This affects more than Beat Up. Any effect that delegates actions to other entities needs context switching:
- Beat Up (allies attack through user's move)
- Helping Hand (user boosts ally's next attack — the "ally's next attack" context needs the ally as user)
- Instruct (target repeats their last move — the repeated move's context needs the target as user)
- Dancer (copy a dance move — the copy's context needs the copier as user)

The CrossEntityFilter composition needs an explicit `contextRole` param: `{ role: 'user' | 'target', maps-to: 'filtered-entity' }`. When `role: 'user'`, each filtered entity becomes the `user` in the child's EffectContext. When `role: 'target'`, each becomes the `target`.

**Impact:** This is an R0 gap. CrossEntityFilter's contract must specify context switching or it's a composition type that can't actually compose. Add `contextRole` to CrossEntityFilter in `effect-composition-model.md` and verify Beat Up works.

---

### 59. Safeguard and Light Screen blessing triggers live INSIDE the ModifyFieldState atom — this conflates data authoring with engine behavior

Safeguard's definition embeds a full trigger definition inside `ModifyFieldState`'s params:

```
modifyFieldState({
  field: 'blessing', op: 'add',
  instance: {
    ...
    activationEffect: {
      trigger: {
        eventType: 'status-applied',
        timing: 'before',
        ...
        effect: choicePoint('activate-safeguard', { ... })
      }
    }
  }
})
```

The `ModifyFieldState` atom is supposed to produce an `EncounterDelta` that adds a blessing to the field. But here it's also carrying a complete trigger definition with a before-trigger, a ChoicePoint, an InterceptEvent, and a field-state consumption — all as nested params inside one atom call.

Two problems:

1. **ISP violation.** `ModifyFieldState` now depends on the entire trigger system's types (TriggerDefinition, EffectNode, ChoicePoint, InterceptEvent) through its params. The atom catalog says ModifyFieldState requires `none` (no sub-interfaces) — but its params carry the full complexity of the effect system. This is `[[long-parameter-list-smell]]` — the params are a deep nested tree structure masquerading as atom configuration.

2. **The trigger system owns triggers, not atoms.** The `[[effect-trigger-system]]` says "trait definitions are subscribers." But these triggers aren't on traits — they're embedded inside field state instances. The trigger system's collection step ("collect all triggers matching the event type from all active combatants' traits and active effects") doesn't mention scanning field state instances for embedded triggers. The dispatch pipeline has a gap.

This doesn't require a fundamental redesign. The fix is: blessing triggers are registered with the trigger system when the blessing is created (not embedded in the ModifyFieldState params), and the trigger system scans blessings alongside traits and active effects. The ModifyFieldState atom produces an EncounterDelta that creates the blessing; the engine registers the blessing's trigger.

**Impact:** R0 gap. Clarify in `effect-trigger-system.md` that trigger sources include field state instances (blessings, coats, hazards) alongside traits and active effects. Simplify blessing/coat/hazard definitions to reference effect definitions rather than embedding full trigger trees in ModifyFieldState params.

---

## Correctness Issues

---

### 60. Thunder Wave's type immunity check is in the wrong place — should be an ApplyStatus concern, not a move definition

Thunder Wave uses a Conditional to check `target-type-is: electric` before applying Paralysis. But type-based status immunity is a GENERAL rule — Electric types are immune to Paralysis regardless of the source. The check should be inside the ApplyStatus atom (or as a before-trigger on `status-applied`), not hard-coded into Thunder Wave's definition.

If a trait or another move inflicts Paralysis on an Electric type, there's no type check in THAT definition — the immunity would be silently skipped. This is `[[shotgun-surgery-smell]]`: type immunity must be checked in every definition that applies the status, rather than once in the status application system.

The same problem applies to:
- Poison types immune to Poisoned/Badly Poisoned
- Steel types immune to Poisoned
- Fire types immune to Burned (per PTR)

ApplyStatus already reads `HasTypes` — it should check type immunities as part of its standard evaluation. The Conditional in Thunder Wave should be removed.

**Impact:** R0 correctness fix. Move type-based status immunity from per-definition Conditionals into ApplyStatus (or a centralized before-trigger on `status-applied`). Update Thunder Wave to remove the redundant check. This is the same centralization principle that fixed Heal Block (finding 51) — don't scatter immunity logic across definitions.

---

### 61. Stealth Rock's `applyTypeEffectiveness: true` on tick damage contradicts the damage pipeline design

Stealth Rock deals 1 tick of typed damage with type effectiveness. The definition uses `dealDamage({ ticks: 1, type: 'rock', class: 'physical', applyTypeEffectiveness: true })`.

But the DealDamage atom runs the nine-step damage formula, which ALWAYS applies type effectiveness (step 8). `applyTypeEffectiveness` implies it can be toggled off. When would it be off? The nine-step formula doesn't have an "ignore type effectiveness" option.

The real issue: Stealth Rock doesn't use the nine-step formula at all. It deals a flat tick of damage (1/10 max HP) modified by type effectiveness. No attack stat, no defense stat, no STAB, no DB, no crit. It's a different damage mode — tick damage with type chart.

The DealDamage atom conflates two distinct damage models:
1. **Formula damage** — the nine-step pipeline (Thunderbolt, Earthquake, etc.)
2. **Tick damage** — flat HP fraction, optionally modified by type chart (Stealth Rock, burn, poison, Vortex)

These are different enough that forcing both through DealDamage creates the `ticks` + `applyTypeEffectiveness` + `db: null` params soup. A cleaner model: tick damage is a separate pathway in DealDamage, or a variant of ManageResource (since it's "lose HP" not "deal damage" in the combat log sense).

**Impact:** Not a blocker for R0 exit — Stealth Rock is expressible. But the conflation will become a pain point in Ring 1 when burn/poison/Vortex tick damage also needs expressing. Document the two damage modes as an acknowledged design tension in `effect-atom-catalog.md`.

---

### 62. Flash Fire's ActiveEffect state `{ fireBoost: true }` has no consumption mechanism

Flash Fire absorbs a Fire move and grants "+5 to next Fire damage roll." The sample definition creates an ActiveEffect with `state: { fireBoost: true }` and `expiresAt: null` (permanent until cleared).

Two problems:

1. **"Next Fire damage" implies one-use.** The boost should be consumed after the user's next Fire-type attack. But `expiresAt: null` means the effect persists permanently. There's no `expiresAt: 'on-next-fire-move-used'` in the ActiveEffect model. The effect engine has no way to express "this effect expires when the holder uses a specific type of move."

2. **How does DealDamage read the boost?** The atom reads passive effects (`passiveEffects.fireDamageBonus`?) or active effects (`HasActiveEffects → find flash-fire-boost`). If it reads ActiveEffect state, DealDamage needs `HasActiveEffects` in its `requires` — but the atom catalog says DealDamage requires `HasStats, HasCombatStages, HasHealth, HasTypes`. Adding `HasActiveEffects` to DealDamage expands its dependency surface for a single trait interaction.

The cleaner model: Flash Fire applies a transient combat stage boost (+X to a relevant stat) or a damage modifier via the passive effect system, with an after-trigger on `move-used` that checks "was it Fire-type?" and removes the boost. This avoids both problems — standard CS/passive mechanics handle the boost, and an after-trigger handles consumption.

**Impact:** R0 gap. Flash Fire's definition needs revision to use a consumption mechanism. Either add `expiresAt: { onEvent: 'user-fire-move-used' }` to the ActiveEffect model, or redesign Flash Fire to use CS + after-trigger consumption. The current definition doesn't correctly implement the one-use behavior.

---

## Deferral Validation

---

### 63. Delayed resolution (`resolution: 'end-of-round'`) is correctly deferred — but the deferral boundary is wrong

Roar's delayed resolution is categorized as "move metadata, not an effect engine concept." Correct. But the definition still includes `resolution: 'end-of-round'` on the MoveDefinition. This field doesn't exist in `effect-definition-format.md`.

The move definition format should formally declare which fields are engine-evaluated (the `effect` tree) and which are turn-system metadata (action type, resolution timing, targeting mode). Currently, `actionType` appears on some definitions (After You: 'swift', Wide Guard: 'interrupt') without being specified in the format. The definitions are inventing metadata fields ad hoc.

**Impact:** Not an R0 blocker. But `effect-definition-format.md` should enumerate the non-effect metadata fields that MoveDefinition can carry, with a note that these are consumed by the turn system (Ring 1), not the effect engine. This prevents the format from accreting undocumented fields.

---

### 64. Reroll mechanics (Mettle) are correctly deferred — but `requestReroll` should be removed from the definition

Mettle's definition includes `requestReroll({ must: 'accept-new-result' })` — an atom that doesn't exist and is acknowledged as a turn-lifecycle concern. But the definition presents it as if it COULD work once the atom exists.

It can't. A reroll suspends the current evaluation, generates a new roll, and re-runs the evaluation with the new input. This breaks the pure-function contract — the function can't suspend itself. The engine must handle this externally (detect Mettle trigger → present choice → if reroll: re-invoke the entire evaluation with a different `ResolutionContext`).

`requestReroll` as an atom is a category error. It should be replaced with a marker in the EffectResult (e.g., `rerollOffered: RerollSpec`) that the engine reads, similar to `embeddedActions`. The engine then handles the re-invocation.

**Impact:** Not an R0 blocker (correctly deferred to Ring 1). But the definition should replace `requestReroll(...)` with a comment explaining the intended mechanism to avoid implying a future atom.

---

### 65. Teamwork's `modifyAccuracyRoll` — the proposed alternative (transient accuracy CS boost) has side effects

The gap summary proposes: "Use transient accuracy CS boost instead of modifying the roll directly." But accuracy CS is a persistent lens field (`combatStages.accuracy`). If Teamwork applies +2 accuracy CS as a "transient" effect, when does it get removed? Before the next attack? At end of turn?

If it's removed "before the next attack," the engine needs a before-trigger on every accuracy check that removes stale Teamwork CS boosts — which is the scattered-check problem Heal Block centralization (finding 51) was designed to eliminate.

If it's removed "at end of turn," the +2 accuracy applies to ALL attacks that turn, not just the one melee attack by the adjacent ally.

The correct model: Teamwork is a before-trigger on `accuracy-check` that modifies the resolution context's accuracy roll value. This is the same mechanism as saying "this roll gets +2" — but it requires the engine to allow before-triggers to produce a modified `ResolutionContext`, not just `StateDelta`.

**Impact:** Deferred to Ring 1 (spatial query needed), but the proposed alternative is incorrect. When Teamwork is implemented, it needs accuracy-check event modification, not transient CS. Note this in the gap documentation.

---

### 66. The gap summary's claim "none require rethinking the fundamental architecture" is partially wrong

The summary says: "None of the gaps require rethinking the fundamental architecture." For most gaps, this is true. But two gaps expose genuine architectural insufficiencies, not just missing predicates:

1. **CrossEntityFilter context switching (finding 58)** — the composition can't express what it claims to express. A composition type that can't switch the evaluation context can't handle delegation. This affects the architecture of how compositions interact with EffectContext.

2. **Trigger registration for field state instances (finding 59)** — the trigger system doesn't know about field-state-embedded triggers. The dispatch pipeline's collection step has a gap. This affects the architecture of how the trigger system discovers triggers.

Both are fixable without restructuring the engine, but they're not "just add a predicate" extensions. They're contract gaps in two of the three core subsystems (compositions and triggers). The gap summary should distinguish between:
- **Extensions** — new predicates, new DealDamage params (most gaps)
- **Contract gaps** — missing specifications in existing contracts (CrossEntityFilter, trigger collection)
- **Deferrals** — concerns that belong to Ring 1 (delayed resolution, reroll, spatial queries)

---

## Summary

| # | Finding | Severity | Category | R0 or defer? |
|---|---|---|---|---|
| 55 | 5 missing predicates: 2 are R0, 3 are deferrals | **Correctness** — exit criterion fails | Exit criterion | 2 R0, 3 defer |
| 56 | DealDamage `bonusDamage` is R0 — ~10+ Ring 1 moves need it | **Scope** — insufficient atom params | Exit criterion | R0 |
| 57 | `applyDamageResistance` is R0 — Light Screen doesn't work | **Scope** — missing damage pipeline step | Exit criterion | R0 |
| 58 | CrossEntityFilter context switching unspecified | **Structural** — composition can't express delegation | Composition gap | R0 |
| 59 | Blessing triggers embedded in ModifyFieldState params | **Design** — ISP violation + trigger system gap | Composition gap | R0 |
| 60 | Thunder Wave type immunity hardcoded — should be in ApplyStatus | **Correctness** — shotgun surgery | Correctness | R0 |
| 61 | Stealth Rock conflates formula and tick damage modes | **Design** — acknowledged tension, not blocker | Correctness | Document |
| 62 | Flash Fire has no consumption mechanism for one-use boost | **Correctness** — definition doesn't match PTR behavior | Correctness | R0 |
| 63 | Move metadata fields undocumented in definition format | **Completeness** — ad hoc fields | Deferral validation | Document |
| 64 | `requestReroll` is a category error — should be EffectResult marker | **Design** — definition implies nonexistent atom | Deferral validation | Document |
| 65 | Teamwork's proposed CS alternative has side effects | **Design** — proposed workaround is incorrect | Deferral validation | Document |
| 66 | "No architectural rethinking needed" claim partially wrong | **Process** — 2 contract gaps in core subsystems | Gap classification | Reclassify |

## What the definitions get right

The 45-definition validation exercise is exactly the right methodology. It's the first time the engine design has been tested against real PTR content rather than abstract architecture. The 38 fully expressible definitions prove the core model works — atoms compose, triggers fire, compositions orchestrate. The helper function syntax (`sequence`, `conditional`, `dealDamage`, etc.) produces readable definitions that a content author could write. The coverage matrix confirms all 18 atoms and 7 composition patterns are exercised.

The most important finding is **58 (CrossEntityFilter context switching)**. Without it, any effect that delegates actions to other entities (Beat Up, Helping Hand, Instruct, Dancer) is inexpressible. This is a core composition contract gap, not an extension.

The most actionable finding is **60 (Thunder Wave type immunity centralization)**. It's a one-definition fix that prevents a class of bugs — every future status-inflicting definition would need to remember to add type immunity checks, and most would forget.

**Status:** Adversarial review of R0.A sample definitions complete. 12 findings (55–66). 6 require R0 resolution (2 predicates, bonusDamage params, resistance step, CrossEntityFilter contract, blessing trigger registration, Flash Fire consumption, Thunder Wave centralization). 3 are correctly deferred. 3 should be documented. ~~Awaiting decisions.~~ Foundational reassessment posted below.

