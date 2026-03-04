---
review_id: rules-review-192
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-038+bug-039
domain: healing+capture
commits_reviewed:
  - 68325a5
  - cef3eb4
  - 65b4c96
  - dceb7d1
  - d98c4c9
  - afd453a
  - 015fdd0
mechanics_verified:
  - new-day-bound-ap-preservation
  - new-day-drained-ap-reset
  - new-day-current-ap-calculation
  - per-character-new-day-bound-ap
  - encounter-end-bound-ap-clearing
  - scene-end-bound-ap-clearing
  - capture-ownership-guard
  - capture-rate-read-only-safety
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/06-playing-the-game.md#Action-Points-(p221)
  - core/07-combat.md#Resting-(p252)
  - core/03-skills-edges-and-features.md#Stratagem-(p61)
  - core/05-pokemon.md#Capturing-Pokemon-(p214)
reviewed_at: 2026-02-28T18:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. New Day -- Bound AP Preservation (bug-038, global endpoint)

- **Rule:** "Bound Action Points remain off-limits until the effect that Bound them ends, as specified by the Feature or effect." (`core/06-playing-the-game.md` lines 226-229, PTU p.221)
- **Decrees:** decree-016 ("Extended rest clears only Drained AP, not Bound AP"), decree-019 ("New Day is a pure counter reset, no implicit extended rest"), decree-028 ("Bound AP persists across New Day")
- **Implementation:** `app/server/api/game/new-day.post.ts` fetches all characters with `{ id, level, boundAp }`, then performs per-character updates within a `$transaction`. The update data sets `drainedAp: 0`, `restMinutesToday: 0`, `injuriesHealedToday: 0`, and `currentAp: calculateMaxAp(char.level) - char.boundAp`. The `boundAp` field is intentionally absent from the update data, meaning it is preserved at its current value. Comments cite decree-016 explicitly.
- **Prior bug:** The old code used `updateMany` which applied the same values to all characters and included `boundAp: 0`, incorrectly clearing bound AP on new day.
- **Refactoring:** The switch from bulk `updateMany` to per-character `update` within `$transaction` is necessary because each character may have a different `boundAp` value, requiring per-character `currentAp` calculation.
- **Status:** CORRECT. Per decree-016, decree-019, and decree-028, bound AP must persist until the binding effect explicitly ends. New Day is not such an event. The implementation correctly omits `boundAp` from the update payload and accounts for existing `boundAp` in the `currentAp` formula.

### 2. New Day -- Bound AP Preservation (bug-038, per-character endpoint)

- **Rule:** Same as above.
- **Decrees:** decree-016, decree-019, decree-028.
- **Implementation:** `app/server/api/characters/[id]/new-day.post.ts` fetches the specific character (including `boundAp` via the full record), then updates with `drainedAp: 0`, `currentAp: maxAp - character.boundAp`. The `boundAp` field is absent from the update. Comment on line 39 cites decree-016.
- **Status:** CORRECT. Same logic as the global endpoint, applied to a single character. Both code paths are now consistent.

### 3. New Day -- Current AP Calculation

- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels" (`core/06-playing-the-game.md` lines 220-223, PTU p.221)
- **Implementation:** `calculateMaxAp(level)` returns `5 + Math.floor(level / 5)`. On new day, `currentAp = calculateMaxAp(level) - boundAp`. This correctly restores available AP to the maximum possible minus any bound AP that persists.
- **Formula verification:**
  - Level 5: `5 + floor(5/5) = 6` -- CORRECT
  - Level 10: `5 + floor(10/5) = 7` -- CORRECT
  - Level 15: `5 + floor(15/5) = 8` -- CORRECT (matches PTU p.221: "a Level 15 Trainer would have a maximum of 8 Action Points")
- **Status:** CORRECT. The `maxAp` formula matches PTU exactly, and the subtraction of `boundAp` correctly reflects that bound AP remains off-limits.

### 4. New Day -- Drained AP Reset

- **Rule:** "Drained AP becomes unavailable for use until after an Extended Rest is taken." (`core/06-playing-the-game.md` lines 230-231, PTU p.221)
- **Decree:** decree-019 lists "AP" in the enumeration of daily counters that New Day resets: "New Day resets daily counters (restMinutesToday, injuriesHealedToday, daily moves, AP)."
- **Implementation:** Both new-day endpoints set `drainedAp: 0`.
- **Note:** Strictly per PTU RAW, drained AP is only restored by Extended Rest, not by a new calendar day. However, per decree-019, the human ruling explicitly includes AP in the new-day counter reset list. This is a deliberate design decision that predates bug-038 and was not changed by this fix. The fix is correct per the decree. No action required.
- **Status:** CORRECT per decree-019 (pre-existing behavior, not introduced by this fix).

### 5. Encounter End -- Bound AP Clearing (pre-existing, audit)

- **Rule:** "[Stratagem] Features may only be Bound during combat and automatically Unbind when combat ends." (`core/03-skills-edges-and-features.md` line 1920, PTU p.61)
- **Implementation:** `app/server/api/encounters/[id]/end.post.ts` lines 126-149 set `boundAp: 0` and `currentAp: calculateSceneEndAp(char.level, char.drainedAp)` for all human combatants when an encounter ends. The `calculateSceneEndAp` function computes `maxAp - drainedAp` (with `boundAp` defaulting to 0 since it was just cleared).
- **Ticket claim:** "encounter-end and scene-end boundAp:0 are CORRECT per PTU Core p.59" -- the page reference is slightly off (the Stratagem rule is on p.61, not p.59), but the rule citation is accurate.
- **Status:** CORRECT. When combat ends, Stratagems automatically unbind. Additionally, AP is "completely regained at the end of each Scene" (p.221), and an encounter ending is a scene boundary. Setting `boundAp: 0` here is the correct behavior.

### 6. Scene End -- Bound AP Clearing (pre-existing, audit)

- **Rule:** "Action Points are completely regained at the end of each Scene." (`core/06-playing-the-game.md` lines 224-225, PTU p.221)
- **Implementation:** `app/server/services/scene.service.ts` lines 60-71 set `boundAp: 0` and `currentAp: restoredAp` (via `calculateSceneEndAp`) for all characters grouped by level/drainedAp.
- **Status:** CORRECT. Scene end restores all AP. Bound AP would be released because the scene (and any binding effects tied to it) has ended.

### 7. Capture Attempt -- Ownership Guard (bug-039)

- **Rule:** PTU p.214 describes "Capturing Pokemon" in the context of wild Pokemon encounters. The entire capture mechanic section (p.214-215) discusses Poke Balls targeting Pokemon in encounters, followed immediately by "Pokemon Disposition" which explicitly discusses "Wild Pokemon." The capture system assumes the target is unowned.
- **Implementation:** `app/server/api/capture/attempt.post.ts` lines 36-41 check `pokemon.ownerId` immediately after looking up the Pokemon. If `ownerId` is non-null (the Pokemon is already owned), the endpoint throws a 400 error: "Cannot capture an owned Pokemon." This check occurs before trainer lookup, species data lookup, or any capture rate calculation, ensuring early rejection with minimal wasted computation.
- **Status:** CORRECT. While PTU does not explicitly state "you cannot throw a Poke Ball at a trainer's Pokemon," the entire capture system is designed around wild Pokemon encounters. Allowing capture of owned Pokemon would enable stealing, which contradicts the game's design intent. The ownership guard correctly enforces this invariant.

### 8. Capture Rate Endpoint -- Read-Only Safety (bug-039)

- **Rule:** N/A (this is a safety audit, not a mechanic implementation).
- **Implementation:** `app/server/api/capture/rate.post.ts` performs only read operations (Prisma `findUnique` calls) and pure calculations. It returns capture rate data without modifying any database records. No ownership check is needed because the endpoint cannot change ownership.
- **Status:** CORRECT. The rate endpoint is inherently safe as a read-only operation.

## Unit Test Verification

### bug-038 Tests (`app/tests/unit/api/new-day.test.ts`)

Six tests covering:
1. **Does NOT clear boundAp** -- verifies `boundAp` is absent from update data
2. **Calculates currentAp as maxAp minus boundAp** -- verifies the formula with concrete values (level 10, boundAp 2: maxAp 7 - 2 = 5)
3. **Clears drainedAp** -- verifies `drainedAp: 0` is present in update data
4. **Multiple characters with different boundAp** -- verifies per-character calculation for 3 characters with boundAp values 0, 3, 1
5. **Resets daily counters** -- verifies `restMinutesToday: 0`, `injuriesHealedToday: 0`, `lastRestReset` is a Date
6. **Full maxAp when boundAp is zero** -- verifies currentAp equals maxAp when no AP is bound

All tests correctly validate the decree-016 compliance. The mock setup accurately simulates the `$transaction` behavior by calling `Promise.all` on the array of promises.

### bug-039 Tests (`app/tests/unit/api/captureAttempt.test.ts`)

Six tests covering:
1. **Rejects capture of owned Pokemon with 400** -- verifies the error message
2. **Does not look up trainer when Pokemon is owned** -- verifies early rejection (no trainer DB call)
3. **Allows capture of wild Pokemon** -- verifies happy path with `ownerId: null`
4. **Rejects when pokemonId is missing** -- input validation
5. **Rejects when trainerId is missing** -- input validation
6. **Rejects when Pokemon does not exist** -- 404 handling

Tests correctly isolate the ownership guard by mocking Prisma and capture utilities. The test factories (`createWildPokemon`, `createOwnedPokemon`) clearly distinguish the two cases.

## Summary

Both bug fixes correctly implement their intended mechanics:

**bug-038 (P0 CRITICAL):** The new-day endpoints now correctly preserve `boundAp` across new-day resets, per decree-016, decree-019, and decree-028. The refactoring from bulk `updateMany` to per-character updates within a transaction was necessary to support per-character `currentAp` calculation that accounts for individual `boundAp` values. The `calculateMaxAp` formula is verified correct against PTU p.221. All related code paths (encounter-end, scene-end) that DO clear `boundAp` are also confirmed correct per PTU Stratagem rules (p.61) and scene-end AP restoration (p.221).

**bug-039 (P2 HIGH):** The capture attempt endpoint now correctly rejects capture attempts on owned Pokemon. The guard checks `pokemon.ownerId` early in the handler, before any capture logic runs, and returns a 400 error. The capture rate endpoint is confirmed safe as a read-only operation. The ownership guard aligns with PTU's capture system, which is designed around wild Pokemon encounters (p.214-215).

## Rulings

1. **decree-016 compliance: VERIFIED.** Both new-day endpoints (global and per-character) correctly preserve `boundAp`. The field is not included in the update payload.

2. **decree-019 compliance: VERIFIED.** New Day remains a pure counter reset. It does not trigger extended rest effects (no HP healing, no persistent condition clearing). The `drainedAp: 0` reset is per the decree's explicit enumeration of AP as a daily counter.

3. **decree-028 compliance: VERIFIED.** Bound AP persists across new-day boundaries. The `currentAp` formula correctly subtracts existing `boundAp` from `maxAp`.

4. **Encounter-end/scene-end boundAp clearing: CORRECT.** These are distinct from new-day and are governed by PTU Stratagem rules (p.61: "automatically Unbind when combat ends") and scene-end AP restoration (p.221: "completely regained at the end of each Scene"). The bug-038 ticket correctly noted these as intentionally correct behavior.

5. **Capture ownership guard: CORRECT.** PTU's capture system (p.214-215) describes capturing Pokemon in wild encounter contexts. Preventing capture of owned Pokemon is the correct behavior.

## Verdict

**APPROVED** -- no issues found. Both fixes correctly implement PTU rules and comply with all applicable decrees. Unit test coverage is adequate and tests the right invariants.

## Required Changes

None.
