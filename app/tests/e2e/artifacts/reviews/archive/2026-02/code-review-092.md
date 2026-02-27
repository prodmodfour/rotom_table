---
review_id: code-review-092
target: refactoring-051
ticket_id: refactoring-051
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
commits_reviewed:
  - c61549d
  - 6912161
  - b6100c3
  - 7a31790
  - 8b103c5
files_reviewed:
  - app/server/api/encounters/[id].get.ts
  - app/server/api/encounters/served.get.ts
  - app/server/api/encounters/[id]/serve.post.ts
  - app/server/api/encounters/[id]/unserve.post.ts
  - app/server/api/encounters/index.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/server/api/encounters/[id].put.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/encounter.service.ts
---

## Review: refactoring-051 -- Migrate 8 encounter endpoints to buildEncounterResponse

### Scope

8 encounter API endpoints had manual `const parsed = { ... }` response construction blocks instead of using the shared `buildEncounterResponse()` from `encounter.service.ts`. This caused field drift: `serve.post.ts` and `unserve.post.ts` were missing 7 fields each, and all 8 were missing `createdAt` and `updatedAt`. The fix replaces all manual construction with calls to the shared builder.

### Verification Checklist

| Check | Result |
|-------|--------|
| All 8 `const parsed = {` blocks removed | PASS -- `grep 'const parsed = {' app/server/api/encounters/` returns 0 hits |
| `buildEncounterResponse` called correctly in all 8 | PASS -- all pass `(record, combatants)` with the correct record and combatants |
| Mutation endpoints use updated Prisma record | PASS -- see detailed analysis below |
| Error handling preserved/improved | PASS -- all upgraded from `error: any` to `error: unknown` with safe narrowing |
| Tests pass | PASS -- 640/640 Vitest unit tests pass |
| Resolution log updated | PASS -- ticket has detailed per-commit log |
| `gridConfig: null` behavioral change | NOT AN ISSUE -- already approved in code-review-006; 5 other endpoints already returned null when disabled, this just makes the remaining 8 consistent |

### Stale Record Analysis (Critical Check)

For endpoints that modify data before responding, it is essential that the *updated* Prisma record (not the stale pre-update record) is passed to `buildEncounterResponse`. Each mutation endpoint was verified:

| Endpoint | Record Source | Correct? |
|----------|--------------|----------|
| `serve.post.ts` | `prisma.$transaction` returns the updated record | Yes |
| `unserve.post.ts` | `prisma.encounter.update` return value | Yes |
| `[id].put.ts` | `prisma.encounter.update` return value | Yes |
| `next-turn.post.ts` | `const updatedRecord = await prisma.encounter.update(...)` | Yes |
| `from-scene.post.ts` | `const updatedEncounter = await prisma.encounter.update(...)` | Yes |
| `index.post.ts` | `prisma.encounter.create` return value (fresh record, no stale risk) | Yes |

For `next-turn.post.ts` specifically: the locally mutated `combatants` array (with `hasActed`, `tempConditions` cleared, etc.) is passed as the second argument. The builder uses this array directly rather than re-parsing `record.combatants`, so the response reflects the mutations. The `updatedRecord` carries the new `currentTurnIndex`, `currentRound`, and weather fields. This is correct.

### Error Handling Improvement

All 8 endpoints were upgraded from `catch (error: any)` to `catch (error: unknown)` with proper type narrowing:

```typescript
// Before (unsafe)
catch (error: any) {
  if (error.statusCode) throw error
  throw createError({ statusCode: 500, message: error.message || 'fallback' })
}

// After (safe)
catch (error: unknown) {
  if (error && typeof error === 'object' && 'statusCode' in error) throw error
  const message = error instanceof Error ? error.message : 'fallback'
  throw createError({ statusCode: 500, message })
}
```

This is a welcome bonus improvement. No `any` types remain in the modified endpoints.

### Commit Quality

4 refactor commits + 1 docs commit. Each commit modifies exactly 2 endpoint files grouped by similar patterns (read-only endpoints, serve/unserve, creation endpoints, mutation endpoints). Commit messages are descriptive and follow conventional commits. Good granularity.

### Issues Found

**MEDIUM: Missing type assertion on `combatants` in `next-turn.post.ts` (line 33)**

```typescript
// Current (line 33)
const combatants = JSON.parse(encounter.combatants)

// Should be
const combatants = JSON.parse(encounter.combatants) as Combatant[]
```

The other 5 endpoints that parse combatants locally (`served.get.ts`, `serve.post.ts`, `unserve.post.ts`, `[id].put.ts`, `from-scene.post.ts`) all include `as Combatant[]`. The `next-turn.post.ts` endpoint does not. This is a pre-existing issue (the old code also lacked the assertion), but since 5 sibling files now have it, the inconsistency is more visible. The lack of a type assertion means the `combatants` variable is typed as `any`, which suppresses type checking on the mutation block (lines 44-51) and the `combatants.find()` and `combatants.forEach()` calls.

**Verdict:** This is pre-existing and does not block approval. File a small follow-up if desired.

### Verdict: APPROVED

Clean, mechanical refactoring. All 8 endpoints correctly use the shared builder. Updated Prisma records are used in all mutation endpoints. Error handling was improved as a bonus. 640/640 tests pass. The one minor inconsistency (missing `as Combatant[]` in `next-turn.post.ts`) is pre-existing and cosmetic.

Net deletion: +63 / -258 lines across 8 files. The encounter API surface is now fully consolidated on `buildEncounterResponse` with zero remaining manual response construction.
