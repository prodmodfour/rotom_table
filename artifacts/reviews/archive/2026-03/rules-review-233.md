---
review_id: rules-review-233
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 43d2467b
  - 1f49fd3e
  - 8b774ec7
  - 929545e7
  - 76c5c6a0
  - 08605245
  - 21492bca
  - be53980e
mechanics_verified:
  - trainer-xp-bank
  - trainer-xp-per-level
  - capture-species-xp
  - significance-to-trainer-xp
  - batch-trainer-xp-distribution
  - quest-xp-award
  - level-cap
  - multi-level-jump
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/11-running-the-game.md#p461-trainer-levels-and-milestones
  - core/11-running-the-game.md#p461-calculating-trainer-experience
  - core/07-combat.md#p259-encounter-example
  - errata-2.md
decrees_checked:
  - decree-030 (significance preset cap at x5)
  - decree-037 (skill ranks from Edge slots only)
reviewed_at: 2026-03-01T19:30:00Z
follows_up: rules-review-229
---

## Mechanics Verified

### 1. Trainer XP Bank (10 XP = 1 Level)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts:44-85` computes `levelsFromXp = Math.floor(rawTotal / 10)` and `remainingXp = rawTotal - (levelsFromXp * 10)`. Multi-level jumps are handled correctly (e.g., bank 8 + 15 = 23 -> 2 levels gained, bank 3). Level capped at `TRAINER_MAX_LEVEL` (50) with excess XP returning to bank.
- **Status:** CORRECT

### 2. Milestone Independence

- **Rule:** "Leveling Up through a Milestone does not affect your Experience Bank." (`core/11-running-the-game.md`, p.461)
- **Implementation:** The XP bank system is entirely separate from milestone level-ups. `applyTrainerXp()` only processes XP bank changes, not milestone events. Milestones are handled through the level-up modal in feature-008, which directly sets the level without touching `trainerXp`.
- **Status:** CORRECT

### 3. Capture Species XP (+1 XP for New Species)

- **Rule:** "There is only one automatic source of experience: Pokemon. Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md`, p.461)
- **Implementation:** `app/server/api/capture/attempt.post.ts:120-155` checks `isNewSpecies(pokemon.species, existingSpecies)` after a successful capture, awards +1 XP via `applyTrainerXp()`, appends normalized species to `capturedSpecies` JSON array, and broadcasts `character_update` on level-up. The `isNewSpecies()` utility (`trainerExperience.ts:91-94`) performs case-insensitive, whitespace-trimmed comparison. Stored species are normalized (`toLowerCase().trim()`) before persistence.
- **Status:** CORRECT for captures. See HIGH-1 below for the missing evolution/hatching hooks (documented deferral in design).

### 4. Species Deduplication

- **Rule:** PTU says "species they did not previously own" -- once owned, the +1 XP was earned. The species remains "known" permanently.
- **Implementation:** The `capturedSpecies` list only grows, never shrinks. Releasing a captured Pokemon does not remove the species from the list. Case-insensitive comparison via `isNewSpecies()` prevents duplicates from formatting differences. Each trainer has their own independent `capturedSpecies` list.
- **Status:** CORRECT

### 5. GM-Decided Trainer XP After Encounters

- **Rule:** "Like with Pokemon Experience, GMs will have to decide how much Trainer Experience to grant after each encounter; and again, we encourage GMs to consider narrative significance and challenge as the main determining factors." (`core/11-running-the-game.md`, p.461)
- **Implementation:** The batch endpoint `trainer-xp-distribute.post.ts` accepts an arbitrary per-trainer `xpAmount` decided by the GM. It does NOT apply any formula. The `TrainerXpSection.vue` component provides a suggestion based on significance tier but allows per-trainer override. The GM has full control.
- **Status:** CORRECT

### 6. Significance-to-Trainer-XP Mapping

- **Rule (PTU p.461):**
  - "A scuffle with weak or average wild Pokemon shouldn't be worth any Trainer experience most of the time." (0 XP)
  - "An average encounter with other Trainers or with stronger wild Pokemon usually merits 1 or 2 Experience at most." (1-2 XP)
  - "Significant battles that do not quite merit a Milestone award by themselves should award 3, 4, or even 5 Experience." (3-5 XP)
- **Implementation:** `SIGNIFICANCE_TO_TRAINER_XP` in `trainerExperience.ts:115-119` maps:
  - `insignificant: 0` -- matches "shouldn't be worth any"
  - `everyday: 1` -- matches "usually merits 1 or 2" (conservative default)
  - `significant: 3` -- matches "should award 3, 4, or even 5" (mid-range default)
- **Per decree-030:** All suggested values cap at 5. The `TRAINER_XP_SUGGESTIONS` table (`trainerExperience.ts:101-108`) ranges from 0-5, respecting the x5 cap.
- **Status:** CORRECT

### 7. Batch Distribution Safety

- **Rule:** Sequential application prevents race conditions. Each trainer update reads fresh DB state, computes XP, and writes atomically.
- **Implementation:** `trainer-xp-distribute.post.ts:54-99` processes entries in a `for` loop (sequential, not `Promise.all`). Each iteration fetches the character, computes via `applyTrainerXp()`, and updates the DB. Zero-XP entries are skipped. Missing characters throw 404.
- **Status:** CORRECT

### 8. Quest XP from Scene Tools

- **Rule:** PTU p.461 says "Experience for Trainers can and should also come from non-combat goals and achievements as well, both as a party and as individuals." The quest XP dialog provides exactly this for scene-based narrative awards.
- **Implementation:** `QuestXpDialog.vue` awards XP to all scene characters sequentially via the existing `POST /api/characters/:id/xp` endpoint. Input validated client-side (`min="1" max="20"`, disabled when `!xpAmount || xpAmount < 1`). Level-up preview uses `applyTrainerXp()` for accurate bank+level prediction.
- **Status:** CORRECT

### 9. Level Cap (50)

- **Rule:** Practical PTU trainer level cap is 50 (trainerAdvancement.ts milestones end at level 50).
- **Implementation:** `TRAINER_MAX_LEVEL = 50` in `trainerExperience.ts:14`. When `currentLevel >= 50`, `applyTrainerXp()` returns 0 levels gained but still accumulates the bank. When approaching 50, `maxLevelsGainable` prevents exceeding it, with overflow XP preserved in bank.
- **Status:** CORRECT

### 10. Decree Compliance

- **decree-030 (significance preset cap at x5):** The `TRAINER_XP_SUGGESTIONS` table caps at 5 XP for the "Critical" tier. The `SIGNIFICANCE_TO_TRAINER_XP` mapping has a max of 3 (for "significant" tier). Both respect the decree. The per-trainer input in `TrainerXpSection.vue` has `max="10"` which exceeds 5, but this is the HTML input maximum for the XP bank amount (not the significance preset), and PTU allows the GM to decide any amount -- the 5 cap applies to suggested presets, not manual input.
- **decree-037 (skill ranks from Edge slots only):** Not directly applicable to P1 XP mechanics, but noted as checked. Level-ups triggered by trainer XP will flow through the existing LevelUpModal (feature-008) which respects this decree.
- **Status:** COMPLIANT

## Issues

### HIGH-1: Evolution Species XP Not Implemented

- **Severity:** HIGH
- **Type:** Missing mechanic (documented deferral)
- **Rule:** "Whenever a Trainer catches, **hatches, or evolves** a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md`, p.461)
- **Code:** `app/server/api/pokemon/[id]/evolve.post.ts` does not check `capturedSpecies` or call `applyTrainerXp()`.
- **Analysis:** The P1 implementation only hooks into the capture flow (`attempt.post.ts`). The evolution endpoint (`evolve.post.ts`) does not award +1 species XP when evolving into a species the trainer has never owned. The design index (`_index.md`, Out of Scope section) explicitly documents this: "Evolution XP: PTU grants +1 XP for evolving a species not previously owned. The capturedSpecies field will track this, but evolution XP hookup is deferred until the evolution system is reviewed." Hatching is also deferred as the breeding/hatching system does not exist yet.
- **Verdict:** This is a known, documented gap -- NOT a regression introduced by P1. The data model (`capturedSpecies`) is ready to support it. However, the PTU rule IS clear, and this gap means the app under-awards trainer XP. Filing a ticket is required per Lesson 2 (always file tickets for pre-existing/deferred issues).
- **Ticket:** Recommend a `ptu-rule` ticket for evolution species XP hookup. Priority P3 (the `capturedSpecies` infrastructure exists; it's a hookup-only change in `evolve.post.ts`).

### MEDIUM-1: Batch Endpoint Missing Server-Side xpAmount Upper Bound

- **Severity:** MEDIUM
- **Type:** Validation gap
- **Code:** `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts:37` validates `entry.xpAmount < 0` but has no upper bound. The individual XP endpoint (`xp.post.ts:33-34`) validates `body.amount < -100 || body.amount > 100`.
- **Analysis:** The HTML input in `TrainerXpSection.vue` has `max="10"` but the `handleInput` function only clamps to `Math.max(0, ...)` with no upper bound enforcement. A crafted request could send `xpAmount: 1000`. While the GM is a trusted user, the individual endpoint already validates a -100 to 100 range. Consistency requires matching validation.
- **Impact:** No game logic incorrectness (the GM decides XP amounts per PTU rules), but inconsistent validation between the two XP endpoints.

### MEDIUM-2: app-surface.md Not Updated for P1 Additions

- **Severity:** MEDIUM
- **Type:** Documentation gap
- **Code:** `.claude/skills/references/app-surface.md` does not reference:
  - `POST /api/encounters/:id/trainer-xp-distribute` endpoint
  - `TrainerXpSection.vue` component
  - `QuestXpDialog.vue` component
  - `SIGNIFICANCE_TO_TRAINER_XP` mapping in `trainerExperience.ts`
  - `distributeTrainerXp` store action in `encounterXp.ts`
- **Analysis:** The encounter endpoint section (line 148-151) lists `xp-calculate` and `xp-distribute` but not `trainer-xp-distribute`. The Trainer XP section (line 90) describes P0 components but not P1 additions.
- **Impact:** Future matrix analysis and capability mapping will miss these components, leading to incomplete test coverage.

## Summary

P1 implements the three trainer XP sources (capture species +1, post-encounter batch distribution, quest XP from scenes) correctly per PTU 1.05 p.461. The core XP bank mechanic (10 XP = 1 level, multi-level jumps, level cap at 50) from P0 is correctly used in all three new integration points. The `SIGNIFICANCE_TO_TRAINER_XP` mapping provides reasonable defaults within PTU's stated ranges. All values comply with decree-030's x5 significance cap.

The one HIGH issue (evolution species XP not hooked) is a documented design deferral, not a P1 regression. The field name is even called `capturedSpecies` which is slightly misleading (it should track evolved/hatched species too), but the infrastructure supports it when the evolution hookup is added.

Code quality is solid: sequential processing prevents race conditions in batch distribution, immutable Map patterns used for allocation state, proper error handling with try/catch in all API calls, WebSocket broadcasts on level changes for real-time sync.

## Rulings

1. **`SIGNIFICANCE_TO_TRAINER_XP` values are reasonable defaults.** PTU gives ranges, not exact values. The mapping of insignificant=0, everyday=1, significant=3 falls within PTU's stated guidelines. The GM can always override per PTU p.461: "GMs will have to decide how much Trainer Experience to grant."

2. **Quest XP max of 20 is acceptable.** The `QuestXpDialog.vue` input has `max="20"` which exceeds the 0-5 range for encounter XP, but quest/milestone XP is not subject to the same guidelines. PTU p.461 says "Experience for Trainers can and should also come from non-combat goals and achievements." The GM has discretion on amounts.

3. **Per decree-030, all significance PRESETS cap at x5.** The `TRAINER_XP_SUGGESTIONS` table caps at 5. The per-trainer manual input does NOT need to cap at 5 -- that constraint applies to the significance multiplier presets, not to the raw XP amount the GM decides to award.

4. **Evolution species XP is correctly deferred, not a P1 bug.** The design explicitly scopes hatching and evolution XP out of P1. However, a ticket should be filed to ensure it enters the pipeline.

## Verdict

**APPROVED** -- All P1 mechanics are correctly implemented per PTU 1.05. No critical issues. The HIGH-1 issue is a documented deferral (not a P1 regression) that needs a ticket. The two MEDIUM issues are validation and documentation gaps that should be addressed but do not block approval.

## Recommended Actions

1. **File ticket** for evolution species XP hookup (`evolve.post.ts` needs `capturedSpecies` check + `applyTrainerXp(+1)` on new species). Priority P3. Category: `ptu-rule`.
2. **Add server-side xpAmount upper bound** to `trainer-xp-distribute.post.ts` (match the individual endpoint's 100 cap). Non-blocking.
3. **Update app-surface.md** with P1 components and endpoints. Non-blocking.
