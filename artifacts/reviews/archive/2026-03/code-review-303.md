---
review_id: code-review-303
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-021
domain: character-lifecycle
commits_reviewed:
  - e670e023
  - 7229ec97
  - 80b31073
  - 6d54d85e
  - 3912f8da
files_reviewed:
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - app/tests/unit/utils/combatantCapabilities.test.ts
  - app/utils/trainerDerivedStats.ts
  - artifacts/tickets/open/feature/feature-021.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-03T17:15:00Z
follows_up: code-review-298
---

## Review Scope

Re-review of feature-021 (Derived Capability Calculations) fix cycle addressing all 3 issues from code-review-298 (1 HIGH, 2 MEDIUM). The fix cycle consolidated redundant `computeTrainerDerivedStats` calls (HIGH-01), added unit tests for speed derivation functions (MED-01), and attempted to fix commit hashes in the resolution log (MED-02). Additionally, bug-045 regression test was included (commit 80b31073).

**Decrees checked:** decree-011 (speed averaging across terrain boundaries), decree-022 (branching class suffix), decree-027 (Pathetic skill blocking), decree-037 (skill ranks from Edge slots only). No violations found. The implementation reads skill ranks from `HumanCharacter.skills` without modifying them, per decree-037.

## Resolution Verification

### HIGH-01 (RESOLVED): Redundant computeTrainerDerivedStats calls

**Status: Properly resolved.**

The developer replaced the separate `getHumanOverlandSpeed` and `getHumanSwimSpeed` private helpers with a single exported `getHumanDerivedSpeeds(human: HumanCharacter): { overland, swimming }` function (lines 28-34 of `combatantCapabilities.ts`). This function calls `computeTrainerDerivedStats` exactly once and returns both speeds.

The critical hot path in `getMaxPossibleSpeed` (lines 219-229 of `useGridMovement.ts`) now correctly branches on `combatant.type === 'human'` and makes a single `getHumanDerivedSpeeds` call, pushing both overland and swimming speeds into the `speeds` array without any redundant derivation. Previously this path triggered 3 separate `computeTrainerDerivedStats` calls per human combatant per movement query during flood-fill.

The `combatantCanSwim` simplification (returning `true` for all humans instead of computing swimming speed) is correct: minimum Overland for Pathetic-in-both-skills is 4, giving minimum Swimming of 2. Verified against PTU Core p.16.

Note: `getOverlandSpeed` and `getSwimSpeed` still independently call `getHumanDerivedSpeeds` (lines 97, 110), which means `calculateAveragedSpeed` still makes 2 derivation calls when both overland and swim are needed for mixed terrain. This is acceptable because: (1) the hot flood-fill path was the target of HIGH-01 and is now fixed, (2) `calculateAveragedSpeed` is called once per path evaluation with a `seenCapabilities` guard, not per-cell, and (3) `computeTrainerDerivedStats` is a pure arithmetic function with negligible cost outside the flood-fill context.

### MED-01 (RESOLVED): Unit tests for speed derivation functions

**Status: Properly resolved.**

The developer added 16 test cases (not 17 as stated in the resolution log) across 4 `describe` blocks covering:

1. `getOverlandSpeed -- human trainer` (5 tests): Adept/Novice, Expert/Expert, Master/Master, empty skills (Untrained defaults), Pathetic/Pathetic. All assertions verified against PTU Core p.16 formula.
2. `getSwimSpeed -- human trainer` (3 tests): Derived from Overland via floor(overland/2). Covers even and odd Overland values.
3. `combatantCanSwim` (4 tests): Human always true (2 cases including Pathetic), Pokemon with swim > 0 true, Pokemon with swim = 0 false.
4. `getOverlandSpeed / getSwimSpeed -- Pokemon paths unchanged` (4 tests): Pokemon capabilities-based values unchanged, defaults when capabilities missing.

The `makeHumanCombatant` helper was updated to accept a `skills` parameter (line 71), correctly wiring it into `entity.skills` (line 105).

All required test cases from code-review-298 MED-01 are covered:
- Specific skill rank derivation: covered (Adept/Novice -> 6)
- floor(overland/2) for swimming: covered
- combatantCanSwim true for all humans: covered (including Pathetic edge case)
- Default to 5 for empty skills: covered
- Pokemon paths unchanged: covered (4 tests)

### MED-02 (NOT FULLY RESOLVED): Commit hashes in resolution log

**Status: Partially resolved.** The original commit hashes for the P2 implementation (commits 1 and 2 in the resolution log) were corrected from `f822d987` -> `3912f8da` and `311adc9d` -> `6d54d85e`. However, the fix cycle section (commits 3, 4, 5) now references commit hashes `013d35bd`, `908c4c8a`, and `039a043c`, none of which exist in the repository. The actual commits are `7229ec97` (refactor), `e670e023` (tests), and no commit matching `039a043c` exists at all. This is likely due to the same rebase/amend issue that caused the original MED-02.

## Issues

### MEDIUM

**MED-01: Fix cycle commit hashes in resolution log are wrong (recurring MED-02).**

The resolution log section "Fix Cycle (2026-03-03) -- code-review-298" at lines 87-99 of `feature-021.md` references three commit hashes that do not exist in the repository:

- `013d35bd` (should be `7229ec97`) -- refactor commit
- `908c4c8a` (should be `e670e023`) -- test commit
- `039a043c` -- docs commit; no matching commit found

Additionally, the log states "17 test cases" but the actual count is 16.

**Files:** `artifacts/tickets/open/feature/feature-021.md` (lines 87-99)

## What Looks Good

1. **HIGH-01 consolidation is clean and correct.** The `getHumanDerivedSpeeds` function signature matches exactly what code-review-298 suggested. The hot path optimization in `getMaxPossibleSpeed` is well-structured with a clear `human` vs `pokemon` branch that avoids redundant derivation.

2. **Test coverage is comprehensive and meaningful.** All 16 tests verify concrete PTU rule calculations with correct expected values. The Pathetic/Pathetic edge case (Overland=4, minimum possible) is especially valuable. The Pokemon regression tests ensure the refactoring didn't alter the capabilities-based path.

3. **combatantCanSwim simplification is well-reasoned.** Replacing the computed check with `return true` for humans is correct and eliminates an unnecessary derivation call. The comment explains the reasoning (minimum Overland=4, minimum Swimming=2).

4. **No regressions introduced.** The `getOverlandSpeed` and `getSwimSpeed` individual signatures are preserved for downstream callers (mounting.service.ts, next-turn.post.ts, calculateAveragedSpeed). The refactoring is purely internal to the consolidation without changing any public API contracts.

5. **Bug-045 regression test (commit 80b31073) is well-scoped.** Verifies the entityId->combatantId fix in `availableTrainers` mapping, which is orthogonal to feature-021 but correctly included in the same review cycle.

6. **Commit granularity is appropriate.** Refactoring and tests are in separate commits, each producing a working state.

## Verdict

**APPROVED**

All three issues from code-review-298 are substantively resolved. HIGH-01 (the only issue with runtime impact) is properly fixed. MED-01 (unit tests) is thoroughly addressed with meaningful coverage. The remaining MED-01 (wrong commit hashes in the resolution log, recurring from MED-02) is a documentation-only issue that does not affect code correctness, runtime behavior, or test coverage. It should be fixed but is not blocking.

## Required Changes

None blocking. The following should be addressed as cleanup:

1. **MED-01:** Correct the fix cycle commit hashes in `feature-021.md` lines 87-99 to reference the actual commits: `013d35bd` -> `7229ec97`, `908c4c8a` -> `e670e023`. Remove or correct the `039a043c` reference. Update "17 test cases" to "16 test cases".
