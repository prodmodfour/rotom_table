---
id: refactoring-073
category: EXT-VALIDATION
priority: P4
status: resolved
source: code-review-141 M2
created_by: slave-collector (plan-20260223-085530)
created_at: 2026-02-23
resolved_at: 2026-02-24
---

# refactoring-073: Add server-side validation for `significanceTier` string values

## Summary

Four encounter API endpoints accept `significanceTier` without validating it against the valid set of values. Any arbitrary string can be written to the DB column. The `significanceMultiplier` IS validated (0.5-10 range), but the tier string is not.

## Affected Files

- `app/server/api/encounters/[id]/significance.put.ts`
- `app/server/api/encounters/index.post.ts`
- `app/server/api/encounters/from-scene.post.ts`
- `app/server/api/encounters/[id].put.ts`

## Suggested Fix

Add a whitelist check:

```typescript
const VALID_TIERS = ['insignificant', 'everyday', 'significant', 'climactic', 'legendary']
if (body.significanceTier && !VALID_TIERS.includes(body.significanceTier)) {
  throw createError({
    statusCode: 400,
    message: `significanceTier must be one of: ${VALID_TIERS.join(', ')}`
  })
}
```

Extract to a shared validation utility to avoid duplication across 4 endpoints.

## Impact

Low severity — UI already constrains inputs to valid values. But violates the project's input validation principle (CLAUDE.md: "ALWAYS validate user input").

## Resolution Log

- **Commit:** ce9ab6e
- **Files changed:**
  - `app/server/utils/significance-validation.ts` — new shared utility with `VALID_SIGNIFICANCE_TIERS` whitelist and `validateSignificanceTier()` function
  - `app/server/api/encounters/[id]/significance.put.ts` — added tier validation after multiplier validation
  - `app/server/api/encounters/index.post.ts` — added tier validation before encounter creation
  - `app/server/api/encounters/from-scene.post.ts` — added tier validation after sceneId check
  - `app/server/api/encounters/[id].put.ts` — added tier validation before DB update
