---
id: refactoring-140
title: "Update stale 'mutates entity' comment in damage.post.ts"
category: CODE-HEALTH
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-340 MED-001
created_by: slave-collector (plan-1772702519)
created_at: 2026-03-05
affected_files:
  - app/server/api/encounters/[id]/damage.post.ts
---

## Summary

After refactoring-098 converted entity mutations to immutable spread patterns, a comment at line 61 of `damage.post.ts` still reads "Apply damage to combatant entity (mutates entity)". This is now misleading — `applyDamageToEntity` no longer mutates entity properties directly; it reassigns `combatant.entity` via spread.

## Required Fix

Update or remove the stale comment at `damage.post.ts:61`. Either change to "replaces combatant.entity with spread" or remove since the function name is self-documenting.

## Impact

Misleading comment only. No behavioral impact.
