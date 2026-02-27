---
ticket_id: refactoring-018
priority: P2
categories:
  - PTU-INCORRECT
affected_files:
  - app/composables/useMoveCalculation.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-17T01:00:00
filed_by: rules-review-015
---

## Summary

Multi-target moves (AoE: Burst, Cone, Blast, Line) roll one d20 per target instead of one d20 per move use. PTU specifies a single accuracy roll per attack, compared against each target's individual threshold. This causes incorrect crit probability and asymmetric hit/miss behavior for same-evasion targets.

## Findings

### Finding 1: PTU-INCORRECT — Per-target accuracy rolls instead of single roll

- **File:** `app/composables/useMoveCalculation.ts:128-158`
- **Code:** `for (const targetId of selectedTargets.value) { const d20Result = roll('1d20') ... }`
- **Rule:** PTU 07-combat.md:735-738 — "Whenever you attempt to make an attack, you must make an Accuracy Roll" (singular per attack). 07-combat.md:749-751 — "An Accuracy Check is the number an Accuracy Roll needs to meet or exceed to hit. It's determined first taking the Move's base AC and adding the target's Evasion."
- **Gameplay example:** 07-combat.md:2211-2218 — Oddish uses Acid (Cone 2) against two targets. One accuracy roll (14), one damage roll (2d6+8), both targets take the same base damage minus their own defense.
- **Bug:** The loop rolls a separate d20 for each target. PTU uses one d20 roll for the move, then compares against each target's AC+evasion threshold independently.
- **Impact:** (1) Crit probability scales with target count — P(at least one nat 20) = `1 - (19/20)^N` instead of flat 5%. For 3 targets: 14.3%. (2) Targets with identical evasion can have different hit/miss outcomes from different rolls, which shouldn't happen in PTU.

### Finding 2: PTU-INCORRECT — `.some()` crit sharing (symptom of Finding 1)

- **File:** `app/composables/useMoveCalculation.ts:320-322`
- **Code:** `hitTargets.value.some(id => accuracyResults.value[id]?.isNat20)`
- **Context:** Introduced in 91e2e0d as part of the refactoring-017 fix. Given the per-target roll architecture (Finding 1), this was a reasonable workaround — it gets the direction right (all hit targets share the crit) but inherits the wrong probability from Finding 1.
- **Fix:** Fixing Finding 1 (single roll) automatically fixes this — there would be one `isNat20` flag for the whole move, not per-target.

## Suggested Fix

Refactor `rollAccuracy` to roll one d20, then compare against each target's threshold:

```typescript
const rollAccuracy = () => {
  if (!move.value.ac) return
  const d20Result = roll('1d20')
  const naturalRoll = d20Result.dice[0]
  const isNat1 = naturalRoll === 1
  const isNat20 = naturalRoll === 20

  const results: Record<string, AccuracyResult> = {}
  for (const targetId of selectedTargets.value) {
    const threshold = getAccuracyThreshold(targetId)
    let hit: boolean
    if (isNat1) { hit = false }
    else if (isNat20) { hit = true }
    else { hit = naturalRoll >= threshold }
    results[targetId] = { targetId, roll: naturalRoll, threshold, hit, isNat1, isNat20 }
  }
  accuracyResults.value = results
  // ...
}
```

The `isCriticalHit` computed can then use any target's `isNat20` (all will be identical) or be simplified to check the single roll directly.

## Impact

Low gameplay impact for single-target moves (most common case — one roll = one target, behavior identical). Affects AoE moves only, where crit probability and hit consistency are wrong. The existing `.some()` workaround partially masks the crit issue but doesn't fix the hit/miss asymmetry.

## Resolution Log

- **Commit:** e12a083 — `fix: use single accuracy roll for multi-target moves per PTU rules`
- **Files changed:** `app/composables/useMoveCalculation.ts`
- **Changes:**
  1. **Finding 1 fix:** Moved `roll('1d20')` outside the per-target loop so one d20 is rolled per move use, then compared against each target's individual AC threshold
  2. **Finding 2 fix:** Simplified `isCriticalHit` computed — instead of `.some()` scanning hit targets, it reads `isNat20` from the first (and now uniform) result
- **AccuracyResult interface:** Unchanged — each target still gets its own record with `roll`, `threshold`, `hit`, `isNat1`, `isNat20`, so UI template in MoveTargetModal.vue is fully compatible
- **Test status:** 507/508 unit tests pass; 1 pre-existing failure in settings store (unrelated)
