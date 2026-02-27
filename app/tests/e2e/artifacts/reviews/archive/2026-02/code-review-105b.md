# Code Review 105b -- ptu-rule-074: swiftActionUsed follow-up fix

**Ticket:** ptu-rule-074
**Commit:** `a0ff335`
**Author:** prodmodfour
**Reviewer:** Senior Reviewer
**Date:** 2026-02-20
**follows_up:** code-review-105

---

## Verdict: APPROVED

---

## Summary

One-line fix adding `swiftActionUsed: true` to the turnState spread in `pass.post.ts`. This resolves the MEDIUM issue from code-review-105 (M1) and the FAIL finding from rules-review-095 (F1).

## Verification

### 1. Diff is minimal and correct

The commit adds exactly one line:

```diff
-      shiftActionUsed: true
+      shiftActionUsed: true,
+      swiftActionUsed: true
```

No other files changed. No unrelated modifications.

### 2. All four action flags now set

The turnState spread in `pass.post.ts` (lines 31-37) now sets:

| Flag | Value | Present |
|------|-------|---------|
| `hasActed` | `true` | Yes |
| `standardActionUsed` | `true` | Yes |
| `shiftActionUsed` | `true` | Yes |
| `swiftActionUsed` | `true` | Yes |

All four flags that the `combatantsWithActions` getter checks (`encounter.ts:87`) are now set to `true` on pass. A passed combatant will no longer appear in the "still has actions" list.

### 3. PTU correctness

Passing now forfeits Standard, Shift, and Swift actions -- consistent with how PTU describes total action loss (Paralysis p.1557, Flinch p.1610, Frozen p.1544). The move log note "Passed turn -- all actions forfeited" now accurately matches the code behavior.

### 4. No regressions

The remaining `TurnState` fields (`canBeCommanded`, `isHolding`) are correctly left untouched by the spread -- they are not action flags and should retain their pre-pass values.

## Issues

None.

## Final Notes

Clean, targeted fix. The MEDIUM issue from code-review-105 and the FAIL from rules-review-095 are both resolved. No further changes required.
