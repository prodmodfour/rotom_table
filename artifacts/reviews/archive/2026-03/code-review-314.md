---
review_id: code-review-314
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-004
domain: combat
commits_reviewed:
  - 84f00898
  - 85cd953a
  - ca017e72
  - 3befc4e0
  - 541e7552
  - e0db8f85
  - 49d51e8e
  - 0a604055
  - 99d5ab07
  - e3b725e0
  - 4c8532b8
  - 8130a410
  - c7e5fb77
  - 9f3bad46
files_reviewed:
  - app/utils/mountingRules.ts
  - app/server/services/mounting.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/composables/useEncounterActions.ts
  - app/components/encounter/MountControls.vue
  - app/stores/encounter.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/utils/turn-helpers.ts
  - app/server/api/encounters/[id]/next-scene.post.ts
  - app/constants/trainerClasses.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-04T12:30:00Z
follows_up: code-review-305
---

## Review Scope

P2 implementation of feature-004 (Pokemon Mounting / Rider System) covering all 7 Rider trainer class features (sections J-P of spec-p2.md). 14 commits across 13 files, adding 936 lines. Reviewed against spec-p2.md, decree-003, decree-004, and decree-040.

**Previous tier reviews:**
- P0: code-review-289 APPROVED, rules-review-265 APPROVED
- P1: code-review-305 APPROVED (0 issues, all 5 code-review-296 issues resolved), rules-review-278 APPROVED

**Decree compliance:**
- decree-003 (tokens passable, enemy rough terrain): Not directly relevant to P2 Rider features. No violations.
- decree-004 (massive damage uses real HP after temp HP): Cavalier's Reprisal detection is downstream of damage, not modifying damage calc. Dismount check already uses decree-004-compliant hpDamage. No violations.
- decree-040 (flanking -2 after evasion cap): Ride as One modifies `speedEvasion` on the Combatant object. The `calculate-damage.post.ts` endpoint recalculates evasion from base stats + stages on each damage calculation (line 305), meaning it does NOT use the Combatant's `speedEvasion` field for accuracy checks. This is discussed in CRIT-1 below.

## Issues

### CRITICAL

**CRIT-1: Ride as One speed evasion sharing is ineffective for accuracy calculations**

`applyRideAsOneEvasion()` in `mounting.service.ts` modifies `combatant.speedEvasion` on mount and dismount. However, the accuracy calculation in `calculate-damage.post.ts` (lines 280-305) recalculates Speed Evasion from scratch using base stats and combat stages:

```typescript
speedEvasion = calculateEvasion(targetEvasion.speedBase, targetEvasion.speedStage, evasionBonus, focusSpeedBonus)
```

This means the Ride as One evasion sharing stored on `combatant.speedEvasion` is never actually used during attack resolution. The shared evasion values only appear in UI displays (e.g., combatant cards that read `combatant.speedEvasion`), but have zero mechanical effect on hit/miss outcomes.

To fix: The accuracy calculation in `calculate-damage.post.ts` must check for active Ride as One and apply the evasion sharing override. Alternatively, inject a modifier into the evasion calculation pipeline for mounted pairs with this feature.

**Files:** `app/server/services/mounting.service.ts` (lines 151-202), `app/server/api/encounters/[id]/calculate-damage.post.ts` (lines 280-305)

### HIGH

**HIGH-1: Agility Training ('Agile') stored as tempCondition will be auto-cleared at turn end**

The `toggleAgilityTraining` store action adds `'Agile'` to the mount's `tempConditions` array. However, `tempConditions` are cleared at the end of each combatant's turn by `next-turn.post.ts` (line 106: `currentCombatant.tempConditions = []`). This means:

1. GM toggles Agility Training on the rider's turn.
2. Mount's turn ends -> `tempConditions` cleared -> `'Agile'` removed.
3. Next round: Agility Training appears inactive even though it should persist.

Training effects are long-duration (persist until the Training order is given again). Using `tempConditions` is the wrong storage mechanism. The flag should be stored in a persistent field (e.g., on `mountState` as `agilityTrainingActive?: boolean`, or in a dedicated `persistentFlags` array on the combatant that is NOT cleared at turn end).

**Files:** `app/stores/encounter.ts` (lines 1146-1161), `app/server/api/encounters/[id]/next-turn.post.ts` (line 106)

**HIGH-2: `calculateRunUpBonus`, `calculateOverrunModifiers`, `applyResistStep`, `isAoERange`, and `isConquerorsMarchEligibleRange` are dead code**

These five exported pure functions in `mountingRules.ts` are defined but never imported or called anywhere in the codebase. The functions themselves are correctly implemented, but they have zero integration points:

- `calculateRunUpBonus` -- only used in the MountControls display (`Math.floor(distanceMovedThisTurn.value / 3)` is inlined instead)
- `calculateOverrunModifiers` -- not imported anywhere
- `applyResistStep` -- not imported anywhere
- `isAoERange` -- not imported anywhere
- `isConquerorsMarchEligibleRange` -- not imported anywhere

Per spec-p2.md, these features have automation levels ranging from "damage modifier + prompt" to "trigger detection + prompt." The functions exist to support future wiring into the damage calculation pipeline, but without integration they provide no mechanical benefit. At minimum, the MountControls Run Up bonus display should import and use `calculateRunUpBonus` instead of inlining the formula.

**Files:** `app/utils/mountingRules.ts` (lines 295-396), `app/components/encounter/MountControls.vue` (line 464)

### MEDIUM

**MED-1: Typo in tempCondition string: `'ConquerorsMarsh'` should be `'ConquerorsMarch'`**

The string literal `'ConquerorsMarsh'` is used consistently across 4 locations (encounter store, MountControls), so it doesn't cause a runtime mismatch. However, "Marsh" is not "March" -- this is a misspelling that will confuse anyone reading the code or debugging tempConditions. Fix: rename to `'ConquerorsMarch'` in all 4 locations. Consider extracting to a constant in `trainerClasses.ts` alongside the other Rider constants to prevent future typos.

**Files:** `app/stores/encounter.ts` (lines 1166, 1175, 1176), `app/components/encounter/MountControls.vue` (line 425)

**MED-2: `app-surface.md` not updated with P2 additions**

The checklist requires `app-surface.md` updates when new endpoints, components, routes, or stores are added. P2 added:
- 10 new exported functions to `mountingRules.ts` (hasRiderClass, hasRiderFeature, hasRunUp, isDashOrPassRange, getFeatureUsesRemaining, calculateRunUpBonus, calculateOverrunModifiers, applyResistStep, isAoERange, isConquerorsMarchEligibleRange)
- 2 new exported functions to `mounting.service.ts` (applyRideAsOneEvasion, restoreRideAsOneEvasion)
- 6 new store actions on encounter store (toggleAgilityTraining, activateConquerorsMarch, useSceneFeature, setRideAsOneSwapped, addDistanceMoved)
- New constants in `trainerClasses.ts` (RIDER_FEATURE_NAMES, LEAN_IN_MAX_PER_SCENE, OVERRUN_MAX_PER_SCENE, AGILITY_TRAINING_MOVEMENT_BONUS, AGILITY_TRAINING_INITIATIVE_BONUS, CAVALIERS_REPRISAL_AP_COST)

The current `app-surface.md` only documents the P0 surface. Update the mountingRules, mounting.service, encounter store, and trainerClasses entries.

**Files:** `.claude/skills/references/app-surface.md`

**MED-3: Conqueror's March standard action cost applied via direct mutation in component**

In `MountControls.vue` (lines 538-541), the Conqueror's March handler directly mutates `currentCombatant.value.turnState`:

```typescript
currentCombatant.value.turnState = {
  ...currentCombatant.value.turnState,
  standardActionUsed: true
}
```

The standard action cost should be handled through the encounter store action (like `encounterStore.useAction(combatantId, 'standard')` or as part of `activateConquerorsMarch` itself), not via direct prop mutation in the component. This bypasses the store's single source of truth and does not persist to the server. If the encounter state is reloaded from the server, the standard action cost is lost while the ConquerorsMarsh flag remains.

**Files:** `app/components/encounter/MountControls.vue` (lines 537-542)

## What Looks Good

1. **Ride as One evasion sharing logic is correct.** The `applyRideAsOneEvasion` and `restoreRideAsOneEvasion` functions properly handle the "higher of both / +1 if equal" mechanic, store original values for restoration, and integrate cleanly at mount/dismount/faint boundaries. The immutable array mapping pattern is consistent with the rest of mounting.service.ts.

2. **Cavalier's Reprisal detection is well-placed.** Adding detection in the damage endpoint (where the mount-hit event naturally occurs) is the right integration point. The adjacency check, AP check, and feature check are all correct. The response-based prompt pattern lets the GM decide without forcing automation.

3. **Distance tracking infrastructure is solid.** The `distanceMovedThisTurn` field on TurnState, reset at turn/round start in `turn-helpers.ts`, and incremented in `useEncounterActions.ts` via `addDistanceMoved` is cleanly layered. The PTU diagonal distance function is correctly used for grid-based movement.

4. **Scene-limited feature usage tracking is well-designed.** The `featureUsage` record on Combatant with `{ usedThisScene: number, maxPerScene: number }` pattern is extensible and correctly reset in `next-scene.post.ts`. The `useSceneFeature` store action properly checks remaining uses before incrementing.

5. **Constants are centralized.** `RIDER_FEATURE_NAMES`, `LEAN_IN_MAX_PER_SCENE`, `OVERRUN_MAX_PER_SCENE`, `CAVALIERS_REPRISAL_AP_COST` in `trainerClasses.ts` prevent magic strings/numbers. The Rider feature detection functions in `mountingRules.ts` use case-insensitive matching for robustness.

6. **Commit granularity is appropriate.** 14 commits for 7 features across 13 files, with logical grouping: types first, then service logic, then store actions, then UI, then fixes. Each commit produces a working state.

7. **Decree compliance is maintained.** decree-004 (real HP damage for dismount threshold) continues to work correctly. decree-003 (passable tokens) is unaffected. The Ride as One evasion issue (CRIT-1) is an integration gap, not a decree violation -- decree-040 governs flanking penalty ordering, and Ride as One is a separate evasion-setting mechanic.

8. **MountControls.vue stays under 800 lines (717).** Despite adding substantial P2 UI, the file remains compliant with the size guideline.

## Verdict

**CHANGES_REQUIRED**

The Ride as One evasion sharing (CRIT-1) has zero mechanical effect on accuracy calculations because `calculate-damage.post.ts` recalculates evasion from scratch. This must be wired into the accuracy pipeline for the feature to function as specified. The Agility Training tempCondition issue (HIGH-1) causes the toggle to silently reset each turn, which will confuse the GM. These two issues affect correctness of implemented features.

## Required Changes

1. **CRIT-1:** Wire Ride as One speed evasion into the accuracy calculation in `calculate-damage.post.ts`. When the target is part of a mounted pair with Ride as One active, override the recalculated Speed Evasion with the shared value from `combatant.speedEvasion` (which was set by `applyRideAsOneEvasion`). Alternatively, apply the Ride as One sharing formula inline in the accuracy calc.

2. **HIGH-1:** Move the Agility Training flag from `tempConditions` (cleared at turn end) to a persistent field on `mountState` (e.g., `agilityTrainingActive?: boolean`) or a separate combatant field that is not auto-cleared. Update the toggle action, the UI check, and ensure the field is cleared on dismount.

3. **HIGH-2:** Either wire the dead utility functions (`calculateRunUpBonus`, `calculateOverrunModifiers`, `applyResistStep`, `isAoERange`, `isConquerorsMarchEligibleRange`) into their intended integration points (damage calc, MountControls display), or remove them and file follow-up tickets for integration. At minimum, replace the inlined `Math.floor(distanceMovedThisTurn.value / 3)` in MountControls with an import of `calculateRunUpBonus`.

4. **MED-1:** Rename `'ConquerorsMarsh'` to `'ConquerorsMarch'` in all 4 locations. Extract to a named constant.

5. **MED-2:** Update `app-surface.md` with the new P2 functions, store actions, and constants.

6. **MED-3:** Move the standard action cost for Conqueror's March into the store action `activateConquerorsMarch` or use `encounterStore.useAction()`. Remove the direct mutation from the component.
