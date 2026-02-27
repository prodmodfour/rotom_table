---
id: refactoring-087
title: Split terrain store test file to stay under 800-line limit
priority: P4
severity: LOW
status: in-progress
domain: vtt-grid
category: TEST-STALE
source: code-review-190 MED-1
created_by: slave-collector (plan-20260227-161023)
created_at: 2026-02-27
---

## Summary

`app/tests/unit/stores/terrain.test.ts` is 811 lines, exceeding the 800-line project maximum. The file is well-organized with clear `describe` blocks, but should be split.

## Suggested Fix

Extract the `migrateLegacyCell` tests (lines ~725-810, ~86 lines) into a separate file `terrain-migration.test.ts`. These tests cover a standalone exported function and form a natural extraction point.

## Affected Files

- `app/tests/unit/stores/terrain.test.ts` (811 lines)

## Impact

Code health only. No functional change. Improves test file organization.

## Resolution Log

- **Commit:** e25477f
- **Changes:**
  - Extracted `migrateLegacyCell` describe block (7 tests, ~86 lines) from `app/tests/unit/stores/terrain.test.ts` into new `app/tests/unit/stores/terrain-migration.test.ts`
  - Removed unused `migrateLegacyCell` import from terrain.test.ts
  - terrain.test.ts reduced from 811 to 773 lines (under 800-line max)
