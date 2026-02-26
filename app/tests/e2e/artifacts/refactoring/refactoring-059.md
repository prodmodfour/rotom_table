---
ticket_id: refactoring-059
priority: P4
status: resolved
category: EXT-DEAD-CODE
source: code-review-122 (HIGH-001), rules-review-112
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Five server API endpoints in `app/server/api/encounter-tables/` still serialize `densityMultiplier` in responses and accept it in request bodies, but the `TableModification` TypeScript interface in `app/types/habitat.ts` no longer declares the field. The UI no longer sends or displays this value. This is dead work in the API layer.

## Affected Files

- `app/server/api/encounter-tables/index.get.ts` — serializes densityMultiplier
- `app/server/api/encounter-tables/[id].get.ts` — serializes densityMultiplier
- `app/server/api/encounter-tables/[id]/modifications/index.post.ts` — accepts and validates densityMultiplier
- `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts` — accepts densityMultiplier
- `app/server/api/encounter-tables/[id]/modifications/[modId].delete.ts` — may reference densityMultiplier

## Suggested Fix

Remove `densityMultiplier` from all API serialization and request body parsing. The DB column remains for backward compatibility (no migration). Only remove the API-layer references.

## Impact

No runtime bugs — the field is simply ignored by the client. This is a code cleanliness fix to remove dead work from the API layer.

## Resolution Log

- **Commit:** 8cf3288 — `refactor: remove dead densityMultiplier from encounter-tables API`
- **Files changed (6 total):**
  - `app/server/api/encounter-tables/index.get.ts` — removed densityMultiplier from modification serialization
  - `app/server/api/encounter-tables/[id].get.ts` — removed densityMultiplier from modification serialization
  - `app/server/api/encounter-tables/[id].put.ts` — removed densityMultiplier from modification serialization (not in original ticket but contained same dead code)
  - `app/server/api/encounter-tables/[id]/modifications/index.post.ts` — removed validation, DB write, and serialization
  - `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts` — removed validation, DB write, and serialization
  - `app/server/api/encounter-tables/[id]/modifications/[modId].get.ts` — removed densityMultiplier from serialization (not in original ticket but contained same dead code)
- **Note:** `[modId].delete.ts` had no densityMultiplier references — no changes needed. `[id].put.ts` and `[modId].get.ts` were also cleaned up (found via duplicate code path check).
