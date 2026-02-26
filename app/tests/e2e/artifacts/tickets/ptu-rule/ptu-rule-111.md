---
ticket_id: ptu-rule-111
ticket_type: ptu-rule
priority: P2
status: open
domain: combat
topic: temp-conditions-vulnerable-evasion
source: rules-review-161 M3
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/composables/useMoveCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
---

## Summary

The zero-evasion check for Vulnerable/Frozen/Asleep only inspects `entity.statusConditions`, missing `combatant.tempConditions`. Take a Breather applies Vulnerable via `tempConditions`, which is not caught by the evasion check.

## PTU Rule

PTU p.245 (Take a Breather): "be treated as having 0 Evasion until the end of their next turn." This Vulnerable condition is stored in `tempConditions`, separate from `statusConditions`.

## Current Behavior

- `useMoveCalculation.ts:348-349` checks `entity.statusConditions` only
- `calculate-damage.post.ts:223` checks `target.entity.statusConditions` only
- Breather Vulnerable stored in `combatant.tempConditions` is missed

## Required Behavior

Both client and server zero-evasion checks should inspect BOTH `entity.statusConditions` AND `combatant.tempConditions` for Vulnerable/Frozen/Asleep.

## Notes

- Pre-existing architectural pattern gap (tempConditions has always been separate)
- Not a regression from ptu-rule-084 — the new code follows the existing pattern
