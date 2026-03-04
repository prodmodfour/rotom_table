---
id: ptu-rule-117
title: Style Expert specialization 'Beautiful' should be 'Beauty' per PTU contest stat naming
priority: P4
severity: LOW
status: in-progress
domain: character-lifecycle
source: rules-review-183 MEDIUM-001 (pre-existing issue from commit 69f53a0)
created_by: slave-collector (plan-20260228-000430)
---

## Summary

`BRANCHING_CLASS_SPECIALIZATIONS['Style Expert']` at `app/constants/trainerClasses.ts` line 111 uses `'Beautiful'` as one of the contest stats. PTU Core consistently uses `'Beauty'` as the contest stat name (lines 277, 2194, 2242, 2485). The word "Beautiful" only appears in PTU as a feature name ("Beautiful Ballet", line 2444), not as a contest stat.

## Affected Files

- `app/constants/trainerClasses.ts` — line 111: `['Cool', 'Beautiful', 'Cute', 'Smart', 'Tough']`

## Suggested Fix

Change `'Beautiful'` to `'Beauty'` in the Style Expert specialization array. Also check if any existing characters in the database have `'Style Expert: Beautiful'` stored — if so, add a migration or runtime conversion.

## Impact

LOW — cosmetic naming discrepancy. The specialization works correctly regardless of the naming choice. However, it should match the canonical PTU contest stat name for consistency with rulebook references.

## Resolution Log

- **Commit:** 79340ab — `fix: correct Style Expert specialization 'Beautiful' to 'Beauty'`
- **Files changed:** `app/constants/trainerClasses.ts` (1 line)
- **Change:** `'Beautiful'` → `'Beauty'` in `BRANCHING_CLASS_SPECIALIZATIONS['Style Expert']`
- **Note:** No database migration needed — existing characters with `'Style Expert: Beautiful'` would need manual correction by the GM if any exist, but this is a data-entry constant not stored in the DB schema.
