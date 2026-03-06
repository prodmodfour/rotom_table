---
id: refactoring-147
title: "next-turn.post.ts adds Dead from heavily injured penalty without updating conditionInstances"
priority: P4
severity: low
status: open
domain: combat
source: code-review-361
created_by: slave-collector (plan-1772810718)
created_at: 2026-03-06
affected_files:
  - app/server/api/encounters/[id]/next-turn.post.ts
---

## Summary

In `next-turn.post.ts` (around line 154), the deferred heavily injured penalty path adds `Dead` to `statusConditions` without adding a corresponding `ConditionInstance` entry to `conditionInstances`. This creates a desync in the dual-format condition storage introduced by refactoring-129.

## Suggested Fix

After adding Dead to `statusConditions`, also push a `{ condition: 'Dead', sourceType: 'system', sourceLabel: 'Heavily Injured penalty' }` entry to `conditionInstances`, matching the pattern used in `damage.post.ts` (lines 127-132).

## Impact

LOW -- Dead is a terminal state (the combatant is removed from combat). The desync has no observable gameplay effect since Dead combatants receive no further condition processing.
