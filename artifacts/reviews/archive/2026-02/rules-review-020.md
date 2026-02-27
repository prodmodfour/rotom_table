---
review_id: rules-review-020
target: refactoring-018
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-17
trigger: refactoring-review
commits_reviewed:
  - e12a083
files_reviewed:
  - app/composables/useMoveCalculation.ts
mechanics_verified: 6
mechanics_correct: 6
mechanics_incorrect: 0
ptu_references:
  - 07-combat.md:735-738 (accuracy roll — singular per attack)
  - 07-combat.md:746-748 (nat 1 always miss, nat 20 always hit)
  - 07-combat.md:749-755 (accuracy check — base AC + target evasion)
  - 07-combat.md:800-804 (critical hit on nat 20)
  - 07-combat.md:2206-2218 (gameplay example — Acid Cone 2, single roll for AoE)
  - 07-combat.md:654-657 (evasion cap +9 on accuracy check)
---

## PTU Rules Verification Report

### Scope

- [x] Single accuracy roll per move use (Finding 1 fix)
- [x] Per-target threshold comparison from shared roll
- [x] Natural 1/20 handling with shared roll
- [x] Critical hit determination from shared roll (Finding 2 fix)
- [x] Gameplay example consistency (AoE move with multiple targets)
- [x] Edge cases (empty targets, single target, mixed evasions)

### Mechanics Verified

#### 1. Single Accuracy Roll per Move Use

- **Rule:** PTU 07-combat.md:735-738 — "Whenever you attempt to make an attack, you must make **an** Accuracy Roll, and to hit, this roll must meet or exceed the Accuracy Check. An Accuracy Roll is always simply 1d20..."
- **Implementation:** `useMoveCalculation.ts:131-135` — `roll('1d20')` called once, before the per-target loop. `naturalRoll`, `isNat1`, `isNat20` computed once from the single result.
- **Previous behavior:** `roll('1d20')` was called inside the loop, producing a separate d20 per target.
- **Status:** CORRECT
- **Severity:** N/A

#### 2. Per-Target Threshold Comparison

- **Rule:** PTU 07-combat.md:749-751 — "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion."
- **Implementation:** `useMoveCalculation.ts:139-158` — Loop iterates over `selectedTargets`, calls `getAccuracyThreshold(targetId)` for each target (which computes `baseAC + min(9, evasion) - accuracyStage`), then compares the shared `naturalRoll` against each target's individual threshold.
- **Verification:** One roll, different thresholds. Targets with different evasion values can have different hit/miss outcomes from the same roll. This is exactly the PTU model.
- **Status:** CORRECT
- **Severity:** N/A

#### 3. Natural 1 Always Misses

- **Rule:** PTU 07-combat.md:746-747 — "Note that a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit."
- **Implementation:** `useMoveCalculation.ts:143` — `if (isNat1) { hit = false }` checked first, before threshold comparison. Applied identically to all targets since `isNat1` is computed from the shared roll.
- **Status:** CORRECT
- **Severity:** N/A

#### 4. Natural 20 Always Hits

- **Rule:** PTU 07-combat.md:747-748 — "Similarly, a roll of 20 is always a hit."
- **Implementation:** `useMoveCalculation.ts:145-146` — `else if (isNat20) { hit = true }` checked second. All targets are hit on nat 20. No target can miss when the shared roll is 20.
- **Status:** CORRECT
- **Severity:** N/A

#### 5. Critical Hit on Natural 20 (Shared Across All Targets)

- **Rule:** PTU 07-combat.md:800 — "On an Accuracy Roll of 20, a damaging attack is a Critical Hit."
- **Implementation:** `useMoveCalculation.ts:321-324` — `Object.values(accuracyResults.value)[0]?.isNat20 ?? false`. Since all results share the same `isNat20` from the single roll, checking any one result is equivalent to checking all.
- **Previous behavior:** `.some(id => accuracyResults.value[id]?.isNat20)` scanned only hit targets. With per-target rolls, this inflated crit probability to `1 - (19/20)^N`. With the single roll, the `.some()` was functionally correct but unnecessarily complex.
- **Edge case (empty results):** `Object.values({})` → `[]`, `[0]` → `undefined`, `?.isNat20 ?? false` → `false`. No false positive.
- **Status:** CORRECT
- **Severity:** N/A

#### 6. Gameplay Example Consistency (Acid Cone 2)

- **Rule:** PTU 07-combat.md:2206-2218 — Two Oddish each use Acid (Cone 2). Oddish #2 rolls 14, hitting both Sylvana and Archie. One damage roll (2d6+8 → [3,3]+14 SpAtk = 28). Both targets take 23 after subtracting 5 SpDef each.
- **Model demonstrated:** One attacker using an AoE move → one accuracy roll → compared against both targets → one damage roll → per-target defense subtracted.
- **Implementation match:** `rollAccuracy` rolls once and compares per-target. `rollDamage` rolls once and `targetDamageCalcs` applies per-target defense. This is consistent with the gameplay example.
- **Status:** CORRECT
- **Severity:** N/A

### Edge Case Analysis

| Scenario | Expected | Implementation | Correct |
|----------|----------|---------------|---------|
| No targets selected | No roll needed | `selectedTargets.value` is empty → loop doesn't execute → results empty | Yes |
| Single target | Identical to pre-fix | One roll, one threshold, one result | Yes |
| Nat 20 + mixed evasions | All hit, all crit | `isNat20` → all `hit = true`, `isCriticalHit = true` | Yes |
| Nat 1 + mixed evasions | All miss, no crit | `isNat1` → all `hit = false`, `isCriticalHit = false` | Yes |
| Roll 12, thresholds 8 and 15 | First hit, second miss | `12 >= 8` → hit, `12 >= 15` → miss. Same roll, different outcomes from evasion. | Yes |
| Move with no AC | Skip accuracy | `if (!move.value.ac) return` early exit. `hitTargets` returns all selected. | Yes |

### Errata Check

`books/markdown/errata-2.md` searched for "accuracy," "multi-target," "AoE," and "cone." **No errata corrections** apply to accuracy roll mechanics or multi-target move handling.

### Pre-Existing Check: Negative Evasion Floor

Investigated whether negative evasion could reduce the accuracy threshold below base AC (PTU 07-combat.md:654-655 prohibits this). **Not an issue** — the `calculateEvasion` function in both `useCombat.ts:56` and `damageCalculation.ts:95` already applies `Math.max(0, statEvasion + evasionBonus)`, flooring the returned value at 0. Since `getTargetEvasion` calls `calculatePhysicalEvasion`/`calculateSpecialEvasion` → `calculateEvasion`, the evasion passed to `getAccuracyThreshold` is always >= 0. No ticket needed.

### Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

### Verdict: APPROVED

The fix correctly implements PTU's single-accuracy-roll-per-attack model. One d20 is rolled per move use (line 132), then compared against each target's individual AC threshold (lines 139-158). Natural 1/20 handling and critical hit detection are correct for the shared roll. The `isCriticalHit` simplification from `.some()` to first-result check is safe because all results now share identical `isNat20` values. The implementation is consistent with PTU 07-combat.md's rules text and the Acid Cone 2 gameplay example. No PTU incorrectness found in the reviewed commit.
