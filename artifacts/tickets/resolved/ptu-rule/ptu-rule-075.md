---
ticket_id: ptu-rule-075
priority: P3
status: in-progress
domain: combat
source: code-review-086
created_at: 2026-02-20
created_by: senior-reviewer
severity: LOW
affected_files:
  - app/server/api/encounters/[id]/breather.post.ts
---

## Summary

`breather.post.ts` uses `Array.push()` mutation for applying Tripped and Vulnerable tempConditions (lines 89, 93), while the adjacent `sprint.post.ts` uses the correct immutable spread pattern for the same operation.

## Current Behavior

```typescript
// breather.post.ts lines 88-95 (mutating)
if (!combatant.tempConditions.includes('Tripped')) {
  combatant.tempConditions.push('Tripped')        // MUTATION
  result.trippedApplied = true
}
if (!combatant.tempConditions.includes('Vulnerable')) {
  combatant.tempConditions.push('Vulnerable')      // MUTATION
  result.vulnerableApplied = true
}
```

## Expected Behavior

```typescript
// Match sprint.post.ts lines 37-39 (immutable pattern)
if (!combatant.tempConditions.includes('Tripped')) {
  combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
  result.trippedApplied = true
}
if (!combatant.tempConditions.includes('Vulnerable')) {
  combatant.tempConditions = [...combatant.tempConditions, 'Vulnerable']
  result.vulnerableApplied = true
}
```

## Notes

This is server-side code operating on a JSON-parsed object (not a reactive Pinia store), so the mutation is not functionally broken. The issue is consistency with project immutability guidelines and the adjacent sprint endpoint's pattern. Pre-existing issue, not introduced by commit c1d49a7.

## Fix Log

- **Date:** 2026-02-20
- **Change:** Replaced `combatant.tempConditions.push('Tripped')` and `combatant.tempConditions.push('Vulnerable')` with immutable spread assignments (`combatant.tempConditions = [...combatant.tempConditions, 'Tripped']` / `'Vulnerable'`), matching the pattern used in `sprint.post.ts`.
- **File:** `app/server/api/encounters/[id]/breather.post.ts` (lines 89, 93)
- **Risk:** None — behavioral equivalence on JSON-parsed objects; purely a consistency/style fix.
