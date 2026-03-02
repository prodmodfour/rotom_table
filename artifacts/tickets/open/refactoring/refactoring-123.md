---
title: Fix distanceMoved to use actual moved value in intercept failure paths
priority: P4
severity: LOW
category: EXT-CORRECTNESS
domain: combat
source: code-review-279 MED-1
created_by: slave-collector (plan-20260302-130300)
created_at: 2026-03-02
---

# refactoring-123: Fix distanceMoved in intercept failure paths

## Summary

In `intercept.service.ts`, the failure paths (lines ~628 and ~676) report `distanceMoved` as the theoretical movement budget instead of the actual meters moved (the `moved` variable). This affects move log display only — game state is not impacted.

## Affected Files

- `app/server/services/intercept.service.ts` — change `distanceMoved` to use `moved` variable (2 line changes)

## Suggested Fix

Replace the movement budget value with the `moved` variable in the failure response objects at lines ~628 and ~676.

## Impact

Log display only. Low priority. No game state impact.
