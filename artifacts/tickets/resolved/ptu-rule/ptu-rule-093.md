---
id: ptu-rule-093
title: Rough terrain accuracy penalty not implemented
priority: P3
severity: MEDIUM
status: in-progress
domain: vtt-grid
source: vtt-grid-audit.md (R015) + scenes-audit.md (R018)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-093: Rough terrain accuracy penalty not implemented

## Summary

PTU's rough terrain imposes a -2 accuracy penalty when targeting through rough terrain. This is not implemented. Additionally, occupied enemy squares should be auto-marked as rough terrain per PTU, but are not. The rough terrain type exists in the terrain painter but only as a visual marker.

Related: decree-need-010 covers the rough+slow overlap question.

## Affected Files

- `app/composables/useMoveCalculation.ts` (accuracy calculation)
- `app/stores/terrain.ts` (rough terrain type definition)
- `app/composables/useGridMovement.ts` or `useGridInteraction.ts` (enemy square marking)

## PTU Rule Reference

- "Targeting through Rough Terrain incurs a -2 penalty to Accuracy."
- "Most Rough Terrain is also Slow Terrain, but not always."
- "Squares occupied by enemies are considered Rough Terrain."

## Suggested Fix

1. Add -2 accuracy modifier when attacker-to-target line passes through rough terrain cells
2. Auto-mark enemy-occupied squares as rough terrain for accuracy purposes
3. Depends on decree-need-010 for the rough+slow overlap behavior

## Impact

Rough terrain has no mechanical effect beyond movement cost. Accuracy penalties are missing entirely.

## Fix Log

Resolved as part of ptu-rule-108 fix. See ptu-rule-108.md for full commit details.

| Commit | Description |
|--------|-------------|
| 0dd3605 | Add `terrainStore.isRoughAt()` check to Bresenham line trace |
| 36571e9 | Unit tests covering painted rough terrain accuracy penalty |

**Status notes:**
- Item 1 (accuracy penalty for painted rough terrain): FIXED by ptu-rule-108 commits
- Item 2 (enemy-occupied squares as rough terrain): Was already implemented in prior work (decree-003, commit 6b86a36)
- Item 3 (decree-010 rough+slow overlap): Already resolved by decree-010 and multi-tag terrain refactoring
