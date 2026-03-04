---
review_id: rules-review-238
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 243d8f9e
  - e8247d08
  - 08605245
  - 4662764a
  - 50b6ea76
  - 8fec3083
  - f725e811
mechanics_verified:
  - trainer-xp-bank
  - trainer-xp-per-level
  - batch-trainer-xp-distribution
  - significance-to-trainer-xp
  - fresh-trainer-data-fetch
  - trainer-xp-results-display
  - encounter-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/11-running-the-game.md#p461-trainer-levels-and-milestones
  - core/11-running-the-game.md#p461-calculating-trainer-experience
decrees_checked:
  - decree-030 (significance preset cap at x5)
  - decree-037 (skill ranks from Edge slots only)
reviewed_at: 2026-03-01T21:45:00Z
follows_up: rules-review-233
---

## Context

Re-review of feature-009 P1 (Trainer XP & Advancement Tracking) after fix cycle. The previous code-review-257 found 0C+2H+3M issues. This review verifies all five issues are resolved and re-checks PTU rule correctness across the fix commits.

## code-review-257 Issue Resolution

### HIGH-01: trainer-xp-distribute endpoint missing encounter existence validation -- RESOLVED

**Commit:** `50b6ea76` (fix: validate encounter exists in trainer-xp-distribute endpoint)

The endpoint (`app/server/api/encounters/[id]/trainer-xp-distribute.post.ts:29`) now calls `loadEncounter(encounterId)` before processing the distribution array. This matches the sibling `xp-distribute.post.ts` pattern exactly. The `loadEncounter` function (from `encounter.service.ts:93-111`) queries `prisma.encounter.findUnique` and throws a 404 H3Error if the encounter does not exist.

**Verification:** The import of `loadEncounter` was added (line 16), and the call is placed after the `encounterId` presence check (line 24-26) but before distribution validation (line 32). This correctly gates the entire operation behind encounter existence. A request with a phantom encounter ID will now receive a 404 response.

**Status:** RESOLVED

### HIGH-02: app-surface.md not updated with P1 endpoints/components -- RESOLVED

**Commit:** `f725e811` (docs: add P1 trainer XP additions to app-surface.md)

All five documentation gaps identified in code-review-257 have been addressed:

1. **Endpoint:** `POST /api/encounters/:id/trainer-xp-distribute` added at line 150 of app-surface.md, with description of sequential processing, encounter validation, auto-level at 10 XP, and WebSocket broadcast.
2. **Component:** `TrainerXpSection.vue` added to the encounter components section with description of per-trainer XP input, significance-based suggestion, quick-set, and level-up preview.
3. **Component:** `QuestXpDialog.vue` added to the Trainer XP section with description of quest/milestone XP to scene characters.
4. **Store mapping:** `encounterXp` store line updated to include `trainer-xp-distribute` alongside `xp-calculate, xp-distribute`.
5. **Utility:** `SIGNIFICANCE_TO_TRAINER_XP` mapping documented alongside `TRAINER_XP_SUGGESTIONS`.

**Status:** RESOLVED

### MED-01: Trainer XP distribution result feedback lost in modal -- RESOLVED

**Commit:** `8fec3083` (fix: display trainer XP distribution results in XpDistributionModal)

The fix adds:
- `trainerDistributionResults` ref (`TrainerXpDistributionResult[]`, line 334) to store the server response.
- `trainerXpError` ref (line 335) for partial failure handling.
- In `handleApply()` (lines 568-584): the trainer XP distribution is now wrapped in a try/catch. On success, `trainerResult.results` is stored. On failure, the error message is captured in `trainerXpError` while Pokemon XP results are still displayed.
- In the results phase template (lines 216-241): a "Trainer XP Applied" section shows each trainer's name, XP gained, bank change, and level-up indicator. A separate error banner shows if trainer XP failed while Pokemon XP succeeded.

**XP display formula verified:** Line 227 computes `result.newXp - result.previousXp + (result.levelsGained * 10)`. This correctly reconstructs the original `xpAdded` amount because `applyTrainerXp` subtracts 10 from the bank per level gained. Example: bank 8 + 5 XP = 13, level gained 1, new bank 3. Display: `3 - 8 + (1 * 10)` = `5`. Correct.

**Partial failure handling verified:** If Pokemon XP succeeds (lines 557-565) but trainer XP fails (line 580), the modal transitions to the results phase showing Pokemon XP results and a "Trainer XP distribution failed" error banner. This is the correct behavior -- partial success should not lose the successful part.

**Status:** RESOLVED

### MED-02: Stale trainerXp from combatant snapshot -- RESOLVED

**Commit:** `4662764a` (fix: fetch fresh trainer XP data when XpDistributionModal opens)

The fix adds:
- `freshTrainerData` ref (`Map<string, { level: number; trainerXp: number }>`, line 343) to hold API-fetched data.
- `fetchFreshTrainerData()` async function (lines 636-664) that fetches each trainer's current `trainerXp` and `level` from `GET /api/characters/:id/xp-history` in parallel via `Promise.all`. Fetch failures silently fall back to the combatant snapshot (correct resilience).
- `participatingTrainers` computed (lines 381-393) now uses fresh data when available: `fresh?.trainerXp ?? (c.entity as ...).trainerXp ?? 0`.
- `onMounted` (lines 667-673) calls `fetchFreshTrainerData()` in parallel with `recalculate()` for no additional latency.

**Rule correctness impact:** The `xp-history` endpoint (`app/server/api/characters/[id]/xp-history.get.ts`) reads `trainerXp` and `level` directly from `prisma.humanCharacter.findUnique`, giving the real-time DB value. This means if a trainer captured a new species during the encounter (awarding +1 XP via `attempt.post.ts`), the modal now displays the post-capture bank value. The level-up preview in `TrainerXpSection.vue` uses `applyTrainerXp()` with this fresh data, so it will correctly predict level-ups. The server-side distribution endpoint also reads fresh data per character (line 62-65 of `trainer-xp-distribute.post.ts`), so both preview and application are consistent.

**Status:** RESOLVED

### MED-03: XpDistributionModal.vue exceeds 800 lines -- ACKNOWLEDGED (non-blocking)

Refactoring ticket `refactoring-116` was filed (P4 priority, EXT-GOD category, source: code-review-257 MEDIUM-03). The file is now 1016 lines (up from 873) due to the fix cycle adding results display, fresh data fetching, and associated styles. This worsening is expected -- the fix cycle correctly prioritized functional fixes over refactoring. The ticket correctly captures the scope and suggested approaches (extract SCSS partial, extract Pokemon XP sub-component).

**Status:** RESOLVED (ticket filed, non-blocking as agreed)

## Mechanics Verified

### 1. Trainer XP Bank (10 XP = 1 Level)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md`, p.461, line 2953)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts:44-85` computes `levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)` where `TRAINER_XP_PER_LEVEL = 10`. Multi-level jumps handled correctly. Remainder preserved in bank. Level capped at `TRAINER_MAX_LEVEL` (50) with overflow XP returned to bank.
- **Status:** CORRECT (unchanged from rules-review-233)

### 2. GM-Decided Trainer XP After Encounters

- **Rule:** "Like with Pokemon Experience, GMs will have to decide how much Trainer Experience to grant after each encounter; and again, we encourage GMs to consider narrative significance and challenge as the main determining factors." (`core/11-running-the-game.md`, p.461, line 2985-2989)
- **Implementation:** The batch endpoint `trainer-xp-distribute.post.ts` accepts arbitrary per-trainer `xpAmount` values decided by the GM. The `TrainerXpSection.vue` component provides a suggestion via `SIGNIFICANCE_TO_TRAINER_XP` but allows per-trainer override and manual input. The GM has full control.
- **Status:** CORRECT

### 3. Significance-to-Trainer-XP Mapping

- **Rule (PTU p.461):** "A scuffle with weak or average wild Pokemon shouldn't be worth any Trainer experience most of the time." (0 XP). "An average encounter with other Trainers or with stronger wild Pokemon usually merits 1 or 2 Experience at most." (1-2 XP). "Significant battles that do not quite merit a Milestone award by themselves should award 3, 4, or even 5 Experience." (3-5 XP).
- **Implementation:** `SIGNIFICANCE_TO_TRAINER_XP` in `trainerExperience.ts:115-119` maps `insignificant: 0`, `everyday: 1`, `significant: 3`. Quick-set buttons in `TrainerXpSection.vue` are `[0, 1, 2, 3, 5]`. All within PTU guidance ranges.
- **Per decree-030:** All suggested preset values cap at 5. The per-trainer manual input `max="10"` is the HTML max for bank XP amount, not the significance cap -- the GM may award any amount per PTU rules.
- **Status:** CORRECT

### 4. Batch Distribution Sequential Processing

- **Rule:** Each trainer XP application must read fresh DB state to prevent race conditions.
- **Implementation:** `trainer-xp-distribute.post.ts:58-103` processes entries in a `for` loop (sequential, not `Promise.all`). Each iteration fetches the character from DB (`prisma.humanCharacter.findUnique`), computes XP via `applyTrainerXp()`, updates DB (`prisma.humanCharacter.update`), and broadcasts `character_update` on level-up. Zero-XP entries skipped. Missing characters throw 404.
- **Status:** CORRECT

### 5. Encounter Validation in Distribution Endpoint

- **Rule:** Endpoints under `/api/encounters/:id/` must validate the encounter exists before processing.
- **Implementation (fix):** `loadEncounter(encounterId)` at line 29 queries `prisma.encounter.findUnique` and throws 404 if not found. Matches the sibling `xp-distribute.post.ts` pattern exactly.
- **Status:** CORRECT (previously missing, now fixed)

### 6. Fresh Trainer Data for Accurate Preview

- **Rule:** The GM needs accurate bank/level data to make XP allocation decisions. If a trainer captured a new species during the encounter, the +1 XP should be reflected in the modal.
- **Implementation (fix):** `fetchFreshTrainerData()` fetches from `GET /api/characters/:id/xp-history` on modal open. The `participatingTrainers` computed uses fresh data with fallback to combatant snapshot. Level-up preview in `TrainerXpSection.vue` uses `applyTrainerXp()` with fresh data for accurate prediction.
- **Status:** CORRECT (previously stale, now fixed)

### 7. Trainer XP Results Display Accuracy

- **Rule:** The XP bank mechanic: when 10+ XP accumulates, subtract 10 per level gained. The display should show the actual XP awarded, not just the bank delta.
- **Implementation (fix):** The results phase shows `+{{ result.newXp - result.previousXp + (result.levelsGained * 10) }} XP`. This formula correctly reconstructs the XP added by accounting for the 10 XP consumed per level gained. Level-up display shows `Lv.{{ result.previousLevel }} -> Lv.{{ result.newLevel }}`. Partial failure shows error banner while preserving Pokemon XP results.
- **Status:** CORRECT

## Issues

### MEDIUM-1: XpDistributionModal.vue now at 1016 lines (worsened from 873)

- **Severity:** MEDIUM
- **Type:** Code health (pre-existing, worsened by fix cycle)
- **Code:** `app/components/encounter/XpDistributionModal.vue` is 1016 lines. The fix cycle added ~143 lines (trainer XP results template: 28 lines, error banner: 5 lines, `trainerDistributionResults`/`trainerXpError` refs: 2 lines, try/catch in handleApply: ~15 lines, `fetchFreshTrainerData` function: 28 lines, `freshTrainerData` ref + participatingTrainers update: ~12 lines, SCSS for results/error: 67 lines).
- **Impact:** The existing refactoring-116 ticket (filed at 873 lines) should have its description updated to reflect the current 1016 lines. The suggested fixes remain valid. This does not block approval because the ticket is already open and the functional fixes were the correct priority.
- **Recommendation:** Update refactoring-116 to reflect the new line count. Consider elevating from P4 to P3 given the file is now 27% over the 800-line limit rather than 9%.

## Summary

All five code-review-257 issues (0C+2H+3M) are resolved:

- **HIGH-01** (encounter validation): Fixed with `loadEncounter(encounterId)` call.
- **HIGH-02** (app-surface.md): All five documentation gaps addressed.
- **MED-01** (result feedback): Trainer XP results displayed in results phase with partial failure handling.
- **MED-02** (stale data): Fresh trainer data fetched from API on modal open.
- **MED-03** (file size): Refactoring ticket refactoring-116 filed (non-blocking).

The PTU trainer XP mechanics remain correctly implemented:
- 10 XP = 1 level, multi-level jumps, level cap at 50.
- GM-decided amounts with significance-based suggestions.
- Sequential batch processing preventing race conditions.
- Significance presets and suggestions comply with decree-030 (capped at x5).
- Decree-037 not directly applicable but noted as checked.

No errata corrections affect trainer XP mechanics (checked `books/markdown/errata-2.md`).

## Rulings

1. **Fresh data fetch approach is correct.** Using `GET /api/characters/:id/xp-history` per trainer is the right granularity. The parallel `Promise.all` fetch adds no user-visible latency since it runs alongside the XP recalculation. Silent fallback to combatant snapshot on fetch failure is appropriate resilience.

2. **XP display formula is mathematically correct.** `newXp - previousXp + (levelsGained * 10)` reconstructs the original `xpAdded` by adding back the 10 XP consumed per level gained. Verified with multiple edge cases: no level-up, single level-up, multi-level jump, max level cap.

3. **Partial failure handling is correct.** Pokemon XP and trainer XP are distributed as separate operations. If trainer XP fails after Pokemon XP succeeds, the modal shows Pokemon XP results plus a trainer XP error banner. This prevents data loss while giving the GM clear feedback about what succeeded and what failed.

4. **Per decree-030:** All significance-based trainer XP suggestions remain within the x5 cap. The `SIGNIFICANCE_TO_TRAINER_XP` mapping maxes at 3 (for "significant" tier). Quick-set buttons max at 5. The per-trainer input `max="10"` is for the raw XP amount (not the significance multiplier) and is acceptable per PTU rules.

## Verdict

**APPROVED** -- All code-review-257 issues are resolved. All PTU trainer XP mechanics are correctly implemented. No critical or high issues found. The one MEDIUM issue (file size at 1016 lines) is a pre-existing code health concern with an open refactoring ticket and does not block approval.

## Recommended Actions

1. **Update refactoring-116** to reflect the new 1016-line count (up from 873). Consider P3 priority given the severity of the overage.
