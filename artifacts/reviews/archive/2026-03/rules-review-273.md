---
review_id: rules-review-273
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 50b6ea76
  - 4662764a
  - 8fec3083
  - f725e811
mechanics_verified:
  - trainer-xp-distribution
  - significance-tiers
  - species-capture-xp
  - auto-level-up
  - xp-bank-display-math
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#p461-trainer-levels-and-milestones
  - core/11-running-the-game.md#p461-calculating-trainer-experience
decrees_checked:
  - decree-030 (significance preset cap at x5)
  - decree-037 (skill ranks from Edge slots only)
reviewed_at: 2026-03-03T15:10:00+00:00
follows_up: rules-review-233
---

## Context

Re-review of feature-009 P1 (Trainer XP & Advancement Tracking) after fix cycle. The previous rules-review-233 APPROVED the P1 implementation with 1 HIGH (documented deferral of evolution species XP) and 2 MEDIUM issues (validation gap, app-surface.md). The code-review-257 found 2 HIGH + 3 MEDIUM issues requiring fixes. This review verifies the fix cycle commits do not introduce PTU rules regressions and that all previously-verified mechanics remain correct.

## Fix Cycle Verification

### HIGH-01: Encounter Validation in trainer-xp-distribute (50b6ea76)

- **Fix:** Added `import { loadEncounter } from '~/server/services/encounter.service'` and `await loadEncounter(encounterId)` call at line 29, before processing any distribution entries.
- **Rules Impact:** None. This is a structural validation fix. The `loadEncounter` call ensures the encounter exists and throws 404 if not found, matching the sibling `xp-distribute.post.ts` endpoint. No game formula or mechanic was changed.
- **Status:** FIX VERIFIED

### HIGH-02: app-surface.md Updated (f725e811)

- **Fix:** Updated 5 areas in `.claude/skills/references/app-surface.md`:
  1. Trainer XP section (line 90): Added `SIGNIFICANCE_TO_TRAINER_XP` mapping, `TrainerXpSection.vue`, `QuestXpDialog.vue` with integration details.
  2. Encounters API (line 152): Added `POST /api/encounters/:id/trainer-xp-distribute` with description.
  3. Key encounter components: Added `TrainerXpSection.vue` description.
  4. XpDistributionModal description: Updated to note trainer XP section and partial failure handling.
  5. Store mapping (line 244): `encounterXp` store now lists `trainer-xp-distribute` alongside `xp-calculate, xp-distribute`.
- **Rules Impact:** None. Documentation-only change.
- **Status:** FIX VERIFIED

### MED-01: Trainer XP Results Display (8fec3083)

- **Fix:** Three changes to `XpDistributionModal.vue`:
  1. Added `trainerDistributionResults` ref and `trainerXpError` ref for state tracking.
  2. Trainer XP distribution now uses a nested try/catch (lines 574-583) so failure does not prevent the results phase from showing Pokemon XP.
  3. Results phase displays a "Trainer XP Applied" section with per-trainer rows showing XP awarded, bank change, and level-up.
  4. Partial failure shows a warning banner: "Trainer XP distribution failed: [error]".
- **Rules Impact:** The XP display formula at line 227 deserves verification:
  ```
  +{{ result.newXp - result.previousXp + (result.levelsGained * 10) }} XP
  ```
  This reconstructs the total XP awarded from the `applyTrainerXp` result. Example: trainer had bank 8, awarded 5 XP. `rawTotal = 13`, 1 level gained, `newXp = 3`, `previousXp = 8`. Display: `3 - 8 + (1 * 10) = 5 XP`. This correctly shows the amount awarded, not the net bank change. Multi-level example: bank 2, award 25 XP. `rawTotal = 27`, 2 levels gained, `newXp = 7`. Display: `7 - 2 + (2 * 10) = 25 XP`. Correct.
- **Status:** FIX VERIFIED, display math is correct per PTU bank mechanics.

### MED-02: Fresh Trainer Data on Modal Open (4662764a)

- **Fix:** Three changes to `XpDistributionModal.vue`:
  1. Added `freshTrainerData` ref (Map of entityId to `{ level, trainerXp }`).
  2. Added `fetchFreshTrainerData()` function that calls `GET /api/characters/:id/xp-history` for each trainer combatant in parallel. Falls back silently to combatant snapshot on fetch failure.
  3. `participatingTrainers` computed now reads from `freshTrainerData` first, falling back to the stale combatant entity snapshot.
  4. `onMounted` runs `fetchFreshTrainerData()` in parallel with `recalculate()`.
- **Rules Impact:** This fix ensures the "Bank: X/10" display and level-up preview use current database values, not the snapshot from when the combatant was added. This is critical for accurate preview when a trainer captures a new species during the encounter (+1 XP from Section E, which modifies the DB but not the combatant entity snapshot). The `xp-history.get.ts` endpoint returns `trainerXp` and `level` directly from the `HumanCharacter` record, which is the authoritative source.
- **Status:** FIX VERIFIED, resolves stale data concern from code-review-257.

### MED-03: Refactoring Ticket Filed

- **Verification:** `artifacts/tickets/open/refactoring/refactoring-116.md` exists with correct metadata (`source: code-review-257 MEDIUM-03`, `priority: P4`, `severity: LOW`). Describes the 873-line file size issue and suggests two extraction approaches.
- **Status:** VERIFIED (ticket exists, correctly scoped)

## Mechanics Verified (Re-confirmation)

### 1. Trainer XP Bank (10 XP = 1 Level)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts:44-85` unchanged from P1 implementation. Computes `levelsFromXp = Math.floor(rawTotal / 10)` and `remainingXp = rawTotal - (levelsFromXp * 10)`. Multi-level jumps handled. Level capped at `TRAINER_MAX_LEVEL` (50).
- **Fix cycle impact:** None -- the core function was not modified.
- **Status:** CORRECT

### 2. Capture Species XP (+1 for New Species)

- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `app/server/api/capture/attempt.post.ts:204-238` unchanged. Checks `isNewSpecies()`, awards +1 XP via `applyTrainerXp()`, appends normalized species to `capturedSpecies`, broadcasts on level-up.
- **Fix cycle impact:** The fresh data fetch (MED-02) ensures the modal sees this +1 XP if it was awarded during the encounter. The core award logic is untouched.
- **Status:** CORRECT

### 3. GM-Decided Trainer XP After Encounters

- **Rule:** "GMs will have to decide how much Trainer Experience to grant after each encounter; and again, we encourage GMs to consider narrative significance and challenge as the main determining factors." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `trainer-xp-distribute.post.ts` accepts arbitrary per-trainer `xpAmount` from the GM. The `TrainerXpSection.vue` provides suggestions but allows per-trainer override. The fix cycle only added encounter existence validation (HIGH-01) -- GM discretion preserved.
- **Status:** CORRECT

### 4. Significance-to-Trainer-XP Mapping

- **Rule (PTU p.461):** "A scuffle with weak or average wild Pokemon shouldn't be worth any Trainer experience" (0), "An average encounter with other Trainers or with stronger wild Pokemon usually merits 1 or 2 Experience" (1-2), "Significant battles... should award 3, 4, or even 5 Experience" (3-5).
- **Implementation:** `SIGNIFICANCE_TO_TRAINER_XP` maps: `insignificant: 0`, `everyday: 1`, `significant: 3`. Quick-set values `[0, 1, 2, 3, 5]`. `TRAINER_XP_SUGGESTIONS` caps at `critical: 5`.
- **Per decree-030:** All suggested values respect the x5 cap. The per-trainer manual input `max="10"` exceeds 5 but applies to the raw XP amount (GM discretion), not the significance preset -- this distinction was ruled correct in rules-review-233 ruling #3.
- **Status:** CORRECT, DECREE-030 COMPLIANT

### 5. Batch Distribution Sequential Processing

- **Rule:** Each trainer's XP must be applied atomically against fresh DB state to prevent race conditions.
- **Implementation:** `trainer-xp-distribute.post.ts:58-103` processes entries in a `for` loop (sequential). Each iteration fetches the character from DB, computes via `applyTrainerXp()`, and updates. Zero-XP entries skipped. Fix cycle added encounter validation before the loop -- does not affect sequential processing.
- **Status:** CORRECT

### 6. Partial Failure Handling

- **Rule:** PTU does not address partial failure directly, but the implementation must not silently lose XP. If Pokemon XP succeeds, it should be visible even if trainer XP fails.
- **Implementation (MED-01 fix):** Trainer XP distribution is wrapped in its own try/catch inside `handleApply`. If it fails, `trainerXpError` is set, but `phase.value = 'results'` still executes with Pokemon results. The results phase conditionally shows the trainer error banner (`v-if="trainerXpError"`). The GM sees both the successful Pokemon XP results and the trainer XP failure message.
- **Status:** CORRECT

### 7. Level Cap (50)

- **Rule:** Practical PTU trainer level cap is 50.
- **Implementation:** `TRAINER_MAX_LEVEL = 50` in `trainerExperience.ts:14`. `applyTrainerXp()` handles level cap with overflow XP preserved in bank. Unchanged by fix cycle.
- **Status:** CORRECT

### 8. Quest XP from Scenes

- **Rule:** "Experience for Trainers can and should also come from non-combat goals and achievements as well." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `QuestXpDialog.vue` awards XP to all scene characters via the existing `POST /api/characters/:id/xp` endpoint. Unchanged by fix cycle.
- **Status:** CORRECT

## P0 Regression Check

The fix cycle commits modify only:
1. `trainer-xp-distribute.post.ts` -- added 3 lines (import + validation call)
2. `XpDistributionModal.vue` -- added fresh data fetch, result display, partial failure handling
3. `.claude/skills/references/app-surface.md` -- documentation only

No P0 files were touched:
- `utils/trainerExperience.ts` -- unchanged (core XP bank logic)
- `composables/useTrainerXp.ts` -- unchanged (reactive wrapper)
- `components/character/TrainerXpPanel.vue` -- unchanged (quick award UI)
- `server/api/characters/[id]/xp.post.ts` -- unchanged (individual XP endpoint)
- `server/api/characters/[id]/xp-history.get.ts` -- unchanged (XP state query)

**No P0 regressions detected.**

## Decree Compliance

- **decree-030 (significance preset cap at x5):** All trainer XP suggestions and presets remain within the x5 cap. The `TRAINER_XP_SUGGESTIONS` table caps at 5 (`critical`). `SIGNIFICANCE_TO_TRAINER_XP` maps to max 3 (`significant`). Quick-set buttons are `[0, 1, 2, 3, 5]`. No fix cycle changes affected these values.
- **decree-037 (skill ranks from Edge slots only):** Not directly applicable to P1 XP mechanics. Level-ups triggered by trainer XP flow through the existing LevelUpModal (feature-008) which respects this decree. No fix cycle changes affected level-up workflow.

## Errata Check

No errata corrections exist for trainer XP mechanics in `books/markdown/errata-2.md`. The only trainer-related errata entry concerns capture roll bonuses at trainer levels (Amateur/Capable/Veteran/Elite/Champion), which is unrelated to XP.

## Summary

All four fix cycle commits have been verified. The fixes are structural (encounter validation, fresh data fetch, result display, documentation) and do not alter any PTU game formulas or mechanics. The core XP bank calculation (`applyTrainerXp`), species capture XP (+1), significance-to-XP mapping, batch distribution, and level cap are all unchanged and remain correct per PTU 1.05 p.461.

The XP result display formula (`newXp - previousXp + levelsGained * 10`) correctly reconstructs the total XP awarded, accounting for XP consumed by level-ups. This was the only new game-math introduced in the fix cycle and it is verified correct.

## Rulings

1. **Fresh data fetch approach is sound.** Using `GET /api/characters/:id/xp-history` for each trainer in parallel is correct. The endpoint reads directly from the `HumanCharacter` table, which is the authoritative source. The fallback to combatant snapshot on fetch failure is a reasonable graceful degradation.

2. **Partial failure handling is appropriate.** Pokemon XP and trainer XP are independent operations per PTU rules -- they are different resource types (Pokemon experience points vs. trainer experience bank). Treating them as independently-failable is correct.

3. **Per decree-030, no new preset or suggestion values were introduced.** The fix cycle does not modify any significance or XP suggestion constants. Compliance is maintained.

## Verdict

**APPROVED** -- All fix cycle commits verified. No PTU rules issues found. No regressions in P0 functionality. All mechanics remain correctly implemented per PTU 1.05 p.461 and decree-030. The previous rules-review-233 approval stands, and the code-review-257 HIGH/MEDIUM issues have been properly addressed without introducing game logic errors.

## Required Changes

None.
