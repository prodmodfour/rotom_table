---
id: refactoring-098
title: Refactor entity mutation in heavily injured/death paths to immutable patterns
category: CODE-HEALTH
priority: P3
severity: LOW
domain: combat
source: code review of slave-4 (plan-20260228-173500)
created_by: slave-collector (plan-20260228-173500)
---

# refactoring-098: Refactor entity mutation in heavily injured/death paths to immutable patterns

## Summary

The damage endpoint (`damage.post.ts`) and next-turn endpoint (`next-turn.post.ts`) directly mutate `entity.statusConditions` and `entity.currentHp` on parsed JSON objects in the newly added heavily injured and death check sections. While this works because combatants are freshly parsed from JSON, it violates the project's immutability coding rules.

## Affected Files

- `app/server/api/encounters/[id]/damage.post.ts` (lines 64-76, 90-96) — direct mutation of entity.currentHp and entity.statusConditions
- `app/server/api/encounters/[id]/next-turn.post.ts` (lines 85-133) — same mutation pattern for turn-end heavily injured penalty
- `app/server/api/encounters/[id]/move.post.ts` — same pattern in move execution endpoint

## Suggested Fix

Create new entity objects with spread operator instead of mutating in place. Apply the same immutable pattern used elsewhere in the codebase. Note: the pre-existing `applyDamageToEntity` function also mutates, so a broader refactor of the damage pipeline's mutation pattern may be warranted.

## Impact

- Code health: enforces project coding standards
- Maintainability: easier to reason about state changes
- Low urgency: mutation is safe here since objects are freshly parsed, but inconsistent with conventions
