---
id: refactoring-098
title: Refactor entity mutation in heavily injured/death paths to immutable patterns
category: CODE-HEALTH
priority: P3
severity: LOW
domain: combat
status: in-progress
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

## Resolution Log

- `3f9488ca` — `damage.post.ts`: replaced `entity.currentHp` and `entity.statusConditions` mutations with `combatant.entity` spread reassignment
- `2c164356` — `next-turn.post.ts`: replaced `entity.currentHp` and `entity.statusConditions` mutations with `currentCombatant.entity` spread reassignment
- `5bb485f0` — `move.post.ts`: replaced `entity.currentHp` and `entity.statusConditions` mutations with `target.entity` spread reassignment
- `a46404d8` — `combatant.service.ts`: converted `applyDamageToEntity`, `applyFaintStatus`, `applyHealingToEntity`, `updateStatusConditions`, `applyStatusCsEffects`, `reverseStatusCsEffects`, and `updateStageModifiers` to immutable spread patterns

### Additional mutation sites found (L2 grep)

The following files also mutate entity fields directly but were out of scope for this ticket:
- `aoo-resolve.post.ts` — `trigger.entity.statusConditions` mutation for Dead status (same pattern)
- `breather.post.ts` — `entity.statusConditions` and `entity.temporaryHp` mutations
- `healing-item.service.ts` — `entity.currentHp`, `entity.statusConditions`, `entity.injuries` mutations
- `living-weapon-abilities.service.ts` — `entity.currentHp` and `entity.injuries` mutations
