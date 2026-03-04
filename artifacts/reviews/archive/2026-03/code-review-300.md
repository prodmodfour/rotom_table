---
review_id: code-review-300
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 088bc70a
  - c31f9213
  - 041187ea
  - 0c6bdf09
files_reviewed:
  - app/server/api/encounters/[id]/trainer-xp-distribute.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/components/encounter/TrainerXpSection.vue
  - app/components/scene/QuestXpDialog.vue
  - app/components/character/TrainerXpPanel.vue
  - app/server/api/characters/[id]/xp.post.ts
  - app/server/api/characters/[id]/xp-history.get.ts
  - app/server/api/capture/attempt.post.ts
  - app/stores/encounterXp.ts
  - app/utils/trainerExperience.ts
  - app/composables/useTrainerXp.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/refactoring/refactoring-116.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-03T15:10:00+00:00
follows_up: code-review-257
---

## Review Scope

Re-review of feature-009 P1 fix cycle. 4 commits addressing 2 HIGH and 3 MEDIUM issues from code-review-257. Verified all 5 issues are resolved. Also verified P0 functionality (XP bank, auto-level, GM award, +1 species capture XP) has no regressions.

Decree check: decree-030 (x5 significance cap) still respected -- `SIGNIFICANCE_TO_TRAINER_XP` maps `{ insignificant: 0, everyday: 1, significant: 3 }`, quick-set values `[0, 1, 2, 3, 5]`, and `TRAINER_XP_SUGGESTIONS` caps at `critical: 5`. decree-037 (skill ranks via edges only) is not directly relevant to feature-009 but was checked for indirect contradiction -- none found.

---

## Issue Resolution Verification

### HIGH-01: RESOLVED

**Commit:** `088bc70a`

`trainer-xp-distribute.post.ts` now imports `loadEncounter` from `~/server/services/encounter.service` (line 16) and calls `await loadEncounter(encounterId)` at line 29, after the encounter ID presence check and before the distribution array validation. This matches the pattern in the sibling `xp-distribute.post.ts` (line 91). The return value is not destructured because the trainer XP endpoint only needs the validation side effect (404 if not found), not the encounter record data. This is correct.

### HIGH-02: RESOLVED

**Commit:** `0c6bdf09`

`app-surface.md` now documents all five items identified in code-review-257:

1. **Endpoint:** `POST /api/encounters/:id/trainer-xp-distribute` listed at line 152 with description of sequential processing, encounter validation, auto-level, and WebSocket broadcast.
2. **Component `TrainerXpSection`:** Described in the Trainer XP section (line 90) and the Key Encounter Components section (line 182).
3. **Component `QuestXpDialog`:** Described in the Trainer XP section (line 90) and scene components section.
4. **Store mapping:** `encounterXp` row (line 281) now includes `trainer-xp-distribute` in the Key API Groups.
5. **`SIGNIFICANCE_TO_TRAINER_XP`:** Documented in the Trainer XP utility description (line 90).

### MEDIUM-01: RESOLVED

**Commit:** `041187ea`

Trainer XP results are now stored and displayed:
- New `trainerDistributionResults` ref (line 334) of type `TrainerXpDistributionResult[]` stores the server response.
- New `trainerXpError` ref (line 335) stores partial failure error messages.
- Results phase template (lines 216-241) shows a "Trainer XP Applied" section with per-trainer result rows including character name, XP change (with correct back-calculation formula `newXp - previousXp + levelsGained * 10`), bank transition, and level-up indicators.
- Partial failure handling (lines 568-584): trainer XP distribution has its own inner try/catch. If Pokemon XP succeeds but trainer XP fails, the error is captured in `trainerXpError` and displayed as a warning banner (lines 238-241) while the Pokemon XP results are still shown. This is the correct behavior per the review request.
- Styling for result rows (lines 950-1015) includes level-up visual distinction with green border/gradient.

The XP display formula was verified with multiple edge cases including multi-level jumps and max level cap scenarios -- all produce correct values.

### MEDIUM-02: RESOLVED

**Commit:** `c31f9213`

Fresh trainer data is now fetched from the API instead of reading stale combatant entity snapshots:
- New `freshTrainerData` ref (line 343) as `Map<string, { level: number; trainerXp: number }>`.
- New `fetchFreshTrainerData` function (lines 636-664) fetches `/api/characters/:id/xp-history` for each trainer combatant in parallel via `Promise.all`.
- The `participatingTrainers` computed (lines 381-393) now checks `freshTrainerData.value.get(c.entityId)` first and falls back to the combatant entity snapshot via `??` operator. This means if the fetch fails for a specific trainer, the stale data is used as a graceful degradation.
- Both `recalculate()` and `fetchFreshTrainerData()` run in parallel on mount (line 671), avoiding a serial waterfall delay.
- The empty catch block (line 657) is justified by the comment "Silently fall back to combatant snapshot on fetch failure" -- the fallback is handled by the `??` chain in `participatingTrainers`.
- The `xp-history.get.ts` endpoint response structure `{ success, data: { trainerXp, level, ... } }` matches what the fetch expects.

### MEDIUM-03: RESOLVED

**Ticket:** `artifacts/tickets/open/refactoring/refactoring-116.md` exists with correct metadata: `ticket_id: refactoring-116`, `category: EXT-GOD`, `priority: P4`, `severity: LOW`, `status: open`, `source: code-review-257 MEDIUM-03`. The ticket describes the problem and suggests two remediation approaches.

---

## Issues

### MEDIUM-01: refactoring-116 ticket line count is stale (873 vs actual 1016)

**File:** `artifacts/tickets/open/refactoring/refactoring-116.md`

The ticket states the file is 873 lines. After the fix cycle added trainer XP results display, fresh data fetching, partial failure handling, and associated styling, the file is now 1016 lines -- 143 lines above what the ticket reports and 216 lines above the 800-line limit. The ticket's description and suggested fixes remain valid regardless of the exact count, but the line count should be updated to reflect the current state so future readers have accurate information.

**Fix:** Update the ticket to reference 1016 lines instead of 873.

---

## P0 Regression Check

Verified the following P0 functionality is intact (no modifications in the fix cycle commits):

1. **XP bank logic:** `trainerExperience.ts` unchanged -- `applyTrainerXp` correctly handles multi-level jumps, max level cap at 50, bank floor at 0.
2. **GM XP award endpoint:** `xp.post.ts` unchanged -- validates amount, loads character, applies pure function, broadcasts on level-up.
3. **XP history endpoint:** `xp-history.get.ts` unchanged -- returns current bank, level, xpToNextLevel (null at max level per P0 fix cycle), capturedSpecies.
4. **useTrainerXp composable:** unchanged -- `awardXp`, `deductXp`, `clearPendingLevelUp` intact.
5. **TrainerXpPanel:** not modified in fix cycle.
6. **+1 species capture XP:** `attempt.post.ts` unchanged -- `isNewSpecies` check, normalized species append, `applyTrainerXp` with +1, broadcast on level-up.

---

## What Looks Good

1. **Parallel fetching on mount:** `Promise.all([recalculate(), fetchFreshTrainerData()])` on line 671 avoids serial waterfall. Both operations are independent and complete before `initialized.value = true` gates watcher-triggered recalculations.

2. **Graceful degradation pattern in participatingTrainers:** The `fresh?.trainerXp ?? (c.entity as ...).trainerXp ?? 0` chain provides three fallback levels: fresh API data, stale combatant snapshot, and zero default. This is defensive without being noisy.

3. **Partial failure UX:** The nested try/catch in `handleApply` correctly isolates trainer XP failure from Pokemon XP success. The GM sees both results and the error, enabling informed follow-up action.

4. **XP display formula correctness:** The `newXp - previousXp + (levelsGained * 10)` formula on line 227 correctly reconstructs the original XP awarded even after bank wraparound from level-ups.

5. **loadEncounter validation:** Using `loadEncounter` purely for its 404 side effect is a clean pattern that matches the project's established convention -- the function throws a well-formatted H3 error if the encounter doesn't exist.

6. **Commit granularity:** 4 commits, each addressing exactly one issue from the previous review. Clean separation of concerns in the fix cycle.

7. **Type consistency:** `TrainerXpDistributionResult` interface is exported from the store and used consistently across the endpoint return type, the store action, and the modal's ref type.

---

## Verdict

**APPROVED**

All 5 issues from code-review-257 are resolved:
- HIGH-01: Encounter existence validation added, matching sibling endpoint pattern.
- HIGH-02: app-surface.md comprehensively updated with all new artifacts.
- MEDIUM-01: Trainer XP results stored and displayed with partial failure handling.
- MEDIUM-02: Fresh trainer data fetched from API with graceful fallback.
- MEDIUM-03: refactoring-116 ticket filed and exists.

One new MEDIUM issue found (stale line count in refactoring-116). This does not block approval -- the ticket's core description and suggested fixes remain accurate regardless of the exact line count.

P0 functionality verified with no regressions. Rules correctness already approved by rules-review-233.

---

## Required Changes

None. Approved for merge.

| ID | Severity | File | Fix |
|----|----------|------|-----|
| MEDIUM-01 | MEDIUM | `artifacts/tickets/open/refactoring/refactoring-116.md` | Update line count from 873 to 1016 |
