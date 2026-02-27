---
ticket_id: refactoring-092
category: EXT-LATENT
priority: P4
severity: LOW
domain: encounter-tables
status: open
source: code-review-207 M1
created_by: slave-collector (plan-20260227-153711)
created_at: 2026-02-27
---

# refactoring-092: Add partial-update merge to modification update endpoint level range validation

## Summary

The modification update endpoint (`[modId].put.ts`) validates level range constraints against request body values only, without merging with existing DB values first. The entry update endpoint (`[entryId].put.ts`) correctly merges `body.levelMin`/`body.levelMax` with `existing.levelMin`/`existing.levelMax` before validating `levelMin <= levelMax`. The modification endpoint does not, creating an inconsistency.

## Current Behavior

```typescript
// [modId].put.ts — does not merge with DB state
const modLevelMin = body.levelRange?.min ?? null
const modLevelMax = body.levelRange?.max ?? null
```

If a modification has `levelMin=5, levelMax=10` and a partial update sends `{ levelRange: { min: 15 } }` without `max`, validation passes (null skips check) but the DB write may produce inconsistent state.

## Expected Behavior

Mirror the entry update pattern: merge provided values with existing DB values before cross-field validation.

## Affected Files

- `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts`

## Impact

Low — the client currently sends the full `levelRange` object, so partial updates don't occur in practice. This is a latent risk if the API contract evolves.
