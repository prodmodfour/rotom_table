---
review_id: code-review-117
target: ptu-rule-055
trigger: design-implementation
verdict: CHANGES_REQUIRED
reviewed_commits: [ef6a3b8, fb043aa, 5ea8850, e3b0203, ecc3bac, b4ec379]
reviewed_files:
  - app/utils/experienceCalculation.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/types/encounter.ts
  - app/server/services/encounter.service.ts
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

P0 implementation of the XP system (design-xp-system-001, ptu-rule-055) covering: pure XP calculation utility, read-only preview endpoint, write distribution endpoint, and `type` field addition to `defeatedEnemies`. Six commits reviewed. The utility is clean, well-structured, and correctly follows the `captureRate.ts` pattern. The experience chart was spot-checked against PTU Core p.203 and all values match. The rounding-down behavior is correctly implemented via `Math.floor()` at both the multiplication and division steps. There is one HIGH issue that must be fixed before merge.

## Issues

### CRITICAL

None.

### HIGH

**H1: Duplicate pokemonId in distribution array causes silent data loss (xp-distribute.post.ts:158-198)**

If the `distribution` array contains the same `pokemonId` twice (e.g., the client accidentally sends two entries for the same Pokemon), both iterations read from `pokemonMap` which holds the *original* DB values. Both `prisma.pokemon.update` calls target the same record via `Promise.all`, creating a race condition where whichever resolves last wins. The losing update's XP is silently discarded.

The same race applies to `tutorPoints` (line 185): both updates compute `originalTutorPoints + thisGain` rather than cumulative gain.

**Fix:** Add a deduplication check at the start of the distribution validation:

```typescript
const seenPokemonIds = new Set<string>()
for (const entry of body.distribution) {
  if (seenPokemonIds.has(entry.pokemonId)) {
    throw createError({
      statusCode: 400,
      message: `Duplicate pokemonId in distribution: ${entry.pokemonId}. Merge XP amounts into a single entry.`
    })
  }
  seenPokemonIds.add(entry.pokemonId)
}
```

Alternatively, merge duplicates before processing (sum their `xpAmount` values), but rejecting is safer since duplicates likely indicate a client bug.

### MEDIUM

**M1: Total-pool XP validation instead of per-player validation (xp-distribute.post.ts:96-108)**

The design spec says: "The sum of xpAmount across all Pokemon belonging to the same player must not exceed totalXpPerPlayer." The implementation validates `totalDistributed <= totalXpPerPlayer * playerCount`, which is a pool-level check. This means Player A could receive 0 XP while Player B receives 2x their share, as long as the total fits.

This is an acceptable simplification given that the distribution request body has no player-grouping data (just flat `pokemonId` + `xpAmount` pairs), and the design itself says "unless GM explicitly overrides." However, per-player validation should be added in P1 when the UI knows which Pokemon belong to which player.

**Action:** Add a TODO comment in the code noting the per-player validation gap, and ensure the P1 UI modal handles this client-side.

**M2: `app-surface.md` not updated with new endpoints**

The two new endpoints (`POST /api/encounters/:id/xp-calculate`, `POST /api/encounters/:id/xp-distribute`) are not registered in `.claude/skills/references/app-surface.md`. This reference document is used by other skills and analysis tools. Must be updated.

**M3: Duplicated defeated-enemies enrichment logic across both endpoints**

The `rawDefeatedEnemies` parsing, `trainerEnemyIds` handling, and `DefeatedEnemy[]` enrichment logic (lines 44-59 of xp-calculate, lines 77-87 of xp-distribute) is identical copy-paste. This should be extracted to a shared helper in the encounter service or the experienceCalculation utility:

```typescript
export function enrichDefeatedEnemies(
  raw: { species: string; level: number; type?: 'pokemon' | 'human' }[],
  trainerEnemyIds: string[] = []
): DefeatedEnemy[]
```

## New Tickets Filed

None required -- M1 (per-player validation) is explicitly deferred to P1 in the design spec. M2 and M3 are actionable fixes within this review cycle.

## What Looks Good

1. **Pure utility follows the established pattern.** `experienceCalculation.ts` mirrors `captureRate.ts` precisely: typed input, typed result with full breakdown, zero side effects, clear JSDoc. Well done.

2. **Correct reuse of `checkLevelUp()`.** Instead of duplicating level-up detection logic, the utility delegates to the existing `levelUpCheck.ts` and maps the result to the design's `LevelUpEvent` type. The design deviation (returning `Omit<XpApplicationResult, 'pokemonId' | 'species'>`) is well-documented and sensible -- a pure function shouldn't know entity identity.

3. **Experience chart verified against PTU Core p.203.** All 100 values spot-checked. Level 100 = 20,555 matches the book exactly.

4. **Robust input validation on both endpoints.** `significanceMultiplier` range (0.5-10), `playerCount` positive integer, `xpAmount` non-negative integer, `pokemonId` string -- all validated server-side before any processing.

5. **Level 100 cap correctly enforced.** `MAX_EXPERIENCE` constant used in both `calculateLevelUps()` (`Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`) and the distribution endpoint (`Math.min(levelResult.newExperience, MAX_EXPERIENCE)`). The double-cap is redundant but harmless -- defense in depth.

6. **Backwards compatibility for legacy `defeatedEnemies`.** The `type` field is optional (`type?: 'pokemon' | 'human'`), and both endpoints handle legacy entries gracefully via the `trainerEnemyIds` fallback or defaulting `isTrainer` to `false`.

7. **Clean commit granularity.** Six commits, each focused on a single logical change: utility, type fix, preview endpoint, write endpoint, docs, cleanup. Textbook.

8. **Rounding behavior correct.** `Math.floor()` applied after both multiplication (line 228) and division (line 233), matching PTU convention of always rounding XP down.

9. **Boss encounter handling correct.** When `isBossEncounter` is true, `perPlayerXp = multipliedXp` (no division by players), per PTU Core p.489.

10. **Preview endpoint is truly read-only.** `xp-calculate.post.ts` performs zero database writes -- it loads encounter data, calculates, and returns. Correct separation from the write path.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue (H1: duplicate pokemonId race condition) must be fixed before this can be approved. The fix is a 5-line validation guard. M2 (app-surface update) and M3 (extract shared enrichment logic) should be addressed in the same pass.
