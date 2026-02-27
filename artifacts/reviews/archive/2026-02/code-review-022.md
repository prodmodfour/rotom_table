---
review_id: code-review-022
target: refactoring-018
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-17
commits_reviewed:
  - e12a083
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/AccuracySection.vue
  - app/components/encounter/MoveTargetModal.vue
  - app/tests/e2e/artifacts/loops/combat.md
scenarios_to_rerun: []
---

## Summary

Single-file fix to `useMoveCalculation.ts` — moves `roll('1d20')` outside the per-target loop so one accuracy roll is shared across all targets. `isCriticalHit` simplified from `.some()` scan to reading any result's `isNat20` (now uniform). Clean, minimal, correct.

## Status Table

| Task | Status |
|------|--------|
| Finding 1: Single d20 roll per move use | DONE (e12a083) |
| Finding 2: Simplify `isCriticalHit` | DONE (e12a083) |
| AccuracyResult interface backward-compatible | VERIFIED |
| UI (MoveTargetModal.vue) compatible | VERIFIED |
| Resolution log updated | VERIFIED |
| Unit tests passing (507/508, 1 pre-existing) | VERIFIED |

## Code Verification

**rollAccuracy (lines 128-165):**
- `roll('1d20')` called once, before the loop — correct
- `naturalRoll`, `isNat1`, `isNat20` computed once from the single roll — correct
- Per-target loop still computes individual `threshold` via `getAccuracyThreshold(targetId)` and individual `hit` via comparison — correct per PTU (one roll, different thresholds)
- Nat 1/20 override logic preserved — correct
- Each `AccuracyResult` record stores the shared `roll` value — UI displays "d20: 14 vs 8 HIT" / "d20: 14 vs 16 MISS" which is exactly how PTU multi-target works

**isCriticalHit (lines 321-325):**
- `Object.values(accuracyResults.value)[0]?.isNat20 ?? false`
- Safe when empty: `Object.values({})` → `[]`, `[0]` → `undefined`, `undefined?.isNat20 ?? false` → `false`. No false positives.
- Correct because all results now share the same `isNat20` value — checking any one is equivalent to checking all
- Previously `.some()` only checked `hitTargets` — but with a single roll, nat 20 means all targets are hit anyway, so the logic is equivalent

**MoveTargetModal.vue (lines 69-82):**
- Template reads `accuracyResults[target.id].roll`, `.threshold`, `.hit`, `.isNat20`, `.isNat1` — all still populated per-target with correct values
- No template changes needed — backward compatible

## Issues

### HIGH #1 — Combat loop doc describes old per-target behavior

**File:** `app/tests/e2e/artifacts/loops/combat.md`
**Lines:** 1006, 1017, 1022

The multi-target sub-loop documentation says:
- Line 1006: `System rolls accuracy **separately for each target** (individual d20 rolls)`
- Line 1017: `**Individual Accuracy**: Each target gets its own accuracy check`
- Line 1022: `One accuracy roll per target (some may hit, some may miss)`

These describe the **old** (buggy) behavior. After this fix, the app rolls one d20 per move use and compares against each target's individual threshold. Targets can still have different hit/miss outcomes (different evasions → different thresholds), but from a single roll.

**Required update:**
- Line 1006: `System rolls accuracy **once** for the move (single d20 roll)`
- Line 1017: `**Single Accuracy Roll**: One d20 compared against each target's individual threshold`
- Line 1022: `One accuracy roll for the move, compared per-target (some may hit, some may miss based on individual evasion)`

### NEW TICKET — Orphaned AccuracySection.vue (filed as refactoring-021)

**File:** `app/components/encounter/AccuracySection.vue`

This component is dead code:
- Never referenced anywhere in the codebase (confirmed via grep for both PascalCase and kebab-case)
- `MoveTargetModal.vue` has its own inline accuracy section with matching `.accuracy-section` CSS classes — it does NOT use this component
- Contains a **duplicate** `AccuracyResult` interface (identical to `useMoveCalculation.ts:14-21`)
- Contains its own `rollAccuracy` with the **old per-target roll bug** that this commit just fixed in the composable

Should be deleted. Filed as refactoring-021.

## What Looks Good

- Minimal diff (9 insertions, 6 deletions) — exactly the right scope
- The `AccuracyResult` interface was left unchanged, preserving full backward compatibility with the UI template
- Commit message is excellent — explains the PTU rule, the bug, and the consequences
- Resolution log in the ticket is thorough

## Recommended Next Steps

1. Update combat loop doc (3 lines of prose) per HIGH #1
2. Route to Game Logic Reviewer for PTU rule verification
3. Refactoring-021 (dead AccuracySection.vue) can be picked up in the next batch
