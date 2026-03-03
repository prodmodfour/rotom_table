---
ticket_id: refactoring-105
category: EXT-CLEANUP
priority: P4
severity: LOW
status: resolved
domain: combat
source: code-review-236 MEDIUM-001
created_by: slave-collector (plan-20260301-093000)
created_at: 2026-03-01
---

# Remove Spurious 'Bound' Condition Check from Trapped Validation

## Summary

`switching.service.ts` line 368 checks for both `'Trapped'` and `'Bound'` when validating whether a Pokemon can be recalled. However, `'Bound'` is not a recognized `StatusCondition` in the codebase — it does not appear in the `StatusCondition` type union (`combat.ts`), in `ALL_STATUS_CONDITIONS` (`statusConditions.ts`), or in any code path that applies status conditions.

In PTU 1.05, "Bound" refers to Action Points being bound by Features/Stratagems (p.226), not a combat status condition that prevents recall. The check is a harmless no-op but is misleading to future developers.

## Affected Files

- `app/server/services/switching.service.ts:368`

## Suggested Fix

Remove the `|| allRecalledConditions.includes('Bound')` clause. If a "Bound" status condition is ever added (e.g., via Bind/Wrap moves), it should be added explicitly at that time with proper PTU rule citations.

## Impact

No functional impact (the check never matches). Cleanup only — prevents developer confusion about what conditions block recall.

## Resolution Log

Subset of bug-049. Resolved by decree-044 (remove all 'Bound' checks).
- **0caab34e** `fix: remove dead 'Bound' condition checks from switching system (decree-044)`
