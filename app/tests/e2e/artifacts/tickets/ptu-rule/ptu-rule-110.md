---
ticket_id: ptu-rule-110
ticket_type: ptu-rule
priority: P2
status: open
domain: combat
topic: encounter-end-reset-combat-stages
source: rules-review-161 M2 + code-review-184 H1
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/entity-update.service.ts
---

## Summary

The encounter end handler clears volatile conditions and resets scene-frequency moves, but does NOT reset `stageModifiers` to defaults. PTU combat stages are combat-scoped and have no meaning outside of battle.

## PTU Rule

Combat stages (p.235) are encounter-scoped modifiers. They are set to defaults at encounter start and should be cleared at encounter end.

## Current Behavior

`end.post.ts` syncs entity data to DB but leaves `stageModifiers` with their combat values. This causes:
1. Stale combat stage data persisting in entity DB records
2. Double-application of status CS effects when re-entering combat (HIGH-1 from code-review-184 / rules-review-161)

## Required Behavior

When an encounter ends:
1. Reset all combatants' `stageModifiers` to `{ attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }`
2. Clear `stageSources` arrays
3. Sync the reset values to entity DB records

## Notes

- Pre-existing issue, not a regression. Directly contributes to the double-CS-application bug.
- Also need to ensure `buildCombatantFromEntity` resets stages before calling `reapplyActiveStatusCsEffects` as a defense-in-depth measure.
