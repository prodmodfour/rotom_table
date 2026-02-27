---
review_id: rules-review-184
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-094+refactoring-089+refactoring-090
domain: healing
commits_reviewed:
  - ac5b40b
  - 87f9f64
  - ee00288
mechanics_verified:
  - natural-healing-formula
  - extended-rest-move-refresh
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Resting
  - core/06-playing-the-game.md#System-Fundamentals
  - errata-2.md#Nurse
decrees_checked:
  - decree-016 (extended rest clears only Drained AP)
  - decree-017 (Pokemon Center heals to effective max HP)
  - decree-018 (extended rest accepts duration parameter)
  - decree-019 (New Day is pure counter reset)
  - decree-020 (Pokemon Center time uses pre-healing injury count)
reviewed_at: 2026-02-27T16:30:00Z
follows_up: (none -- first review)
---

## Mechanics Verified

### Natural Healing Formula (ptu-rule-094)

- **Rule:** "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points." (`core/07-combat.md`, p.252). System Fundamentals rule 1: "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher." (`core/06-playing-the-game.md`, p.219).
- **Key observation:** PTU specifies "1/16th of their Maximum Hit Points" with the universal rounding-down rule. There is no "minimum 1 HP" clause anywhere in the resting section or in the errata. The errata Nurse feature references "1/8th of their Max Hit Points per half hour of rest instead of 1/16th" which confirms the base rate is 1/16th with no minimum.
- **Implementation (before fix):** `Math.max(1, Math.floor(maxHp / 16))` -- this artificially imposed a minimum of 1 HP per rest period, which is not in the rules.
- **Implementation (after fix, commit ac5b40b):** `Math.floor(maxHp / 16)` in both `calculateRestHealing()` (line 66) and `getRestHealingInfo()` (line 175) in `app/utils/restHealing.ts`.
- **Test coverage:** Test case "heals 0 HP for very low maxHp" verifies that an entity with maxHp=10 heals 0 per rest (`floor(10/16) = 0`). The comment correctly references the PTU rounding rule.
- **Status:** CORRECT

**Minor note on commit message:** The commit cites "PTU p.31" for the floor rounding rule. The actual location is Chapter 6, p.219 (System Fundamentals, rule 1). This is a documentation-only inaccuracy in the commit message and code comments (lines 65 and 174 of `restHealing.ts` say "PTU p.31"). It does not affect correctness. The rule itself is correctly applied.

### Extended Rest Move Refresh (refactoring-090)

- **Rule:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." (`core/07-combat.md`, p.252).
- **Implementation (commit 87f9f64):** `refreshDailyMoves()` in `app/server/services/rest-healing.service.ts` correctly:
  1. Identifies daily moves via `move.frequency?.startsWith('Daily')` -- catches Daily, Daily x2, Daily x3.
  2. Applies the rolling window check via `isDailyMoveRefreshable(move.lastUsedAt)` which compares the last-used date to today's calendar date. A move used today is NOT refreshed (honoring "hasn't been used since the previous day").
  3. Resets `usedToday: 0`, `lastUsedAt: undefined`, and `usedThisScene: 0` for refreshed daily moves.
  4. **New behavior (refactoring-090):** Also resets `usedToday: 0` on non-daily moves (At-Will, EOT, Scene) when `usedToday > 0`. This is pure data hygiene -- these frequencies are enforced by `lastTurnUsed` and `usedThisScene`, not `usedToday`. The stale value has no gameplay effect, but cleaning it during rest is correct housekeeping.
- **PTU compliance of non-daily cleanup:** PTU says nothing about a `usedToday` field for non-daily moves because it is an implementation detail. Clearing it during extended rest cannot produce incorrect game behavior because non-daily frequency enforcement never reads this field. The cleanup only fires when `usedToday > 0`, preserving unchanged objects when no cleanup is needed.
- **Immutability:** The function uses `moves.map()` with spread operators (`{ ...move, usedToday: 0 }`) and never mutates input. Verified by the "does not mutate the input array" test case.
- **DB write-back guard:** `refreshDailyMovesForOwnedPokemon()` now checks `restoredMoves.length > 0 || cleanedNonDaily > 0` before issuing a DB update, ensuring no unnecessary writes for Pokemon with no changes.
- **Test coverage:** 10 test cases in `restHealing.service.test.ts` covering: refresh yesterday's daily move, skip today's daily move, Daily x2/x3 variants, non-daily moves with usedToday=0 (untouched), non-daily moves with stale usedToday (cleaned), unused daily move (no-op), empty array, missing lastUsedAt, immutability, and mixed scenarios.
- **Status:** CORRECT

### App Surface Manifest (refactoring-089)

- **Change (commit ee00288):** Added `server/services/rest-healing.service.ts` to the services table in `app-surface.md` with description "Extended rest move refresh -- refreshDailyMoves, refreshDailyMovesForOwnedPokemon".
- **Accuracy:** Both listed exports (`refreshDailyMoves`, `refreshDailyMovesForOwnedPokemon`) are the actual public exports of the service file. The description accurately reflects the service's purpose.
- **Status:** CORRECT

## Decree Compliance

All five healing-domain decrees (016-020) were checked against this changeset:

- **decree-016** (extended rest clears only Drained AP): Not affected by these changes. Move refresh logic does not touch AP.
- **decree-017** (Pokemon Center heals to effective max HP): Not affected. `calculateRestHealing()` already uses `getEffectiveMaxHp()` as the healing cap, which was not modified.
- **decree-018** (extended rest accepts duration parameter): Not affected. These changes are to the healing formula and move refresh, not the duration parameter.
- **decree-019** (New Day is pure counter reset): Not affected. Move refresh occurs during extended rest, not New Day.
- **decree-020** (Pokemon Center time uses pre-healing count): Not affected. `calculatePokemonCenterTime()` was not modified.

No decree violations found.

## Summary

All three commits in this cluster are PTU-correct:

1. **ac5b40b** correctly removes the non-RAW `Math.max(1, ...)` minimum from natural healing. PTU specifies `floor(maxHp / 16)` with the universal round-down rule and no minimum. An entity with fewer than 16 max HP heals 0 per rest period, which is the correct RAW behavior.

2. **87f9f64** adds a harmless data hygiene cleanup for non-daily moves during extended rest. The daily move refresh logic itself was already correct (rolling window, frequency matching, immutability). The new cleanup cannot produce incorrect game outcomes because non-daily frequency enforcement uses separate fields.

3. **ee00288** accurately documents the rest-healing service in the app surface manifest.

## Rulings

- **Natural healing has no minimum per PTU RAW.** The universal rounding rule (p.219) applies: `floor(maxHp / 16)`. For entities with maxHp < 16, this produces 0. There is no clause in the Resting section, errata, or any related feature that establishes a minimum healing amount for standard rest. This is confirmed by the errata Nurse feature which describes upgrading from 1/16th to 1/8th without mentioning any minimum floor.

- **Non-daily move usedToday cleanup is rules-neutral.** PTU does not define `usedToday` tracking for non-daily frequencies. Clearing this implementation-detail field during extended rest has no rules impact and is purely a data quality improvement.

## Verdict

**APPROVED** -- No issues found. All mechanics match PTU 1.05 RAW. No decree violations.

## Required Changes

None.
