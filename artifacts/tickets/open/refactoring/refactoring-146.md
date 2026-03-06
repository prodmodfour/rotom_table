---
id: refactoring-146
title: "breather.post.ts clears volatile conditions without filtering conditionInstances"
priority: P4
severity: low
status: open
domain: combat
source: code-review-361
created_by: slave-collector (plan-1772810718)
created_at: 2026-03-06
affected_files:
  - app/server/api/encounters/[id]/breather.post.ts
---

## Summary

`breather.post.ts` clears volatile conditions at line 133 but does not filter `conditionInstances` to match. This creates a desync between the flat `statusConditions[]` array and the enriched `conditionInstances[]` array introduced by refactoring-129.

## Suggested Fix

After clearing volatile conditions from `statusConditions`, filter `conditionInstances` to remove entries for the cleared conditions, matching the pattern used in `end.post.ts` (commit 84b5e3be).

## Impact

LOW -- the desync only persists for the remainder of the current encounter. `conditionInstances` are combat-scoped and rebuilt from `statusConditions` on next combat entry via `buildCombatantFromEntity()`.
