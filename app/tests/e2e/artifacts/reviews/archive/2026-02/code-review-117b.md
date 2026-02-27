---
review_id: code-review-117b
target: ptu-rule-055
trigger: follow-up
follows_up: code-review-117
verdict: APPROVED
reviewed_commits: [ff36de0, 4dac196, 1df3717, c062fb0, 291f4a8]
reviewed_files:
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/utils/experienceCalculation.ts
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/designs/design-xp-system-001.md
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

Five commits addressing all four issues raised in code-review-117 (H1, M1, M2, M3). Each fix is minimal, correct, and introduces no new issues. The duplicate pokemonId guard (H1) was the only blocking item and it is resolved cleanly. The three MEDIUM items are all addressed satisfactorily. A fifth commit updates the design spec's implementation log, which is good bookkeeping.

## H1 Resolution (Duplicate pokemonId guard)

**Status: RESOLVED**

Commit `ff36de0` adds the deduplication check at lines 59-70 of `xp-distribute.post.ts`. Verified:

1. **Position in validation chain:** The guard runs *after* basic array validation (line 52: `distribution` must be a non-empty array) and *before* per-entry field validation (line 72: pokemonId string check, xpAmount integer check). This is the correct position -- it validates the array's structural integrity before inspecting individual field types.

2. **Returns 400:** `createError({ statusCode: 400, message: ... })` with a clear message naming the duplicate pokemonId and instructing the caller to merge entries.

3. **Uses `Set<string>`:** O(n) check, no over-engineering. The `entry.pokemonId` is checked against the set before being added, catching duplicates on the second occurrence.

4. **Comment references the original issue:** `// (H1, code-review-117)` -- good traceability.

No concerns with this fix.

## M3 Resolution (Shared enrichment helper)

**Status: RESOLVED**

Commit `4dac196` extracts `enrichDefeatedEnemies()` and the `RawDefeatedEnemy` interface into `experienceCalculation.ts` (lines 148-181). Verified:

1. **Function signature matches the review suggestion:** `enrichDefeatedEnemies(raw: RawDefeatedEnemy[], trainerEnemyIds: string[] = []): DefeatedEnemy[]`. The default parameter `[]` for `trainerEnemyIds` is correct -- callers can omit it when no legacy trainer IDs are present.

2. **Both endpoints now use the shared helper:**
   - `xp-calculate.post.ts` line 46: `enrichDefeatedEnemies(rawDefeatedEnemies, body.trainerEnemyIds)`
   - `xp-distribute.post.ts` line 93: `enrichDefeatedEnemies(rawDefeatedEnemies, body.trainerEnemyIds)`

3. **No stale imports:** Old `DefeatedEnemy` type imports removed from both endpoints. `xp-calculate.post.ts` imports `{ calculateEncounterXp, enrichDefeatedEnemies }` (runtime) and `type { RawDefeatedEnemy }` (type-only). `xp-distribute.post.ts` imports `{ calculateEncounterXp, calculateLevelUps, enrichDefeatedEnemies, MAX_EXPERIENCE }` (runtime) and `type { RawDefeatedEnemy, XpApplicationResult }` (type-only).

4. **Logic is identical to the original inline code.** The `map` body (`entry.type === 'human' || trainerEnemyIds.includes(String(index))`) is unchanged. No behavioral difference.

5. **JSDoc is thorough.** Documents the three-tier isTrainer determination (type field, trainerEnemyIds fallback, default false) and the parameter meanings.

6. **`RawDefeatedEnemy` type is exported.** Both endpoints import it for the `JSON.parse()` type annotation, which is correct -- it documents the expected shape of the serialized data.

Net line delta: +41 added in the utility, -29 removed from the two endpoints. The 12-line increase is the interface definition and JSDoc, which is appropriate.

## M2 Resolution (app-surface.md)

**Status: RESOLVED**

Commit `1df3717` adds two lines to `.claude/skills/references/app-surface.md` at lines 102-103, inside the Encounters API section:

```
- `POST /api/encounters/:id/xp-calculate` — preview XP calculation (read-only breakdown + participating Pokemon)
- `POST /api/encounters/:id/xp-distribute` — apply XP to Pokemon (updates experience, level, tutorPoints)
```

Placement is correct (after `wild-spawn`, before `Encounter Templates` section). Descriptions accurately summarize each endpoint's purpose. Format matches the existing entries.

## M1 Resolution (TODO comment)

**Status: RESOLVED**

Commit `c062fb0` adds a 6-line TODO comment at lines 104-109 of `xp-distribute.post.ts`:

```
// TODO (P1): Add per-player XP validation when the UI provides player grouping.
// Currently this is a pool-level check — Player A could receive 0 XP while
// Player B receives 2x their share. The distribution request body has no
// player-grouping data (just flat pokemonId + xpAmount pairs), so per-player
// enforcement requires the P1 XpDistributionModal to include owner info.
// See design-xp-system-001 section D and M1 from code-review-117.
```

The comment is placed directly above the pool-level validation logic (`const totalDistributed = ...`), which is the exact location where per-player validation would be inserted. It references the design spec section and the original review issue, making it easy for a future developer to find context.

## New Issues Found

None. The five commits are tightly scoped to the four review items. No new logic was introduced beyond the fixes. No regressions observed:

- The `enrichDefeatedEnemies()` function is pure (no side effects, no DB calls) and correctly placed in the utility file alongside the other pure XP functions.
- Import graphs are clean -- no circular dependencies, no unused imports.
- The design spec implementation log (commit `291f4a8`) correctly records all four fix commits with their review issue references.

## Verdict

**APPROVED**

All four issues from code-review-117 are resolved correctly. H1 (duplicate pokemonId race condition) is fixed with an early validation guard. M3 (duplicated enrichment logic) is extracted into a well-documented shared helper. M2 (app-surface.md) is updated with accurate endpoint descriptions. M1 (TODO comment) clearly documents the per-player validation gap with design and review references. No new issues introduced.
