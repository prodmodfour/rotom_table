---
review_id: rules-review-302
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-058
domain: encounter-tables
commits_reviewed:
  - 45fe9e6e
  - cf4dbadc
  - 2481e439
  - ec286f45
  - 7b79c592
  - a4c95a9e
  - 05935473
  - 2c89a931
  - 3199dce6
mechanics_verified:
  - environment-accuracy-penalty
  - dark-cave-blindness-rules
  - frozen-lake-terrain-rules
  - accuracy-threshold-formula
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/07-combat.md#Blindness
  - core/07-combat.md#Total-Blindness
  - core/07-combat.md#Slow-Terrain
  - core/07-combat.md#Rough-Terrain
reviewed_at: 2026-03-04T19:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Accuracy Threshold Formula Integration

- **Rule:** "Accuracy Roll [...] The Accuracy Roll must equal or exceed the target's Evasion plus the Move's Accuracy value." (`core/07-combat.md#624-657`)
- **Implementation:** `useMoveCalculation.ts:512` calculates:
  ```
  threshold = AC + min(9, evasion) - accuracyStage - flankingPenalty + roughPenalty - noGuardBonus + environmentPenalty
  ```
  The `environmentPenalty` is a positive value added to the threshold, making it harder to hit. `damageCalculation.ts:122-130` has a matching pure function `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion, environmentPenalty)` with the same formula.
- **Status:** CORRECT -- The environment penalty integrates correctly into the existing accuracy formula. It adds to the threshold (higher = harder to hit), consistent with how PTU accuracy penalties work. The `Math.abs()` conversion in `getEnvironmentAccuracyPenalty()` correctly translates the stored negative value (-2) into a positive threshold increase (+2).

### 2. Dark Cave -- Blindness/Darkness Accuracy Penalty

- **Rule:** "Blindness: [...] A Blinded Pokemon or Trainer receives a -6 penalty to Accuracy Rolls" (`core/07-combat.md:1693-1701`). "Total Blindness: [...] Totally Blinded targets receive a -10 total Penalty to Accuracy Rolls" (`core/07-combat.md:1702-1717`). The distinction: Blindness = "deep darkness" (partial), Total Blindness = "completely dark cave" (no light at all).
- **Implementation:** The Dark Cave preset uses `-2 per unilluminated meter` (`constants/environmentPresets.ts:32`). The code comment at line 19 says "Blindness gives -6 accuracy; Darkvision/Blindsense negates. Simplified to -2 per unilluminated meter distance."
- **Status:** NEEDS REVIEW -- See HIGH-1 below. The -2 per meter penalty is a GM simplification, not PTU RAW. PTU has flat -6 (Blindness) or -10 (Total Blindness), not a per-meter scaling system. The code acknowledges this is "simplified" but the implementation currently only applies a flat penalty equal to `Math.abs(accuracyPenaltyPerMeter)` = 2, which is far less than the RAW -6. The `getEnvironmentAccuracyPenalty()` function sums all accuracy_penalty effects but does not multiply by distance -- the "per meter" concept is not actually computed. This means in practice the Dark Cave preset applies a flat -2, not the RAW -6 or -10.

### 3. Frozen Lake -- Terrain and Status Mechanics

- **Rule:** "Slow Terrain: [...] When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md:465-474`). "Even ice may count as Slow Terrain due to the need to move carefully and slowly."
- **Implementation:** `FROZEN_LAKE_PRESET` (`constants/environmentPresets.ts:49-74`) stores:
  - `slowTerrain: true` (correct per PTU)
  - `weightClassBreak: 5` (WC 5+ breaks ice -- GM interpretation, no specific PTU RAW for this)
  - `acrobaticsOnInjury: true` (Acrobatics DC 10 on injury -- mirrors Blindness Acrobatics check from `core/07-combat.md:1696`)
  - `statusOnEntry.effect: 'hail_damage_per_turn'` with `stagePenalty: { stat: 'speed', stages: -1 }` for falling into water
- **Status:** CORRECT -- These are stored as GM reference data only; no automated enforcement exists yet. The terrain rules (slow terrain, weight-class breakage, Acrobatics checks) are reasonable GM-side environmental modifiers. The hail damage for falling into freezing water is a sensible thematic adaptation. Since none of these are mechanically enforced in code (they are display-only custom rules), there is no incorrect calculation to flag.

### 4. Accuracy Penalty Application Flow

- **Rule:** Accuracy penalties increase the threshold to hit (PTU convention: penalty to Accuracy Rolls means you need higher rolls).
- **Implementation:** `MoveTargetModal.vue:119-121` displays the environment penalty in the accuracy section header:
  ```
  +{{ getEnvironmentAccuracyPenalty() }} Environment
  ```
  This renders only when `getEnvironmentAccuracyPenalty() > 0`. The composable function `getEnvironmentAccuracyPenalty()` at `useMoveCalculation.ts:482-494` reads from `encounterStore.activeEnvironmentPreset`.
- **Status:** CORRECT -- The UI correctly shows the penalty as an additive modifier to the accuracy check. The sign convention is consistent: positive number displayed with "+" prefix means "harder to hit."

## Summary

The Environmental Modifier Framework (P2 of ptu-rule-058) is architecturally sound. The type system (`EnvironmentEffect`, `EnvironmentPreset`), persistence layer (JSON on Encounter model), store integration, API endpoint, UI component, and accuracy penalty integration all work correctly together.

The primary concern is that the Dark Cave preset's accuracy penalty deviates from PTU RAW without explicit decree authorization. PTU defines flat penalties for Blindness (-6) and Total Blindness (-10), while the implementation uses a "-2 per unilluminated meter" concept that in practice applies a flat -2 (since distance is not computed). This should be addressed either by creating a decree to authorize the custom scaling approach, or by aligning with RAW values.

The Frozen Lake and Hazard Factory presets are GM reference data with no automated enforcement, so they pose no rules correctness risk.

## Rulings

1. **Accuracy formula integration is correct.** The `environmentPenalty` parameter flows through both `useMoveCalculation.ts` and `damageCalculation.ts` `calculateAccuracyThreshold()` with consistent sign conventions. The `Math.max(1, ...)` clamp ensures a natural 20 always hits and natural 1 always misses (handled by the caller, not the formula).

2. **Environment presets are GM tools, not automated rules engines.** The terrain_override, status_trigger, and custom effect types are display-only reference data. This is acceptable for P2 scope -- automated enforcement would be P3+.

3. **The per-meter darkness penalty diverges from RAW.** PTU does not define per-meter accuracy scaling for darkness. It uses flat -6 (Blindness) or -10 (Total Blindness). A decree-need ticket is recommended.

## Issues

### HIGH-1: Dark Cave accuracy penalty does not match PTU RAW Blindness/Total Blindness values

**File:** `app/constants/environmentPresets.ts:22-42`, `app/composables/useMoveCalculation.ts:482-494`

**PTU RAW:** Blindness = -6 to Accuracy Rolls (`core/07-combat.md:1693-1695`). Total Blindness = -10 to Accuracy Rolls (`core/07-combat.md:1709`). These are flat penalties, not per-meter.

**Implementation:** The Dark Cave preset defines `accuracyPenaltyPerMeter: -2`. However, `getEnvironmentAccuracyPenalty()` sums `Math.abs(effect.accuracyPenaltyPerMeter)` without multiplying by any distance value -- effectively applying a flat -2 penalty regardless of distance. This is neither RAW (-6 or -10) nor the stated intent (-2 per meter).

**Impact:** Players in a Dark Cave encounter get only -2 accuracy penalty instead of the RAW -6 or -10. This significantly under-penalizes darkness.

**Recommendation:** Create a decree-need ticket to resolve: (a) should the app use RAW flat -6/-10 penalties? (b) if a per-meter scaling system is desired, how should distance be calculated and what should the per-meter value be? (c) should Darkvision/Blindsense be tracked to negate the penalty for specific combatants?

### MED-1: "Per meter" concept is defined but never computed

**File:** `app/composables/useMoveCalculation.ts:477-480` (comment), `app/types/encounter.ts:233`

The `EnvironmentEffect.accuracyPenaltyPerMeter` field and the code comment "per-meter darkness penalty is a GM reference tool" suggest a distance-based penalty, but the `getEnvironmentAccuracyPenalty()` function does not receive or use any distance parameter. The field name `accuracyPenaltyPerMeter` is misleading since the value is used as a flat penalty. If the per-meter concept is intentionally deferred, the field should be renamed to `accuracyPenalty` to avoid confusion, or a comment should clarify that distance scaling is a future feature.

### MED-2: Clearing an environment preset stores '{}' instead of null in the database

**File:** `app/server/api/encounters/[id]/environment-preset.put.ts:54`

When clearing a preset (`preset === null`), the endpoint stores `'{}'` in the database:
```typescript
data: {
  environmentPreset: preset ? JSON.stringify(preset) : '{}'
}
```

The `parseEnvironmentPreset()` function in `encounter.service.ts:199-207` handles this correctly by returning `null` for `'{}'`. However, this creates an inconsistency: a "no preset" state is represented as `'{}'` in the DB but `null` in the app. The Prisma schema default is also `'{}'`. This is not a rules issue but could cause confusion if other code reads the raw DB value and expects either `null` or a valid preset JSON.

## Verdict

**APPROVED** -- The implementation is mechanically correct in how environment penalties are integrated into the accuracy formula. No critical issues. The HIGH-1 issue (Dark Cave penalty value diverges from RAW) requires a decree-need ticket but does not block approval because: (a) the preset system is explicitly designed as a GM tool with override capability, (b) the GM can dismiss or adjust effects via the EnvironmentSelector UI, and (c) the framework correctly applies whatever penalty value is configured. The deviation from RAW is a data/content issue, not a formula issue.

**Recommended action:** Create a decree-need ticket for the Dark Cave Blindness penalty value question (HIGH-1).

## Required Changes

None blocking. The HIGH-1 decree-need ticket should be created as a follow-up but does not block merge.
