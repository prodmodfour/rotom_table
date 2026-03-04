---
id: refactoring-130
title: "Environment preset clearing stores '{}' instead of null in database"
priority: P4
severity: LOW
status: open
domain: encounter-tables
source: rules-review-302 MED-2
created_by: slave-collector (plan-20260304-172253)
created_at: 2026-03-04
affected_files:
  - app/server/api/encounters/[id]/environment-preset.put.ts
  - app/server/services/encounter.service.ts
---

## Summary

When clearing an environment preset, the endpoint stores `'{}'` in the database instead of `null`. The `parseEnvironmentPreset()` function handles this correctly by returning `null` for `'{}'`, but the inconsistency between DB representation (`'{}'`) and app representation (`null`) could cause confusion if other code reads raw DB values.

## Suggested Fix

Either store `null` in the DB when clearing (and update the Prisma schema default), or document the `'{}'` convention as intentional. Low priority — functionally correct as-is.
