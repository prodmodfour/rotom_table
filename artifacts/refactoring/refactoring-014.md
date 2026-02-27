---
ticket_id: refactoring-014
priority: P1
categories:
  - TYPE-ERROR
affected_files:
  - app/server/api/characters/import-csv.post.ts
  - app/stores/groupViewTabs.ts
  - app/tests/e2e/scenarios/capture/capture-helpers.ts
  - app/tests/e2e/scenarios/combat/combat-helpers.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T22:00:00
---

## Summary
`npx nuxi typecheck` reports 4 pre-existing type errors across 4 files. These were discovered during the refactoring-001 typecheck verification step and are unrelated to that refactoring.

## Findings

### Finding 1: Null/undefined mismatch in import-csv.post.ts
- **File:** `app/server/api/characters/import-csv.post.ts`
- **Errors:**
  - `Type 'undefined' is not assignable to type 'string | null'`
  - `Type 'string | null' is not assignable to type 'string | undefined'` (null vs undefined mismatch)
- **Likely cause:** Prisma schema uses `String?` (nullable) but the code passes `undefined` instead of `null`, or vice versa.

### Finding 2: Invalid HTTP method type in groupViewTabs.ts
- **File:** `app/stores/groupViewTabs.ts`
- **Error:** `Type '"DELETE"' is not assignable to type '"get" | "GET" | undefined'`
- **Line:** 260
- **Likely cause:** `$fetch` method option type doesn't include `"DELETE"` — may need explicit type assertion or the fetch call structure needs adjustment.

### Finding 3: verbatimModuleSyntax in e2e test helpers
- **Files:**
  - `app/tests/e2e/scenarios/capture/capture-helpers.ts`
  - `app/tests/e2e/scenarios/combat/combat-helpers.ts`
- **Error:** `'APIRequestContext' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled`
- **Fix:** Change `import { APIRequestContext }` to `import type { APIRequestContext }`

## Suggested Refactoring
1. Fix null/undefined mismatches in `import-csv.post.ts` (align with Prisma's nullable types)
2. Fix `$fetch` method type in `groupViewTabs.ts` (likely needs `method: 'DELETE' as const` or similar)
3. Add `type` keyword to `APIRequestContext` imports in both test helper files

Estimated commits: 2-3

## Resolution Log

**Note:** The original 4 errors from Feb 16 had evolved by the time of resolution. The test helper `import type` fixes (Finding 3) were already applied in prior commits. Finding 1 (import-csv.post.ts) and Finding 2 (groupViewTabs.ts DELETE) no longer reproduced — likely fixed by intervening refactors (csv-import service extraction, scene type refactor). However, `npx nuxi typecheck` revealed 31 new/different errors across 5 files. All resolved.

**Errors fixed (31 total, 5 root causes):**
1. `types/api.ts` — WebSocketEvent union missing 14 scene/tab events (caused 28 errors in `useGroupViewWebSocket.ts`). Added all scene, tab, and sync events with proper typed data shapes.
2. `types/api.ts` — `serve_map` data used `unknown[]` for locations/connections. Replaced with `ServedMap` import from `stores/groupView.ts` (fixed 1 error in `useWebSocket.ts`).
3. `components/group/InitiativeTracker.vue` — Missing `Pokemon` type import for template cast.
4. `pages/gm/create.vue` — `location: string | null` incompatible with `Partial<HumanCharacter>` / `Partial<Pokemon>` which expect `string | undefined`. Changed `|| null` to `|| undefined`.
5. `pages/gm/scenes/[id].vue` — `scene.habitatId` is `string | null | undefined` but prop expects `string | null`. Added `?? null` coalescing.

- Commits: 8b04a40
- Files changed: `app/types/api.ts`, `app/components/group/InitiativeTracker.vue`, `app/pages/gm/create.vue`, `app/pages/gm/scenes/[id].vue`
- New files created: none
- Tests passing: `npx nuxi typecheck` — 0 errors (only pre-existing duplicated import warnings)
