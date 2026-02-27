---
ticket_id: refactoring-058
priority: P4
status: resolved
category: EXT-DUPLICATE
source: code-review-105, code-review-113
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Server-side action endpoints use inconsistent mutation patterns for `turnState` updates. `breather.post.ts` uses direct property assignment (`combatant.turnState.standardActionUsed = true`) while `pass.post.ts` uses the immutable spread pattern (`combatant.turnState = { ...combatant.turnState, ... }`). Both are functionally correct on server-side plain JSON objects (no reactive proxies), but the inconsistency violates the project's immutability coding style and creates a maintenance hazard if the data layer ever changes.

## Affected Files

- `app/server/api/encounters/[id]/breather.post.ts` — lines 97-100, direct property assignment on `turnState`
- `app/server/api/encounters/[id]/pass.post.ts` — uses spread pattern (correct style, reference implementation)
- `app/server/api/encounters/[id]/sprint.post.ts` — verify which pattern is used
- `app/server/api/encounters/[id]/trip.post.ts` — verify which pattern is used

## Suggested Fix

Align all action endpoints to use the immutable spread pattern for `turnState` updates, matching `pass.post.ts`:

```typescript
// BEFORE (breather.post.ts)
combatant.turnState.standardActionUsed = true
combatant.turnState.shiftActionUsed = true
combatant.turnState.hasActed = true

// AFTER
combatant.turnState = {
  ...combatant.turnState,
  standardActionUsed: true,
  shiftActionUsed: true,
  hasActed: true
}
```

Audit all action endpoints (`breather`, `pass`, `sprint`, `trip`, `push`, `grapple`, `intercept`) for the same pattern and normalize.

## Impact

No correctness impact — both patterns produce identical results on server-side plain objects. This is a code style consistency fix to match the project's immutability guidelines and the pattern established in `pass.post.ts`.

## Resolution Log

**2026-02-20 — resolved by developer**

### Audit Results

Searched all 29 endpoints in `app/server/api/encounters/[id]/` and all server-side code (`app/server/`) for `turnState.` direct property assignment patterns.

| Endpoint | turnState Pattern | Status |
|---|---|---|
| `pass.post.ts` | Spread (reference) | Already correct |
| `breather.post.ts` | Direct assignment | **Fixed** |
| `sprint.post.ts` | Does not modify turnState | N/A |
| `start.post.ts` | Object literal assignment (not mutation) | Already correct |
| `trip.post.ts` | Does not exist | N/A |
| `push.post.ts` | Does not exist | N/A |
| `grapple.post.ts` | Does not exist | N/A |
| `intercept.post.ts` | Does not exist | N/A |

**Only one file required changes:** `breather.post.ts` lines 98-100.

### Change

Replaced direct property assignment:
```typescript
combatant.turnState.standardActionUsed = true
combatant.turnState.shiftActionUsed = true
combatant.turnState.hasActed = true
```

With immutable spread pattern:
```typescript
combatant.turnState = {
  ...combatant.turnState,
  standardActionUsed: true,
  shiftActionUsed: true,
  hasActed: true
}
```

### Verification

- Unit tests: 635/635 passing (11 pre-existing failures in `encounterGeneration.test.ts` unrelated)
- No behavior change — pure style refactoring
- Commit: `784ba12`
