---
ticket_id: refactoring-021
priority: P2
categories:
  - EXT-DUPLICATE
  - DEAD-CODE
affected_files:
  - app/components/encounter/AccuracySection.vue
estimated_scope: small
status: resolved
created_at: 2026-02-17T11:00:00
filed_by: code-review-022
---

## Summary

`AccuracySection.vue` is an orphaned component — never used anywhere in the codebase. It contains a duplicate `AccuracyResult` interface and its own `rollAccuracy` function with the per-target roll bug that was just fixed in `useMoveCalculation.ts` (refactoring-018). `MoveTargetModal.vue` has its own inline accuracy section and does not use this component.

## Findings

### Finding 1: DEAD-CODE — Component never referenced

- **File:** `app/components/encounter/AccuracySection.vue`
- **Evidence:** Grep for `AccuracySection` and `accuracy-section` (as component tag) across all `.vue` files returns only self-references (internal CSS class names). No other component imports or uses `<AccuracySection>`.
- `MoveTargetModal.vue` lines 106-130 contain an inline accuracy section with matching `.accuracy-section` CSS class names — this is standalone markup, not a usage of the component.

### Finding 2: EXT-DUPLICATE — Duplicate AccuracyResult interface

- **AccuracySection.vue:34-41** defines `AccuracyResult` with identical fields to `useMoveCalculation.ts:14-21`
- If the component were ever reactivated, the duplicate interface would cause maintenance drift

### Finding 3: PTU-INCORRECT — Unfixed per-target roll bug

- **AccuracySection.vue:69-70** rolls `roll('1d20')` inside the per-target loop — the exact bug fixed by refactoring-018 in the composable
- Not a live bug (dead code), but would become one if the component were reactivated

## Suggested Fix

Delete `app/components/encounter/AccuracySection.vue`. If the component is needed in the future, it should be rebuilt using `useMoveCalculation`'s `rollAccuracy` (which now has the correct single-roll behavior) rather than maintaining a separate implementation.

Estimated commits: 1

## Resolution Log
- Commits: `a9b0c89`
- Files changed: deleted `app/components/encounter/AccuracySection.vue`
- New files created: none
- Tests passing: 508/508
