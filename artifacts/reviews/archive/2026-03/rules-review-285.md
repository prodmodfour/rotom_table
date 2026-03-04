---
review_id: rules-review-285
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-131
domain: combat
commits_reviewed:
  - 784004b5
  - 67718020
  - 656a2042
  - 23ae58af
  - 557b3164
  - 430857a3
  - e75e1808
mechanics_verified:
  - poke-ball-accuracy-threshold
  - speed-evasion-for-poke-ball
  - accuracy-stages-for-poke-ball
  - natural-1-natural-20-rules
  - flanking-penalty-on-capture
  - rough-terrain-penalty-on-capture
  - server-side-accuracy-validation
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/05-pokemon.md#capturing-pokemon
  - core/09-gear-and-items.md#poke-balls
  - core/07-combat.md#accuracy-and-evasion
  - core/07-combat.md#flanking
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Poke Ball AC 6 Accuracy Check
- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md#1704-1705`); "Throwing Poke Balls is an AC6 Status Attack... Resolve the attack like you would any other." (`core/09-gear-and-items.md#22-25`)
- **Implementation:** `rollAccuracyCheck()` in `useCapture.ts` calls `calculateAccuracyThreshold(6, accuracyStage, speedEvasion)` with base AC of 6, then adjusts for flanking and rough terrain. The hardcoded `roll >= 6` has been replaced with `roll >= threshold`.
- **Status:** CORRECT — Base AC 6 is correctly passed to the central accuracy utility. Per decree-042, the full accuracy system applies.

### Speed Evasion Selection for Poke Ball Throws
- **Rule:** "Speed Evasion may be applied to any Move with an accuracy check" (`core/07-combat.md#641-643`). Poke Balls are Status attacks — they do not target Defense or Special Defense, so Physical and Special Evasion do not apply.
- **Implementation:** `CombatantCaptureSection.vue` line 133 reads `pokemonCombatant.speedEvasion` only. `usePlayerRequestHandlers.ts` line 89 does the same. The `CaptureAccuracyParams` interface defines `targetSpeedEvasion` (not generic evasion).
- **Status:** CORRECT — Per decree-042 ruling: "Speed Evasion is the appropriate evasion type (Poke Balls don't target Defense or Special Defense stats)." Only Speed Evasion is used, matching how the general move accuracy system would apply to a Status attack.

### Thrower Accuracy Stages
- **Rule:** "Accuracy's Combat Stages apply directly; Accuracy at -2 simply modifies all Accuracy Rolls by -2" (`core/07-combat.md#625-629`)
- **Implementation:** `CombatantCaptureSection.vue` lines 120-123 read `getStageModifiers(trainerCombatant.entity).accuracy`. `usePlayerRequestHandlers.ts` lines 83-88 do the same. The value is passed as `throwerAccuracyStage` to `rollAccuracyCheck()`, which feeds it to `calculateAccuracyThreshold(6, accuracyStage, speedEvasion)`. Inside `calculateAccuracyThreshold`, accuracy stages are subtracted directly from the threshold (not multiplied), consistent with PTU's rule that accuracy stages are additive.
- **Status:** CORRECT

### Natural 1 / Natural 20 Rules
- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll" (`core/05-pokemon.md#1710-1711`). General combat: Natural 1 always misses, Natural 20 always hits.
- **Implementation:** `useCapture.ts` lines 294-295: `const hits = isNat1 ? false : (isNat20 ? true : roll >= threshold)`. Server-side `attempt.post.ts` line 65: identical logic. Both correctly implement nat 1 auto-miss, nat 20 auto-hit, and normal rolls compared against threshold.
- **Status:** CORRECT — Natural 20 correctly triggers `criticalHit: true` on line 147 of `attempt.post.ts`, which feeds into the capture roll's -10 modifier via the `attemptCapture` function.

### Flanking Penalty on Poke Ball Throws
- **Rule:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion." (`core/07-combat.md#499`). Per decree-040: flanking penalty applies AFTER the evasion cap of 9.
- **Implementation:** `useCapture.ts` line 288: `const threshold = Math.max(1, baseThreshold - flankingPenalty + roughTerrainPenalty)`. Flanking is subtracted from the threshold (reducing it = easier to hit), which is correct. However, see HIGH-1 for an issue with the order of operations relative to `calculateAccuracyThreshold`'s internal clamping.
- **Status:** NEEDS REVIEW — See HIGH-1.

### Rough Terrain Penalty on Poke Ball Throws
- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls" (`core/07-combat.md`, PTU p.231). Per decree-025: only intervening terrain counts, endpoints excluded.
- **Implementation:** `roughTerrainPenalty` is accepted in `CaptureAccuracyParams` and added to threshold on line 288 of `useCapture.ts`. Currently defaults to 0 because VTT grid context is not available in the capture UI (noted in comments at `CombatantCaptureSection.vue` lines 139-141). This is acceptable for the current scope — the parameter is wired through and ready for future VTT integration.
- **Status:** CORRECT (for current scope) — Rough terrain defaults to 0 with a clear comment about future VTT integration. The parameter plumbing is correct.

### Server-Side Accuracy Validation
- **Rule:** Per decree-042, the server should validate the accuracy check.
- **Implementation:** `attempt.post.ts` lines 42-75 accept an optional `accuracyThreshold` parameter. When provided, the server validates `roll >= threshold`. When omitted, falls back to threshold 6 (base Poke Ball AC) for backwards compatibility. Input validation rejects non-integer, non-positive threshold values.
- **Status:** CORRECT — The server properly validates the client-computed threshold. Backward compatibility is preserved. The server does NOT recompute the threshold independently (it trusts the client value), which is acceptable given the GM-controlled context of this application.

## Summary

The implementation correctly replaces the hardcoded `roll >= 6` check with the full accuracy system per decree-042. The core mechanics are sound: AC 6 base, Speed Evasion for Poke Ball throws, accuracy stages applied additively, natural 1/20 handling, flanking and rough terrain parameter plumbing. The `calculateAccuracyThreshold` utility is correctly reused from `damageCalculation.ts`.

One high-severity issue was found: the flanking/rough-terrain adjustment in `useCapture.ts` is applied OUTSIDE `calculateAccuracyThreshold`, which creates a double-clamping inconsistency with the move accuracy calculation in `useMoveCalculation.ts`. One medium-severity issue was found: the `CaptureAccuracyParams` interface allows `targetSpeedEvasion` values above 6, but the evasion system caps stat-derived evasion at 6 (before bonus evasion from moves/effects). This is not a bug in the current code (the cap is enforced inside `calculateAccuracyThreshold` via `Math.min(9, ...)`), but the interface documentation could clarify the expected range.

## Rulings

**R1 (HIGH-1): Double-clamping in threshold calculation produces different results than the move accuracy system in edge cases.**

In `useMoveCalculation.ts` line 404, the move accuracy threshold is computed as a single expression:
```
Math.max(1, moveAC + effectiveEvasion - accuracy - flankingPenalty + roughPenalty)
```

In `useCapture.ts` lines 287-288, the capture accuracy threshold is:
```
const baseThreshold = calculateAccuracyThreshold(6, accuracyStage, speedEvasion)
const threshold = Math.max(1, baseThreshold - flankingPenalty + roughTerrainPenalty)
```

`calculateAccuracyThreshold` applies `Math.max(1, ...)` internally (line 124 of `damageCalculation.ts`). This means the capture code applies `Math.max(1, ...)` twice — once inside the utility, once outside. When the base expression `(AC + evasion - accuracy)` would go below 1, the inner clamp raises it to 1 before rough terrain penalty is added, inflating the final threshold.

**Concrete example:** Trainer has +6 accuracy stage, target has 0 Speed Evasion, rough terrain penalty is 2.
- Move system: `max(1, 6 + 0 - 6 - 0 + 2) = max(1, 2) = 2`
- Capture system: `calculateAccuracyThreshold(6, 6, 0)` = `max(1, 6 + 0 - 6)` = `max(1, 0)` = **1**, then `max(1, 1 - 0 + 2)` = **3**

The capture system gives threshold 3, the move system gives threshold 2. The capture code is harder to hit in this edge case.

**Fix:** Compute the threshold in one step, matching the move system's formula:
```typescript
const effectiveEvasion = Math.min(9, speedEvasion)
const threshold = Math.max(1, 6 + effectiveEvasion - accuracyStage - flankingPenalty + roughTerrainPenalty)
```

Or, if preserving the `calculateAccuracyThreshold` call is preferred, call it without flanking/rough terrain, then adjust — but remove the inner `Math.max(1, ...)` for this use case by using the raw formula directly. The key requirement is that `Math.max(1, ...)` is applied exactly once, as the final step, after all modifiers are combined.

Note: This edge case only manifests when `(AC + evasion - accuracy) < 1` AND `roughTerrainPenalty > 0`, which requires a very high accuracy stage with minimal evasion while targeting through rough terrain. It is unlikely but not impossible in gameplay.

**R2 (MED-1): `CaptureAccuracyParams.targetSpeedEvasion` documentation says "0-6+" but should clarify it includes bonus evasion.**

The interface at `useCapture.ts` line 49 documents `targetSpeedEvasion` as "(0-6+)". The `+` is technically correct because bonus evasion from moves/effects can push the value above 6 (up to 12 theoretically: 6 from stats + 6 from bonus). However, the current data source (`pokemonCombatant.speedEvasion` on the Combatant type) is the pre-computed evasion value that already includes combat stage modifications. It would be clearer to document this as "total Speed Evasion (stat-derived + bonus; capped at 9 inside calculateAccuracyThreshold)".

This is a documentation clarity issue, not a calculation error — `calculateAccuracyThreshold` correctly applies `Math.min(9, defenderEvasion)` internally.

## Verdict

**CHANGES_REQUIRED**

HIGH-1 must be fixed before approval. The double-clamping inconsistency means Poke Ball throws and Move accuracy checks produce different thresholds under the same combat conditions, violating decree-042's mandate that Poke Ball throws "Resolve the attack like you would any other." The fix is a one-line change in `useCapture.ts`.

MED-1 is a documentation improvement that can be addressed in the same commit or deferred.

## Required Changes

1. **HIGH-1 (useCapture.ts:287-288):** Replace the two-step threshold calculation with a single-step formula that applies `Math.max(1, ...)` once after all modifiers, matching the move accuracy system in `useMoveCalculation.ts:404`. See R1 for the specific fix.
2. **MED-1 (useCapture.ts:49):** Clarify the `targetSpeedEvasion` doc comment to indicate it is total Speed Evasion (stat-derived + bonus) and that the internal evasion cap of 9 is applied by `calculateAccuracyThreshold`.
