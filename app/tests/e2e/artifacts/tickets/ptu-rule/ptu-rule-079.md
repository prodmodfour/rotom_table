---
ticket_id: ptu-rule-079
priority: P3
status: in-progress
domain: combat
source: code-review-120 (M1)
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Helmet conditional DR (+15 on critical hits) is skipped when the GM provides a manual DR override via the damage calculation endpoint. On the client side, there is no override concept, so helmet DR always applies. This creates a subtle server/client parity gap for the edge case of manual DR override + critical hit + helmeted target.

## Expected Behavior (PTU Rules)

Per PTU p.293, Helmet provides 15 DR against Critical Hits only. This should stack with any other DR source (armor, manual override). A manual DR override should not suppress the helmet bonus.

## Actual Behavior

In `app/server/api/encounters/[id]/calculate-damage.post.ts`, when `body.damageReduction` is provided by the GM, the server uses that value directly and skips the helmet conditional DR check. On the client side (`app/composables/useMoveCalculation.ts`), there is no manual override concept, so helmet DR is always applied on critical hits.

## Affected Files

- `app/server/api/encounters/[id]/calculate-damage.post.ts` — helmet DR branch is inside the `else` of the manual DR check
- `app/composables/useMoveCalculation.ts` — always applies helmet DR (correct behavior)

## Suggested Fix

Move the helmet conditional DR check outside the manual-vs-equipment DR branch, or add helmet DR on top of manual override when `isCritical` is true.

## Impact

Low — requires three simultaneous conditions (manual DR override + critical hit + helmeted target). But the server/client parity gap could cause confusion if both are visible.

## Fix Log

### Commit `1950e54` — fix: apply helmet conditional DR on top of manual DR override

**File changed:** `app/server/api/encounters/[id]/calculate-damage.post.ts`

**Root cause:** Helmet conditional DR logic (lines 181-188) was nested inside the `if (effectiveDR === undefined && targetEquipBonuses)` block. When the GM provided a manual `body.damageReduction` value, `effectiveDR` was not `undefined`, so the entire block -- including the helmet check -- was skipped.

**Fix:** Separated the helmet conditional DR check into its own block outside the manual-vs-equipment DR branch. The new structure:
1. First block: If no manual DR provided, use equipment-based DR
2. Second block (independent): If critical hit AND target has equipment bonuses, add conditional DR (helmet +15) on top of whatever DR was determined

**Duplicate code path check:** Searched for `conditionalDR`, `helmet`, and `Critical Hits only` across the codebase. Only two code paths handle helmet conditional DR:
- Server: `calculate-damage.post.ts` (fixed)
- Client: `useMoveCalculation.ts` (already correct -- always applies helmet DR)

No other code paths found. Server/client parity restored.
