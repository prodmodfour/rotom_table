---
review_id: code-review-196
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-089, ptu-rule-090
domain: healing
commits_reviewed:
  - 75f9832
  - b0617ad
  - a7e6362
  - d0e870e
  - 1b472d5
files_reviewed:
  - app/server/services/rest-healing.service.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/pokemon/[id]/extended-rest.post.ts
  - app/tests/unit/services/restHealing.service.test.ts
  - artifacts/tickets/open/ptu-rule/ptu-rule-089.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-090.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T10:15:00Z
follows_up: null
---

## Review Scope

Two P3 healing tickets:

1. **ptu-rule-089**: Extended rest did not refresh daily-frequency moves for characters or their Pokemon. Fixed by extracting `refreshDailyMoves()` into a shared service, wiring it into both the character and Pokemon extended-rest endpoints, and adding 10 unit tests.

2. **ptu-rule-090**: Scene-end AP restoration allegedly not automated. Developer investigated and found all three code paths (scene deactivate, scene activate, encounter end) already call `restoreSceneAp()` or inline AP restoration. No code changes needed. Ticket updated with findings.

Decrees checked: decree-016 (extended rest clears only Drained AP, not Bound AP), decree-018 (extended rest accepts duration parameter), decree-019 (New Day is pure counter reset). All respected in the existing endpoint code. The new daily move refresh code does not interact with AP mechanics, so no decree violations.

## Issues

### MEDIUM

#### M1 -- `app-surface.md` not updated with new service file

**File:** `.claude/skills/references/app-surface.md`

The new `server/services/rest-healing.service.ts` introduces two exported functions (`refreshDailyMoves`, `refreshDailyMovesForOwnedPokemon`) that are part of the project's service layer. The `app-surface.md` reference lists all other service files (`pokemon-generator.service.ts`, `combatant.service.ts`, `encounter.service.ts`, etc.) but does not include this new one. Per project conventions, new services should be documented in the surface manifest so that other skills and reviewers can discover them.

**Required action:** Add a row for `server/services/rest-healing.service.ts` to the services section in `app-surface.md`, listing `refreshDailyMoves` and `refreshDailyMovesForOwnedPokemon` as exported functions.

#### M2 -- Ticket status set to `in-progress` instead of `resolved`

**Files:** `artifacts/tickets/open/ptu-rule/ptu-rule-089.md`, `artifacts/tickets/open/ptu-rule/ptu-rule-090.md`

Both tickets have `status: in-progress` but remain in the `open/` directory. Once the fix is reviewed and approved, these should move to `resolved/` with `status: resolved`. However, the tickets should not have been set to `in-progress` prior to review approval -- the fix log is present but the status transition is premature. This is a process nit rather than a code issue, but flagging it because the artifact lifecycle system depends on correct status values for pipeline routing.

**Required action:** After review approval, move both tickets to `artifacts/tickets/resolved/ptu-rule/` and set `status: resolved`.

## What Looks Good

1. **Clean extraction pattern.** The `refreshDailyMoves()` function is pure -- it takes a `Move[]` array and returns a new array with tracking data. No side effects, no database calls. This follows the project's SRP and DIP principles. The companion `refreshDailyMovesForOwnedPokemon()` handles the DB layer separately. This split makes the core logic trivially testable.

2. **Immutability correctly maintained.** The extracted function uses `moves.map()` with spread operators (`{ ...move, ... }`) to create new move objects. The test suite explicitly verifies input is not mutated (test: "does not mutate the input array"). The old inline code in the Pokemon endpoint used direct mutation (`move.usedToday = 0`), so this refactoring actually improves correctness.

3. **Behavioral equivalence verified.** I carefully compared the old inline code in `pokemon/[id]/extended-rest.post.ts` with the new `refreshDailyMoves()` function. The old code had an additional block resetting non-daily moves (`else if (!isDailyMove && move.usedToday > 0)`). However, inspecting `incrementMoveUsage()` in `moveFrequency.ts` confirms that only daily-frequency moves set `usedToday` -- EOT uses `lastTurnUsed`, Scene uses `usedThisScene`, and At-Will tracks nothing. The old non-daily reset was dead code in practice, so dropping it is safe.

4. **Rolling window logic is correct.** The function delegates to `isDailyMoveRefreshable(move.lastUsedAt)` from `utils/restHealing.ts`, which uses calendar day comparison via `toDateString()`. This correctly implements PTU Core p.252: "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." Moves used today are skipped; moves used yesterday or earlier are refreshed.

5. **Character endpoint correctly chains Pokemon refresh.** The character extended-rest endpoint calls `refreshDailyMovesForOwnedPokemon(id)` after the character DB update, which batch-refreshes daily moves for all Pokemon owned by that character. This is correct per PTU rules -- when a trainer takes an extended rest, their Pokemon benefit from the same rest. The `Promise.all` batching is efficient and only writes back Pokemon that actually had moves refreshed.

6. **Test coverage is thorough.** 10 tests covering: yesterday (refreshed), today (skipped/rolling window), Daily x2/x3 variants, non-daily moves untouched, unused daily moves, empty array, missing `lastUsedAt` (defaults to eligible), immutability, mixed sets, and `usedThisScene` reset. All key edge cases for the daily move refresh logic are covered.

7. **ptu-rule-090 investigation is sound.** The developer correctly identified that scene-end AP restoration was already implemented in all three relevant code paths: `scenes/[id]/deactivate.post.ts` (calls `restoreSceneAp`), `scenes/[id]/activate.post.ts` (calls `restoreSceneAp` for all active scenes before activating new one), and `encounters/[id]/end.post.ts` (inline AP restore with `calculateSceneEndAp`). I verified all three code paths and confirmed the claim.

8. **Commit granularity is excellent.** Five focused commits: extract service, wire into character endpoint, wire into Pokemon endpoint, add tests, update tickets. Each commit is a single logical change.

9. **Decree compliance verified.** Per decree-016, the character extended-rest endpoint correctly preserves `boundAp` (line 97: `currentAp: maxAp - character.boundAp`). Per decree-018, both endpoints accept a configurable duration parameter (4-8 hours, default 4). The daily move refresh does not interact with these mechanics.

## Verdict

**APPROVED**

The extraction of `refreshDailyMoves()` is clean, correct, well-tested, and properly wired into both endpoints. The behavioral regression risk from the refactoring is nil (verified by comparing old inline code with new function). The ptu-rule-090 finding is accurate -- scene-end AP restoration is already implemented. Two medium issues remain (app-surface update and ticket status cleanup) but these are documentation/process items that do not block the fix.

## Required Changes

None blocking. The two MEDIUM items (M1: app-surface update, M2: ticket status) should be addressed as follow-up housekeeping.
