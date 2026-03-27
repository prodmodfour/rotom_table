# 2026-03-26 — Adversarial Review Findings 98–108 Resolved

All actionable findings from post 36 have been addressed. 54 tests passing, clean compile.

## Resolution summary

| # | Finding | Resolution |
|---|---|---|
| 98 | `maxHp()` broken for Pokemon | **Fixed.** `maxHp(lens, level?)` now accepts level as a parameter. Pokemon without level throws. Cascaded to `currentHp()` and `tickValue()`. Chose option (b) from the reviewer's suggestions — level is entity-sourced, so the caller provides it from the entity, matching the `projectCombatant(entity, lens)` model. |
| 99 | `any => any` handler type | **Fixed.** Moved `TriggerRegistration` to `effect-contract.ts` where `TraitTriggerHandler` is defined. `lens.ts` re-exports via `import type` — type-only imports have no runtime circular dependency. Deleted the `TraitTriggerHandlerFn` any type entirely. |
| 100 | `PassiveEffectSpec` undocumented fields | **Vault updated.** `effect-handler-format.md` now documents all 5 new fields (`movementTypeGrant`, `critBonusDamage`, `dbBoostThreshold`, `dbBoostAmount`, `dbBoostKeywords`) and the 2 changed fields (`weatherDamageImmunity`, `statMultiplier.stat`). |
| 101 | `EffectResult` undocumented fields | **Vault updated.** `effect-handler-contract.md` now documents `entityWriteDeltas` (for tagged entity-write effects like Thief) and `intercepted` (for before-handler interception signal). |
| 102 | `HasMovement` type mismatch | **Vault updated.** `combat-lens-sub-interfaces.md` now shows `MovementProfile[]` with explanation that each profile pairs a movement type with its per-turn speed grant. |
| 103 | HP formula typo in vault | **Vault fixed.** `combat-lens-sub-interfaces.md` corrected from `HP + (Level x 3) + 10` to `(Level x 5) + (HP x 3) + 10`. |
| 104 | No stat utility tests | **18 tests added.** New `tests/stat.test.ts` covers `effectiveStat` (5 tests: stage 0, positive stages, negative stages, +6 doubles, all combat stats), `maxHp` (5 tests: Pokemon level 20, Pokemon level 1, trainer, trainer ignores level, Pokemon throws without level), `currentHp` (3 tests), `maxEnergy` (3 tests: formula, minimum 3, high stamina), `tickValue` (2 tests). |
| 105 | No type structure tests | **Deferred.** TypeScript's compiler catches most structural drift. Lower priority than stat utility coverage. |
| 106 | `BlessingMutation` key name | **Vault fixed.** `encounter-delta-model.md` corrected from `blessingId` to `blessingType` to match code and `BlessingInstance.blessingType`. |
| 107 | Empty scaffold directories | **No action.** Scaffold is explicitly ~15% complete. Empty directories are intentional placeholders. |
| 108 | Inline trailing member on CombatantLens | **Fixed.** Expanded `HasIdentity` to include `entityId` and `entityType`. Made `HasTypes` partial via `Partial<HasTypes>` in the composite. Deleted the anonymous inline member. Updated `combat-lens-sub-interfaces.md` to match. |

## Design decisions made

**Finding 98 — level as parameter (option b).** The lens is combat-transient state. Level is entity identity — it doesn't change during combat and isn't modified by effects. Adding it to the lens (option a) would expand the lens beyond its design boundary. A `HasLevel` sub-interface (option c) adds structural weight for one field. The simplest correct design: callers provide level from the entity when calling HP-related functions. This matches how `projectCombatant(entity, lens)` composes entity data with lens data at the call site.

**Finding 108 — `HasIdentity` expanded.** `entityId` and `entityType` are identity fields, not combat state. They answer "what is this combatant?" not "what happened to it in combat." Placing them in `HasIdentity` aligns with the sub-interface's semantic role. `types?` is handled by `Partial<HasTypes>` which preserves the named-interface pattern while expressing that trainers are typeless.

## Files changed

**Code:**
- `packages/engine/src/utilities/stat.ts` — `maxHp`, `currentHp`, `tickValue` signatures updated
- `packages/engine/src/types/lens.ts` — `HasIdentity` expanded, inline member removed, `TriggerRegistration` moved out
- `packages/engine/src/types/effect-contract.ts` — `TriggerRegistration` added with real handler type
- `packages/engine/tests/stat.test.ts` — new file, 18 tests

**Vault:**
- `vaults/documentation/combat-lens-sub-interfaces.md` — HasIdentity, HasTypes, HasMovement, HP formula
- `vaults/documentation/effect-handler-contract.md` — EffectResult fields
- `vaults/documentation/effect-handler-format.md` — PassiveEffectSpec fields
- `vaults/documentation/encounter-delta-model.md` — BlessingMutation key name

## Test status

54 tests passing (was 36). Clean `tsc --noEmit`. No regressions.

**Status:** Adversarial review findings resolved. Scaffold ready for effect utility implementation (item 3 from post 35's "What's next").
