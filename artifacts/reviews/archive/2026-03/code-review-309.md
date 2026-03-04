---
review_id: code-review-309
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-022
domain: pokemon-lifecycle
commits_reviewed:
  - a37f58d7
  - c4c55d7f
  - 27ffd8a3
  - 4b8204ae
  - 4bff0cf0
  - 8432655d
files_reviewed:
  - app/server/services/pokemon-generator.service.ts
  - app/server/api/pokemon/[id].put.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/utils/serializers.ts
  - app/server/services/entity-builder.service.ts
  - app/server/api/capture/attempt.post.ts
  - artifacts/tickets/in-progress/feature/feature-022.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-03T20:40:00Z
follows_up: code-review-306
---

## Review Scope

Re-review of fix cycle for feature-022 (Pokemon Loyalty System). code-review-306 found 1 CRITICAL + 3 HIGH + 2 MEDIUM issues. The developer addressed all 6 issues across 6 commits. This review verifies each fix.

Checked decrees: No active decrees govern loyalty mechanics. decree-035 (base relations ordering) and decree-036 (stone evolution moves) are in the pokemon-lifecycle domain but do not apply.

## Issue Resolution Verification

### C1 (CRITICAL): `createdPokemonToEntity()` hardcodes loyalty: 3 — RESOLVED

**Commit:** a37f58d7

The fix correctly:
1. Added `origin: PokemonOrigin` to the `CreatedPokemon` interface (line 75)
2. Threads `origin: input.origin` from `createPokemonRecord()` into the returned `CreatedPokemon` (line 269)
3. Replaced `loyalty: 3` with `loyalty: getStartingLoyalty(pokemon.origin)` in `createdPokemonToEntity()` (line 336)

This eliminates the data divergence between DB and in-memory entity. Since `createdPokemonToEntity` is only called immediately after `createPokemonRecord` via `buildPokemonCombatant`, the `getStartingLoyalty(origin)` call produces the same value that was written to DB — verified by tracing callers in `wild-spawn.post.ts`, `from-scene.post.ts`, and `load.post.ts`.

The commit also fixed two bonus issues in the same function: `shiny: false` was replaced with `shiny: data.shiny ?? false` (preserving actual shiny status), and `origin: 'wild'` was replaced with `origin: pokemon.origin` (preserving actual origin). These were not flagged in code-review-306 but were the same class of hardcoding bug.

### H1 (HIGH): No server-side validation on loyalty in PUT endpoint — RESOLVED

**Commit:** 27ffd8a3

The fix adds a proper guard at lines 50-58 of `[id].put.ts`:
```typescript
if (!Number.isInteger(body.loyalty) || body.loyalty < 0 || body.loyalty > 6) {
  throw createError({
    statusCode: 400,
    message: 'Loyalty must be an integer between 0 and 6'
  })
}
```

This validates integer type and 0-6 range before writing to DB. Rejects floats, negative numbers, values above 6, and non-numeric types. The validation only runs when `body.loyalty !== undefined`, so omitting loyalty from the update body still works correctly.

**Note (pre-existing, not blocking):** The outer catch block at line 90 wraps all errors in `statusCode: 500`. This means the 400 error thrown by loyalty validation will be re-thrown as 500. However, the error message is preserved via `error.message`. This is a pre-existing pattern in this file (present before the fix cycle) and affects all validation errors in this endpoint, not just loyalty. Other endpoints in the codebase (e.g., `generate.post.ts`, `wild-spawn.post.ts`) use `if (error.statusCode) throw error` to preserve original status codes. This is a separate concern from the loyalty fix cycle — not blocking.

### H2 (HIGH): No server-side validation on loyalty in POST endpoint — RESOLVED

**Commit:** 4b8204ae

The fix adds identical validation at lines 18-24 of `index.post.ts`. The approach extracts `const loyalty = body.loyalty ?? 3` first, then validates the computed value before passing to `prisma.pokemon.create()`. This is slightly different from the PUT pattern (which only validates when `body.loyalty !== undefined`) but is equally correct because the default of 3 passes validation. The same pre-existing status code wrapping note from H1 applies here.

### H3 (HIGH): Five `as any` casts for loyalty — RESOLVED

**Commit:** 4bff0cf0

The fix adds a clear, actionable post-merge checklist to the feature-022 ticket listing all 5 `as any` locations with exact file paths, line numbers, and the before/after transformation. I verified that all 5 documented locations match the actual `as any` casts in the codebase:

1. `app/server/utils/serializers.ts` line 51 — confirmed `(p as any).loyalty`
2. `app/server/utils/serializers.ts` line 242 — confirmed `(pokemon as any).loyalty`
3. `app/server/services/entity-builder.service.ts` line 64 — confirmed `(record as any).loyalty`
4. `app/server/api/capture/attempt.post.ts` line 192 — confirmed `(pokemon as any).loyalty`
5. `app/server/api/capture/attempt.post.ts` line 196 — confirmed `{ loyalty: newLoyalty } as any`

Per the task instructions, these are documented technical debt for post-merge resolution, not code quality issues.

### M1 (MEDIUM): JSDoc claims traded=1, bred=4 — RESOLVED

**Commit:** c4c55d7f

The JSDoc for `getStartingLoyalty()` now reads:
```typescript
/**
 * Map Pokemon origin to starting loyalty value (PTU Chapter 10, p.211).
 * Captured/wild: 2 (Wary), Default (manual/template/import): 3 (Neutral).
 */
```

The unsubstantiated "Traded: 1 (Resistant)" and incorrect "Bred/Egg: 4 (Friendly)" claims have been removed. The comment accurately describes only the origins that are actually handled by the switch statement.

### M2 (MEDIUM): Orphaned JSDoc block — RESOLVED

**Commit:** c4c55d7f (same commit as M1)

The stale `createPokemonRecord` JSDoc that was orphaned above `getStartingLoyalty` has been removed. The `createPokemonRecord` JSDoc is now correctly placed directly above that function at lines 206-209. The file reads cleanly without duplicate or misplaced documentation blocks.

## What Looks Good

1. **Fix granularity is correct.** Each issue got its own commit (except M1+M2+rules-H1 which are the same JSDoc and were appropriately combined). Each commit is small, focused, and produces a working state.

2. **C1 fix is the right approach.** Threading `origin` through `CreatedPokemon` is cleaner than reading loyalty back from the DB. It uses the same `getStartingLoyalty()` function, keeping the logic in one place. The bonus fixes for `shiny` and `origin` hardcoding show thoroughness.

3. **Validation pattern is consistent.** Both PUT and POST endpoints use the same validation logic (`Number.isInteger` + range check) and the same error message. The error is thrown before the DB write, preventing invalid data from reaching the database.

4. **Post-merge checklist is actionable.** Line numbers, file paths, and exact before/after code snippets make the `as any` removal a mechanical task that requires no judgment.

5. **Ticket documentation was updated.** The PTU Rules section was corrected (bred=3 not 4, traded annotated as not-yet-implemented), the resolution log includes all fix cycle commits, and the post-merge checklist was added in the right location.

6. **Commit messages are descriptive.** Each message references the specific issue ID from code-review-306 (C1, H1, H2, H3, M1, M2) making the fix cycle traceable.

## Verdict

**APPROVED** — All 6 issues from code-review-306 (1C + 3H + 2M) have been resolved correctly. No new issues introduced by the fix cycle. The loyalty system implementation is ready for merge pending the documented `prisma db push` migration and `as any` removal.

## Required Changes

None.
