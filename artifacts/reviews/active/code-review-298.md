---
review_id: code-review-298
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-021
domain: character-lifecycle
commits_reviewed:
  - 3912f8da
  - 6d54d85e
  - af9aa9fa
files_reviewed:
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - artifacts/tickets/open/feature/feature-021.md
  - .claude/skills/references/app-surface.md
  - app/tests/unit/utils/combatantCapabilities.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-03T08:02:00Z
follows_up: null
---

## Review Scope

Feature-021 (P2, character-lifecycle): Derive human trainer Overland and Swimming speeds from Athletics and Acrobatics skill ranks per PTU rules, replacing hardcoded defaults in the VTT movement system.

Three commits reviewed:
1. `3912f8da` -- Added `getHumanOverlandSpeed` and `getHumanSwimSpeed` private helpers in `combatantCapabilities.ts` that delegate to the pre-existing `computeTrainerDerivedStats` utility. Updated `getOverlandSpeed`, `getSwimSpeed`, and `combatantCanSwim` to use derived values for human combatants instead of hardcoded defaults (Overland=5, Swimming=0).
2. `6d54d85e` -- Updated `getTerrainAwareSpeed` and `getSpeed` in `useGridMovement.ts` to use derived trainer speeds for water terrain and the no-terrain fallback path, replacing `DEFAULT_MOVEMENT_SPEED` for humans.
3. `af9aa9fa` -- Documentation updates: ticket resolution log, app-surface.md entry for `trainerDerivedStats.ts`.

**Decrees checked:** decree-022 (branching class suffix), decree-026 (Martial Artist removal), decree-027 (Block Skill Edges for Pathetic), decree-037 (skill ranks via Edge slots only). None are violated by this implementation. The skill rank values used by `computeTrainerDerivedStats` are read-only from the stored `HumanCharacter.skills` record; the implementation does not grant or modify skill ranks.

## Issues

### HIGH

**HIGH-01: Redundant `computeTrainerDerivedStats` calls per combatant per movement query.**

`getHumanOverlandSpeed` and `getHumanSwimSpeed` each independently call `computeTrainerDerivedStats`, constructing the full derived stats object (Power, High Jump, Long Jump, Overland, Swimming, Throwing Range, Weight Class) just to extract a single field. In hot paths like `getMaxPossibleSpeed` (lines 214-219 of `useGridMovement.ts`), a single human combatant triggers up to 3 calls per movement query:
- `getOverlandSpeed` -> `computeTrainerDerivedStats` (1)
- `combatantCanSwim` -> `getHumanSwimSpeed` -> `computeTrainerDerivedStats` (2)
- `getSwimSpeed` -> `getHumanSwimSpeed` -> `computeTrainerDerivedStats` (3)

Similarly, `calculateAveragedSpeed` (lines 163-209 of `combatantCapabilities.ts`) calls both `getOverlandSpeed` and `getSwimSpeed` for mixed land/water paths, producing 2 redundant calls.

While `computeTrainerDerivedStats` is a pure function and not expensive in isolation, this pattern is called during flood-fill pathfinding (every reachable cell in movement range display) and A* path evaluation, amplifying the redundancy significantly for large grids.

**Fix:** Extract a single private helper that calls `computeTrainerDerivedStats` once and returns the full result, then have both `getHumanOverlandSpeed` and `getHumanSwimSpeed` use it. Alternatively, combine them into a single `getHumanDerivedSpeeds(human): { overland: number, swimming: number }` function and restructure the callers to use one call. Example:

```typescript
function getHumanDerivedSpeeds(human: HumanCharacter): { overland: number; swimming: number } {
  const derived = computeTrainerDerivedStats({
    skills: human.skills || {},
    weightKg: human.weight
  })
  return { overland: derived.overland, swimming: derived.swimming }
}
```

Then `getOverlandSpeed` and `getSwimSpeed` for the human branch share one call when both are needed in the same code path. The exported functions can keep their individual signatures.

**Files:** `app/utils/combatantCapabilities.ts` (lines 23-41)

### MEDIUM

**MED-01: No unit tests for the changed speed derivation functions.**

The existing `combatantCapabilities.test.ts` tests Naturewalk and Living Weapon functions but does NOT cover `getOverlandSpeed`, `getSwimSpeed`, or `combatantCanSwim` -- the three exported functions modified by this feature. The `makeHumanCombatant` test helper also omits the `skills` property on the entity, meaning the new code path (which reads `human.skills`) is entirely untested.

Required test cases:
1. `getOverlandSpeed` returns correct derived value for a human with specific Athletics/Acrobatics ranks (e.g., Athletics=Adept(4), Acrobatics=Novice(3) -> 3+floor(7/2) = 6).
2. `getSwimSpeed` returns correct derived value (floor(overland/2)).
3. `combatantCanSwim` returns `true` for any human (since Overland is always >= 4, Swimming is always >= 2).
4. `getOverlandSpeed` defaults to 5 when `human.skills` is `{}` (Untrained defaults: 3+floor(4/2)=5).
5. Pokemon paths remain unchanged (capabilities-based).

**Files:** `app/tests/unit/utils/combatantCapabilities.test.ts`

**MED-02: Ticket resolution log references wrong commit hashes.**

The resolution log in `feature-021.md` references commits `f822d987` and `311adc9d`, but the actual commits are `3912f8da` and `6d54d85e`. This likely happened because the commits were rebased or amended after the resolution log was drafted but before the docs commit. The hashes should match the final committed state for traceability.

**Files:** `artifacts/tickets/open/feature/feature-021.md` (lines 61, 66)

## What Looks Good

1. **Correct reuse of existing utility.** The implementation correctly identified that `computeTrainerDerivedStats` in `app/utils/trainerDerivedStats.ts` already implements all PTU formulas. Rather than duplicating formulas, the new code delegates to the single source of truth. This is exactly the right approach.

2. **PTU formula accuracy verified.** The Overland formula (`3 + floor((Athletics rank + Acrobatics rank) / 2)`) and Swimming formula (`floor(Overland / 2)`) match PTU Core p.16 exactly. The default comment (Untrained Athletics=2, Untrained Acrobatics=2 -> Overland=5) is correct and matches the book's stated default of 5.

3. **Correct behavioral change for `combatantCanSwim`.** Previously returned `false` for all humans, which was wrong per PTU -- trainers always have a Swimming speed derived from Overland. Now correctly returns `true` when derived swimming > 0, which is always true since minimum Overland is 4 (Pathetic skills: 3+floor(2/2)=4), giving minimum Swimming of 2.

4. **Downstream consumer analysis is thorough.** The resolution log correctly identifies all 4 downstream consumers of `getOverlandSpeed`/`getSwimSpeed` (mounting service, next-turn endpoint, MountControls, useGridMovement) and confirms they automatically benefit from the fix. I verified the claim by reading each consumer -- confirmed correct.

5. **Clean separation of concerns.** The `getTerrainAwareSpeed` change properly handles water terrain for humans via `getSwimSpeed(combatant)` while keeping the terrain cost blocking (Infinity for impassable terrain) in `getTerrainCostForCombatant`. Speed selection and terrain passability are correctly kept as separate concerns.

6. **Defensive coding.** `human.skills || {}` handles the case where skills might be undefined/null, which safely falls through to `skillRankToNumber(undefined)` returning 2 (Untrained). This produces the correct PTU default of Overland=5.

7. **Commit granularity is appropriate.** Three commits with clear separation: core utility change, VTT integration, documentation. Each commit produces a working state.

8. **app-surface.md updated.** The new entry for `trainerDerivedStats.ts` and the updated `combatantCapabilities.ts` description correctly document the new integration path.

## Verdict

**CHANGES_REQUIRED**

The implementation is correct in logic and PTU rule application. No decree violations. The code is well-structured and cleanly integrates with the existing utility. However, the redundant computation pattern (HIGH-01) should be consolidated before merge to avoid unnecessary work in hot pathfinding loops, and the changed functions need unit test coverage (MED-01).

## Required Changes

1. **HIGH-01:** Consolidate `getHumanOverlandSpeed` and `getHumanSwimSpeed` to avoid redundant `computeTrainerDerivedStats` calls. A single helper that returns both speeds is sufficient.
2. **MED-01:** Add unit tests for `getOverlandSpeed`, `getSwimSpeed`, and `combatantCanSwim` with human combatants that have `skills` set. Update the `makeHumanCombatant` helper to accept a `skills` parameter.
3. **MED-02:** Fix the commit hashes in the feature-021 resolution log to match the actual commits (`3912f8da` and `6d54d85e`).
