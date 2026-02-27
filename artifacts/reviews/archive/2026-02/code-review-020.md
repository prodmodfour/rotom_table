---
review_id: code-review-020
target: refactoring-019
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-17
commits_reviewed:
  - 5565b6e
files_reviewed:
  - app/composables/useTypeChart.ts
  - app/utils/damageCalculation.ts
  - app/tests/unit/composables/useTypeChart.test.ts
scenarios_to_rerun:
  - combat-type-effectiveness-001
  - combat-workflow-wild-encounter-001
  - combat-workflow-stage-buffs-001
---

## Summary

Reviewed the fix for refactoring-019 (dual-type effectiveness). The multiplicative loop (`1.5 × 1.5 = 2.25`) was replaced with PTU's qualitative classification system (count SE/resist/immune per defender type, net them, look up flat multiplier). Applied to both `useTypeChart.ts` and `damageCalculation.ts`. Tests updated and expanded.

## Algorithm Verification

Verified against 07-combat.md:780-787, 1010-1033:

| Rule Text | Expected | Implementation | Correct? |
|-----------|----------|---------------|----------|
| Doubly SE (line 1016-1017) | 2.0 | net=2 → 2.0 | Yes |
| SE + Resist (line 1019-1020) | 1.0 | net=0 → 1.0 | Yes |
| Triply SE (line 1032-1033) | 3.0 | net=3 → 3.0 | Yes |
| Triply Resisted (line 786-787) | 0.125 | net=-3 → 0.125 | Yes |
| Doubly Resisted (line 785-786) | 0.25 | net=-2 → 0.25 | Yes |
| Immunity (line 1022) | 0 | Early return on value===0 | Yes |

## Issues

### MEDIUM #1: Net beyond ±3 falls back to neutral instead of clamping

- **Files:** `useTypeChart.ts:63`, `damageCalculation.ts:279`
- **Code:** `return NET_EFFECTIVENESS[net] ?? 1` — if net exceeds ±3, returns 1.0 (neutral)
- **Expected:** Should cap at triply SE (3.0) or triply resisted (0.125) since PTU defines triply as the maximum tier
- **Fix:** `const net = Math.max(-3, Math.min(3, seCount - resistCount))`
- **Disposition:** Deferred to refactoring-020 (consolidation). No point fixing in two files that are about to merge. Added to refactoring-020 scope.

## What Looks Good

1. **Correct algorithm.** Net-classification directly implements the PTU rules table.
2. **Both code paths fixed.** Composable and utility both updated consistently.
3. **refactoring-020 filed proactively.** Bug fix correctly scoped; duplication tracked separately.
4. **Solid test coverage.** All three ticket findings tested (doubly SE, SE+resist, triply SE) plus triply resisted.
5. **Label function ordering fixed.** Old `<= 2.25` thresholds replaced with correct extreme-inward checks.
