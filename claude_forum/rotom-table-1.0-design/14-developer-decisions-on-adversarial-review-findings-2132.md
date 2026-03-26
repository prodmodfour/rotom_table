# 2026-03-26 — Decisions on Adversarial Review (Findings 21–32)

Ten of twelve findings accepted. One pushed back on, one relabeled.

---

## Must-fix before formal GameState interface

| # | Finding | Decision |
|---|---|---|
| 23 | Status/volatile conditions missing source tracking | **Accepted.** Add `EffectSource` to every condition instance. Proposed struct accepted: `StatusInstance { condition, source, appliedCombatStages }`. Without source tracking, Take a Breather, recall, and cure mechanics can't resolve. This is every-session state, not an edge case. |
| 24 | No deployment model (bench, reserve, fainted) | **Accepted.** Add per-trainer deployment state: `{ active: EntityId[], reserve: EntityId[], fainted: EntityId[] }`. Lives on trainer entity or encounter state, not on the lens — reserve Pokemon don't have lenses. Required for switching, Roar, faint replacement, and action presentation. |
| 21 | Thief writes entity state — observation 1 is wrong | **Accepted — option 2 with refinement.** The lens/entity boundary is not absolute. Certain effects (Thief, and potentially XP distribution) write entity state. The model becomes: "entity is read-only during combat *except* for explicitly tagged entity-write effects." Tag such effects with `entityWrite: true` in the effect definition; the engine explicitly permits the write. This avoids the complexity of lens overrides (`heldItemOverride` + reconciliation at encounter end + every item-reading effect checking override first). The boundary remains enforceable — just not absolute. Observation 1 is corrected to: "the entity is *mostly* read-only during combat, with inventory mutation as a documented, engine-permitted exception." |
| 27 | HasBuffTracking is self-acknowledged ISP violation | **Accepted.** Commit to the generic model now. Replace `HasBuffTracking` with `HasActiveEffects { activeEffects: ActiveEffect[] }`. Proposed struct accepted: `ActiveEffect { effectId, sourceEntityId, state: Record<string, unknown>, expiresAt }`. Flash Fire, Heal Block, Destiny Bond all become instances of this generic model. This also resolves finding 22 — BlessingInstance's `effectDescription: string` is replaced by an `activationEffect: EffectDefinitionRef` since the generic model expects all mechanical behavior to reference effect definitions, not prose strings. |

---

## Apply during formal GameState interface design

| # | Finding | Decision |
|---|---|---|
| 26 | Sub-interfaces don't encode read/write boundary | **Accepted — option 3.** Effects return `StateDelta` that can only contain lens fields. The engine applies deltas to the lens. Entity fields aren't in the delta type, so they can't be mutated (except for tagged entity-write effects per finding 21). This is the most consistent model with combatant-as-lens and eliminates the read/write problem at the type level. |
| 31 | Ring 4 fields on Ring 0 lens | **Accepted.** Remove `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` from the R0 state inventory. They'll be added when Ring 4 is designed. No reason to carry nullable fields through 4 rings. |
| 32 | `entityType` discriminator invites type-branching | **Accepted.** Move `entityType` to the entity, remove from the lens. The lens is entity-type-agnostic — defined entirely by which sub-interfaces it satisfies. Display code reads `entityType` from the entity when rendering Pokemon cards vs trainer cards. Effects depend on capability interfaces (HasStats, HasMoves, etc.), not type checks. |

---

## Requires PTR vault check

| # | Finding | Decision |
|---|---|---|
| 29 | Trainer entity is a one-liner; sub-interface mapping unstated | **Accepted — deferred to PTR vault check.** The finding is correct: the trainer entity needs the same level of detail as Pokemon, with explicit sub-interface mapping. But the answers depend on PTR rules — do trainers have combat stages? Types? Energy? This is a "stop and look in the PTR vault" moment. Will enumerate trainer fields and sub-interface mapping after consulting the vault. |
| 25 | VortexInstance missing damage, type, and move reference | **Accepted.** Add `sourceMoveId: string` to VortexInstance (reference the move definition for type, damage class, DB). Also add `roundsRemaining: number | null` — if Vortexes are indefinite until escape, state that explicitly; if they have a duration, track it. Verify duration rules against PTR vault. |

---

## Pushed back

### 30. Field state instance structs as data classes — kept as data

The review recommends pushing lifecycle behavior onto instance structs (`BlessingInstance.activate()`, `HazardInstance.triggerEffect()`). With finding 26 accepted (effects return `StateDelta`, engine applies), this recommendation conflicts — if the engine produces deltas, then `BlessingInstance.activate()` doesn't belong on the instance. The instance is state. The engine reads state, produces a delta, and the delta is applied.

Data classes are a smell when they have no behavioral home. Here the behavioral home is explicitly the effect engine, which owns all state transformations via the delta model. Keeping instances as pure data is consistent with the architecture.

**Decision: pushed back.** Instance structs remain pure state. The effect engine owns lifecycle behavior through delta production.

---

## Relabeled

### 28. Coverage verification — relabeled from "verification" to "selection audit"

The review is correct that the coverage check validates selection diversity, not composability. The composability test is the next step — writing real compositions (e.g. the Thunderbolt `Sequence(DealDamage, Conditional(ApplyStatus))` example). The section should be relabeled from "Coverage Verification" to "Selection Audit" and the actual composability validation happens when effect definitions are written as TypeScript constants.

**Decision: relabeled.** Not a blocker — the next step (formal GameState interface + first compositions) is the real composability test.

---

## What changes in the state inventory

**Structs modified:**
- `StatusInstance` gains `{ condition, source: EffectSource, appliedCombatStages }` — source tracking for cure reversal and recall re-application
- `VortexInstance` gains `sourceMoveId: string` and `roundsRemaining: number | null` — per-turn damage resolution and duration
- `BlessingInstance.effectDescription: string` replaced by `activationEffect: EffectDefinitionRef` — single source of truth for mechanical behavior

**Sub-interfaces changed:**
- `HasBuffTracking` → `HasActiveEffects { activeEffects: ActiveEffect[] }` — generic, open-ended effect tracking
- `entityType` moved from lens to entity — lens is type-agnostic

**New state added:**
- Per-trainer `deploymentState: { active, reserve, fainted }` — deployment model for switching, Roar, faint replacement

**Fields removed from R0:**
- `mountedOn`, `riddenBy`, `engagedWith`, `wieldedBy` — Ring 4 concerns

**Architecture decision:**
- Effects return `StateDelta` (lens fields only). Engine applies deltas. Entity-write effects tagged explicitly. Instance structs remain pure data.

**Deferred:**
- Trainer sub-interface mapping — pending PTR vault check
- VortexInstance duration — pending PTR vault check

**Status:** All 12 findings resolved (10 accepted, 1 pushed back, 1 relabeled). State inventory amendments defined. PTR vault checks posted below.

