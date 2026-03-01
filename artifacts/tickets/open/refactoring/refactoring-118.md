---
ticket_id: refactoring-118
category: EXT-DUPLICATE
priority: P4
severity: LOW
status: open
source: code-review-260 MED-1
created_by: slave-collector (plan-20260301-204809)
created_at: 2026-03-01
---

# refactoring-118: Remove unused flankingMap destructure in GridCanvas.vue

## Summary

After the canvas flanking indicator removal (feature-014 P0 fix cycle), `flankingMap` is destructured from `useFlankingDetection` in `GridCanvas.vue` line 210 but never referenced. Only `isTargetFlanked` and `getFlankingPenalty` are consumed.

## Affected Files

- `app/components/vtt/GridCanvas.vue` (line 210)

## Suggested Fix

Change `const { flankingMap, isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatantsRef)` to `const { isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatantsRef)`.

## Impact

Trivial cleanup. One-line change. Address on next touch of GridCanvas.vue.
