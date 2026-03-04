---
review_id: rules-review-288
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-131
domain: capture
commits_reviewed:
  - 8e5d7212
  - cba0dd2d
  - c9a8e3b4
  - 557b3164
  - 67718020
  - 784004b5
mechanics_verified:
  - poke-ball-accuracy-threshold
  - speed-evasion-for-poke-ball
  - accuracy-stages-for-poke-ball
  - natural-1-natural-20-rules
  - flanking-penalty-on-capture
  - rough-terrain-penalty-on-capture
  - server-side-accuracy-validation
  - evasion-cap-at-9
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#1704-1705
  - core/05-pokemon.md#1710-1711
  - core/09-gear-and-items.md#22-25
  - core/07-combat.md#624-629
  - core/07-combat.md#641-643
  - core/07-combat.md#656-657
  - core/07-combat.md#498-499
reviewed_at: 2026-03-04T09:15:00Z
follows_up: rules-review-285
---

## Mechanics Verified

### Poke Ball AC 6 Accuracy Check
- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#1704-1705`); "Resolve the attack like you would any other." (`core/09-gear-and-items.md#22-25`)
- **Implementation:** `rollAccuracyCheck()` in `useCapture.ts` (line 293) computes the threshold with base AC = 6 in a single-expression formula: `Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)`. The hardcoded `roll >= 6` from the original code has been fully replaced. Per decree-042, the full accuracy system applies.
- **Status:** CORRECT

### Speed Evasion Selection for Poke Ball Throws
- **Rule:** "Speed Evasion may be applied to any Move with an accuracy check" (`core/07-combat.md#641-643`). Poke Balls are Status attacks -- they do not target Defense or Special Defense, so Physical and Special Evasion do not apply.
- **Implementation:** `CombatantCaptureSection.vue` (line 133) reads `pokemonCombatant.speedEvasion` only. `usePlayerRequestHandlers.ts` (line 89) reads `pokemonCombatant?.speedEvasion` identically. The `CaptureAccuracyParams` interface defines `targetSpeedEvasion` with updated documentation: "Target Pokemon's total Speed Evasion (stat-derived + bonus evasion). Capped at 9 inside rollAccuracyCheck per PTU p.234."
- **Status:** CORRECT -- Only Speed Evasion is used, matching how the general move accuracy system would apply to a Status attack. The documentation now correctly indicates the value is total Speed Evasion and that the cap is enforced internally.

### Thrower Accuracy Stages
- **Rule:** "Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2" (`core/07-combat.md#625-629`)
- **Implementation:** `CombatantCaptureSection.vue` (lines 119-123) reads `getStageModifiers(trainerCombatant.entity).accuracy`. `usePlayerRequestHandlers.ts` (lines 83-88) does the same. The value is passed as `throwerAccuracyStage` through to `rollAccuracyCheck()`, where it is subtracted directly from the threshold expression (not multiplied), consistent with PTU's additive accuracy stage rule.
- **Status:** CORRECT

### Natural 1 / Natural 20 Rules
- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll" (`core/05-pokemon.md#1710-1711`). General combat: Natural 1 always misses, Natural 20 always hits.
- **Implementation:** `useCapture.ts` (line 300): `const hits = isNat1 ? false : (isNat20 ? true : roll >= threshold)`. Server-side `attempt.post.ts` (line 69): identical logic. Both correctly implement nat 1 auto-miss, nat 20 auto-hit, and normal rolls compared against threshold. Natural 20 triggers `criticalHit: true` on line 151 of `attempt.post.ts`, which feeds into the capture roll's -10 modifier.
- **Status:** CORRECT

### Evasion Cap at 9
- **Rule:** "No matter from which sources you receive Evasion, you may only raise a Move's Accuracy Check by a max of +9." (`core/07-combat.md#656-657`)
- **Implementation:** `useCapture.ts` (line 292): `const effectiveEvasion = Math.min(9, speedEvasion)`. This matches `useMoveCalculation.ts` (line 435): `const effectiveEvasion = Math.min(9, evasion)`. Both enforce the +9 cap identically.
- **Status:** CORRECT

### Flanking Penalty on Poke Ball Throws
- **Rule:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion." (`core/07-combat.md#498-499`). Per decree-040: flanking penalty applies AFTER the evasion cap of 9.
- **Implementation:** `useCapture.ts` (line 293): `Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)`. In this formula, `effectiveEvasion` is already capped at 9, and `flankingPenalty` is subtracted from the combined expression afterward. This means flanking reduces the threshold after the evasion cap is applied -- exactly matching `useMoveCalculation.ts` (line 443): `Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)`. Both formulas apply flanking post-cap per decree-040.
- **Status:** CORRECT -- The previous double-clamping issue (rules-review-285 HIGH-1) has been eliminated. Flanking now defaults to 0 with a comment noting VTT grid context is not available in the current capture UI. The parameter plumbing is correct and ready for future VTT integration.

### Rough Terrain Penalty on Poke Ball Throws
- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls" (PTU p.231). Per decree-025: only intervening terrain counts, endpoints excluded.
- **Implementation:** `roughTerrainPenalty` is accepted in `CaptureAccuracyParams` and added to the threshold in the single-expression formula on line 293 of `useCapture.ts`. Currently defaults to 0 because VTT grid context is not available in the capture UI (noted in comments at `CombatantCaptureSection.vue` lines 139-141).
- **Status:** CORRECT (for current scope) -- Parameter plumbing is correct. Ready for future VTT integration.

### Server-Side Accuracy Validation
- **Rule:** Per decree-042, the server should validate the accuracy check.
- **Implementation:** `attempt.post.ts` (lines 42-79) accepts an optional `accuracyThreshold` parameter. When provided, the server validates `roll >= threshold`. When omitted, falls back to threshold 6 (base Poke Ball AC) for backwards compatibility. Input validation rejects non-integer, non-positive threshold values. A rationale comment (lines 54-57) documents why server-side recomputation is not feasible and why client trust is acceptable in a single-user GM tool.
- **Status:** CORRECT

## Previous Issue Resolution

### rules-review-285 HIGH-1: Double-clamping inconsistency -- RESOLVED

The original code called `calculateAccuracyThreshold(6, accuracyStage, speedEvasion)` which clamped to `Math.max(1, ...)` internally, then applied flanking/rough terrain and clamped again with a second `Math.max(1, ...)`. This produced divergent results from the move system.

**Fix verified:** Commit `c9a8e3b4` replaced the two-step calculation with a single-expression formula:
```typescript
const effectiveEvasion = Math.min(9, speedEvasion)
const threshold = Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)
```

This is structurally identical to `useMoveCalculation.ts:443`:
```typescript
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

The `calculateAccuracyThreshold` import was removed and replaced with a clear comment explaining why the inline formula is used. `Math.max(1, ...)` is now applied exactly once, as the outermost operation, after all modifiers are combined. The concrete failing scenario from the previous review (AC=6, accuracy=6, evasion=0, rough=2 giving threshold 3 instead of 2) now produces the correct result: `Math.max(1, 6 + 0 - 6 - 0 + 2) = Math.max(1, 2) = 2`.

### rules-review-285 MED-1: targetSpeedEvasion documentation -- RESOLVED

Commit `8e5d7212` updated the doc comment from `"(0-6+)"` to `"Target Pokemon's total Speed Evasion (stat-derived + bonus evasion). Capped at 9 inside rollAccuracyCheck per PTU p.234."` This clarifies both the expected input range and where the cap is enforced.

## Decree Compliance

### decree-042: Apply full accuracy system to Poke Ball throws -- COMPLIANT

The implementation correctly applies all four components mandated by decree-042:
1. **Thrower accuracy stages**: Subtracted from threshold (lines 283, 293 of `useCapture.ts`)
2. **Target Speed Evasion**: Added to threshold, capped at 9 (lines 284, 292-293)
3. **Flanking penalty**: Subtracted from threshold after evasion cap (line 293)
4. **Rough terrain penalty**: Added to threshold (line 293)

The formula matches the move accuracy system exactly, fulfilling decree-042's mandate: "Resolve the attack like you would any other."

### decree-040: Flanking after evasion cap -- COMPLIANT

Flanking is subtracted from the combined expression after `effectiveEvasion = Math.min(9, speedEvasion)`. The cap is applied first, flanking is applied second. Both capture and move systems use the same ordering.

### decree-013: Core 1d100 capture system -- NOT AFFECTED

The accuracy check changes do not touch the 1d100 capture roll system. The capture rate calculation and roll mechanics remain unchanged.

## Summary

All five fix-cycle commits correctly resolve the issues identified in rules-review-285. The double-clamping bug (HIGH-1) has been eliminated by replacing the two-step `calculateAccuracyThreshold` + second `Math.max` with a single-expression formula that matches `useMoveCalculation.ts:443` exactly. The `targetSpeedEvasion` documentation (MED-1) has been clarified to indicate total evasion with an internal cap of 9. No new PTU rules issues were introduced by the fix cycle.

The Poke Ball accuracy system now produces identical thresholds to the move accuracy system under all modifier combinations, including the edge case where high accuracy stages would drive the base expression below 1.

## Rulings

No new rulings required. All previously identified issues have been resolved correctly.

## Verdict

**APPROVED**

All mechanics are correctly implemented per PTU 1.05 rules and applicable decrees (decree-042, decree-040, decree-013). The fix cycle resolves both issues from rules-review-285 without introducing regressions. The capture accuracy system is now formula-identical to the move accuracy system.

## Required Changes

None.
