---
ticket_id: refactoring-056
priority: P3
status: resolved
category: TEST-GAP
source: code-review-108
created_at: 2026-02-20
created_by: orchestrator
resolved_at: 2026-02-20
---

## Summary

No unit tests exist for the encounter generation API endpoint (`/api/encounter-tables/[id]/generate.post.ts`). The existing `encounterTables.test.ts` covers the Pinia store, not the server route. The endpoint now contains non-trivial logic (species diversity enforcement with exponential decay + per-species cap) that should have test coverage.

## Affected Files

- `app/server/api/encounter-tables/[id]/generate.post.ts` — the endpoint with diversity logic
- `app/tests/unit/` — no corresponding test file exists

## Suggested Fix

Add a Vitest unit test file that covers:
1. Basic weighted random selection (single species pool, multi-species pool)
2. Species diversity enforcement (verify cap is respected, verify decay reduces repeats)
3. Edge cases (single-species pool skips diversity, all-capped fallback)

## Resolution Log

**Approach:** Extracted the pure generation logic from the H3 endpoint into a testable service (`encounter-generation.service.ts`), then wrote 37 unit tests against it.

**Refactoring:**
- Created `app/server/services/encounter-generation.service.ts` with two exported functions:
  - `calculateSpawnCount()` — density-based spawn count with override support
  - `generateEncounterPokemon()` — weighted random selection with diversity enforcement
- Both accept an injectable `randomFn` parameter (defaults to `Math.random`) for deterministic testing
- Refactored `generate.post.ts` to delegate to the service (same behavior, now testable)

**Test coverage (37 tests):**
- `calculateSpawnCount`: 11 tests — override clamping, density tier ranges, multiplier scaling, MAX_SPAWN_COUNT cap, edge cases
- `generateEncounterPokemon` — error handling: 2 tests (empty pool, zero weight)
- `generateEncounterPokemon` — output shape: 5 tests (count, structure, level ranges, entry-level override vs table fallback)
- `generateEncounterPokemon` — weighted selection: 3 tests (low/high rng, statistical weight ratio)
- `generateEncounterPokemon` — exponential decay: 3 tests (single decay, cumulative decay, statistical diversity)
- `generateEncounterPokemon` — per-species cap: 4 tests (even count, odd count, count=1, three-species pool)
- `generateEncounterPokemon` — edge cases: 5 tests (single-species skips diversity, single species fills all slots, fallback guard, skewed rng fallback, zero count)
- `generateEncounterPokemon` — misc: 4 tests (source preservation, fixed level, mixed level overrides)

**Files changed:**
- `app/server/services/encounter-generation.service.ts` (new)
- `app/server/api/encounter-tables/[id]/generate.post.ts` (refactored to use service)
- `app/tests/unit/services/encounterGeneration.test.ts` (new, 37 tests)
