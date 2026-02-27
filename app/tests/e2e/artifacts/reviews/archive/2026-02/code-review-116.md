---
review_id: code-review-116
target: refactoring-056
trigger: refactoring
verdict: APPROVED
reviewed_commits: [1940e7a, f55eb5b, d978490]
reviewed_files:
  - app/server/services/encounter-generation.service.ts
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/tests/unit/services/encounterGeneration.test.ts
date: 2026-02-20
reviewer: senior-reviewer
---

## Summary

Clean extraction of encounter generation logic from an H3 API endpoint into a pure, testable service. The refactoring is behavior-preserving -- the service code is a line-for-line match of the original inline logic, with the only addition being an injectable `randomFn` parameter for deterministic testing. The 37 unit tests are well-structured, use deterministic RNG, and cover the diversity enforcement algorithm thoroughly. All 37 tests pass.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

**M1: Pre-existing weighted selection bug with `random = 0` and zero-weight entries (not a regression)**

In `encounter-generation.service.ts` lines 122-132, the selection loop uses `random <= 0` as the break condition. When `randomFn()` returns exactly `0`, `random` starts at `0`, and the first entry is selected even if its effective weight is `0` (i.e., it is capped). The developer correctly identified this in the test file at line 399 ("rng=0 is a degenerate case where random=0*weight=0 and 0<=0 is always true, bypassing weighted selection") and worked around it by using `rng=0.01`.

This is pre-existing -- the original endpoint had the identical `<= 0` condition. It is not a regression from this refactoring. However, the service should eventually be hardened to skip zero-weight entries in the selection loop, or use `< 0` with a separate fallback for the last entry. Filing as a new ticket.

## New Tickets Filed

**refactoring-056-followup: Harden weighted selection against zero-weight entries at `random = 0`**

The selection loop in `generateEncounterPokemon` can select a capped (zero-weight) entry when `randomFn()` returns exactly `0`. Fix: skip entries with `w === 0` in the selection loop, or change the break condition from `<= 0` to `< 0` with a guaranteed fallback to the last non-zero-weight entry. Low priority since `Math.random() === 0` is vanishingly rare in production, but it's a correctness gap that could manifest in testing or with custom RNG functions.

## What Looks Good

1. **Behavior-preserving extraction.** Verified via `git diff 1940e7a~1..1940e7a` that every line of the spawn count calculation, weighted selection loop, diversity enforcement (exponential decay + per-species cap), single-species bypass, fallback guard, and level calculation was extracted verbatim. The endpoint now delegates to the service without any logic changes. The entry pool construction and Prisma query remain in the endpoint where they belong.

2. **Injectable RNG pattern.** The `randomFn` parameter with `Math.random` default is a clean dependency inversion that makes all randomness deterministic in tests without mocking globals. This is the first service in the codebase to use this pattern -- it sets a good precedent for `pokemon-generator.service.ts` and others.

3. **Thorough test coverage of the diversity algorithm.** The 37 tests cover: (a) spawn count with all density tiers, multiplier scaling, override clamping, and MAX_SPAWN_COUNT cap; (b) weighted random selection with boundary RNG values; (c) exponential decay with step-by-step RNG sequencing that traces through the exact arithmetic; (d) per-species cap with even/odd counts and multi-species pools; (e) edge cases (single-species pool skips diversity, zero count, fallback guard). The `sequentialRng` helper is particularly well-designed for tracing multi-draw behavior.

4. **Deterministic RNG usage.** 34 of 37 tests use `constantRng` or `sequentialRng` for full reproducibility. The 3 statistical tests (lines 272, 356, and 579) use real `Math.random` with generous assertion thresholds, making flakiness negligible.

5. **Clean file organization.** The service (155 lines), endpoint (151 lines), and test file (715 lines) are all within size limits. The service exports well-defined types (`PoolEntry`, `GeneratedPokemon`, `GenerateEncounterInput`, `CalculateSpawnCountInput`) that the endpoint imports directly.

6. **Endpoint retains its own validation layer.** The endpoint still performs the empty-pool check with `createError` (400 status) before calling the service, so the service's `throw new Error(...)` is a defensive-in-depth guard that would only surface as a 500 via the catch block. This is correct layering.

7. **Resolution Log updated.** The ticket documents the approach, all 37 tests with category breakdowns, and the 3 files changed.

## Verdict

**APPROVED.** This is a textbook service extraction -- the behavior is preserved exactly, the service is pure and testable, the tests are thorough with deterministic RNG, and the code is well within size limits. The one medium-severity finding (M1) is a pre-existing bug, not a regression from this work.
