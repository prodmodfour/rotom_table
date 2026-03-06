---
id: refactoring-145
title: "Extract duplicated heavily injured penalty block into shared server utility"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: code-review-351 M1
created_by: slave-collector (plan-1772793388)
created_at: 2026-03-06
affected_files:
  - app/server/api/encounters/[id]/move.post.ts
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/action.post.ts
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/mount.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
---

## Summary

The heavily injured standard-action faint penalty (ptu-rule-151 implementation) duplicates a ~35-line block across 9 action endpoints, totaling ~300+ lines of duplicated code.

## Problem

Each of the 9 affected endpoints contains an identical block that:
1. Checks if the combatant is heavily injured (HP <= injury count)
2. Checks if the action is a standard action
3. Applies faint if the penalty triggers

This violates DRY and the service delegation rule (API routes should not contain business logic).

## Suggested Fix

Extract the heavily injured penalty check into a shared utility function in `app/server/utils/` or as a method on `combatant.service.ts`. Each endpoint would then call a single function instead of duplicating the block.

## Impact

- Code hygiene improvement
- Reduces maintenance burden when penalty logic changes
- No functional change
