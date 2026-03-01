---
review_id: rules-review-226
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-009
domain: character-lifecycle
commits_reviewed:
  - 0274bf9f
  - 247f3c52
  - 963039f5
  - 4dd78a84
  - e332761f
  - 04552ce3
mechanics_verified:
  - trainer-xp-bank
  - auto-level-trigger
  - xp-per-level-threshold
  - multi-level-jump
  - xp-bank-floor
  - max-level-cap
  - significance-suggestion-cap
  - xp-deduction-no-level-loss
  - milestone-independence
  - new-species-xp-detection
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#Trainer Levels and Milestones (p.461)
  - core/11-running-the-game.md#Calculating Trainer Experience (p.461-462)
  - errata-2.md (no XP-related corrections)
reviewed_at: 2026-03-01T15:30:00Z
follows_up: rules-review-222
---

## Review Context

This is a re-review following the fix cycle for code-review-246 (CHANGES_REQUIRED, 5 issues). The prior rules-review-222 APPROVED all 10 PTU mechanics. This review verifies:

1. The fix cycle did not introduce any PTU rule regressions
2. All key trainer XP mechanics still hold after the 6 fix commits
3. Decree-030 and decree-037 compliance is maintained

### Fix Cycle Commits (6 commits)

| Commit | Description | Issue Fixed |
|--------|-------------|-------------|
| `0274bf9f` | Remove console.log from XP endpoint | M3 |
| `247f3c52` | Return null xpToNextLevel at max trainer level | M1 |
| `963039f5` | Extract shared processXpAward helper in TrainerXpPanel | M2 |
| `4dd78a84` | Resolve stale character data in CharacterModal after XP award | H1 |
| `e332761f` | Add trainer XP endpoints and components to app-surface.md | H2 |
| `04552ce3` | Update feature-009 ticket and design log with fix cycle results | docs |

---

## Mechanics Verified

### 1. Trainer XP Bank Accumulation (re-verified)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md` p.461)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts` (unchanged by fix cycle). Calculates `levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)` and `remainingXp = rawTotal - (levelsFromXp * TRAINER_XP_PER_LEVEL)`. The fix cycle did not modify this function.
- **Status:** CORRECT -- no regression

### 2. XP Per Level Threshold (10) (re-verified)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience" (`core/11-running-the-game.md` p.461)
- **Implementation:** `TRAINER_XP_PER_LEVEL = 10` constant unchanged. Used in `applyTrainerXp()` for level calculation and in `xp-history.get.ts` for `xpToNextLevel` computation. The fix to `xp-history.get.ts` (`247f3c52`) uses `TRAINER_XP_PER_LEVEL - character.trainerXp` for the non-max-level case, which correctly computes XP remaining until the next level-up trigger.
- **Status:** CORRECT -- no regression

### 3. Multi-Level Jumps (re-verified)

- **Rule:** The "immediately subtract 10" language implies repeated application: bank 23 means subtract 10 twice, gain 2 levels, bank 3.
- **Implementation:** `Math.floor(rawTotal / 10)` in `applyTrainerXp()` unchanged. The `processXpAward` refactor (`963039f5`) only consolidates the UI emit logic -- it does not modify the XP calculation. The `awardXp` composable call is preserved identically.
- **Status:** CORRECT -- no regression

### 4. Max Level Cap (50) (re-verified, fix-relevant)

- **Rule:** PTU practical limit level 50 (per design spec).
- **Implementation:** `TRAINER_MAX_LEVEL = 50` unchanged. Two relevant checks:
  1. `applyTrainerXp()`: When `currentLevel >= TRAINER_MAX_LEVEL`, returns `levelsGained: 0` and bank accumulates. When multi-level would exceed 50, `maxLevelsGainable = TRAINER_MAX_LEVEL - currentLevel` caps gains. Unchanged by fix cycle.
  2. `xp-history.get.ts` (fixed in `247f3c52`): Now returns `xpToNextLevel: null` when `character.level >= TRAINER_MAX_LEVEL`. Previously returned a potentially negative value. The fix correctly uses `TRAINER_MAX_LEVEL` (imported alongside `TRAINER_XP_PER_LEVEL`) for the max level check.
- **Status:** CORRECT -- fix improved correctness (null instead of negative value at max level)

### 5. XP Bank Floor (Cannot Go Negative) (re-verified)

- **Rule:** Implied by "subtract 10 Experience from their Experience Bank" -- the bank is a non-negative accumulator.
- **Implementation:** `Math.max(0, currentXp + xpToAdd)` in `applyTrainerXp()` unchanged. The `processXpAward` refactor does not alter the deduction path -- it passes the amount directly to `awardXp(props.character.id, amount, reason)`.
- **Status:** CORRECT -- no regression

### 6. Deduction Does Not Reduce Level (re-verified)

- **Rule:** No PTU rule supports level loss through XP deduction.
- **Implementation:** Unchanged. Negative XP awards clamp to bank 0 via `Math.max(0, ...)`, which cannot produce `levelsFromXp > 0`.
- **Status:** CORRECT -- no regression

### 7. Milestone Independence (re-verified)

- **Rule:** "Leveling Up through a Milestone does not affect your Experience Bank." (`core/11-running-the-game.md` p.461)
- **Implementation:** The XP endpoint (`xp.post.ts`) only modifies `trainerXp` and `level` based on the XP bank calculation. Manual level changes via PUT do not touch the XP bank. The console.log removal (`0274bf9f`) did not alter the data flow -- it only removed a logging statement after the DB update and before the response.
- **Status:** CORRECT -- no regression

### 8. New Species XP Detection (re-verified)

- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (`core/11-running-the-game.md` p.461)
- **Implementation:** `isNewSpecies()` in `trainerExperience.ts` unchanged by fix cycle. Case-insensitive, whitespace-trimmed comparison. Not yet wired to capture/hatch/evolve flows (deferred to P1, as noted in rules-review-222).
- **Status:** CORRECT (P0 scope) -- no regression

### 9. Significance-Based XP Suggestions (re-verified, decree-030)

- **Rule:** "Significant battles that do not quite merit a Milestone award by themselves should award 3, 4, or even 5 Experience." (`core/11-running-the-game.md` p.462). Per decree-030: "Cap significance presets at x5 per PTU RAW."
- **Implementation:** `TRAINER_XP_SUGGESTIONS` in `trainerExperience.ts` unchanged. Maximum preset is `critical: { xp: 5 }`. The `app-surface.md` update (`e332761f`) correctly documents this: "TRAINER_XP_SUGGESTIONS per decree-030 x5 cap".
- **Status:** CORRECT -- decree-030 compliant, no regression

### 10. Trainer Level-Up Stat Allocation (decree-037 check)

- **Rule:** Per decree-037: "Skill ranks come from Edge slots only, not automatic per-level grants."
- **Implementation:** The trainer XP system does not grant skill ranks. `applyTrainerXp()` returns only `newXp`, `newLevel`, and `levelsGained`. The level-up workflow (feature-008, separate from this feature) handles stat allocation and edge selection. The fix cycle did not modify any level-up advancement logic.
- **Status:** CORRECT -- decree-037 compliant, no regression

---

## Fix Verification

### [H1] Stale data in CharacterModal after XP award -- FIXED

**Commit:** `4dd78a84`

The fix correctly addresses the stale data problem:
- `handleXpChanged` now uses the `payload` parameter (previously ignored as `_payload`) to update `editData.value` with `{ trainerXp: payload.newXp, level: payload.newLevel }` via immutable spread
- Emits `refresh` to signal the parent to re-fetch full character data
- The `CharacterModal` emit declaration was updated to include `refresh: []`

**PTU impact:** None. This was a UI reactivity fix, not a game logic change. The XP calculation in `applyTrainerXp()` was already correct; the fix ensures the UI displays the correct values.

### [H2] app-surface.md not updated -- FIXED

**Commit:** `e332761f`

The app-surface.md now documents:
- `POST /api/characters/:id/xp` endpoint with auto-level and bank clamp description
- `GET /api/characters/:id/xp-history` endpoint with bank/level/xpToNextLevel/capturedSpecies
- `utils/trainerExperience.ts` with all exports listed
- `composables/useTrainerXp.ts` with all methods listed
- `components/character/TrainerXpPanel.vue` with UI elements and events
- Correctly references decree-030 x5 cap in the documentation

**PTU impact:** None. Documentation-only change.

### [M1] xpToNextLevel negative at max level -- FIXED

**Commit:** `247f3c52`

The fix correctly returns `null` when `character.level >= TRAINER_MAX_LEVEL` instead of computing `TRAINER_XP_PER_LEVEL - character.trainerXp` (which could be negative at max level since the bank can exceed 10 when no levels are consumed). This is a correctness improvement -- PTU has no concept of "XP to next level" at the level cap.

**PTU impact:** Positive. Prevents incorrect negative values from being exposed to consumers.

### [M2] Duplicate award logic -- FIXED

**Commit:** `963039f5`

The shared `processXpAward(amount, reason)` helper correctly consolidates:
- The `awardXp` call with character ID
- The `xp-changed` emit with `newXp` and `newLevel`
- The level-up detection and `level-up` emit with immutable character spread
- Error handling with alert

Both `handleAward` and `handleCustomAward` now delegate to `processXpAward`. The custom handler still resets input fields after the shared call. The refactored code preserves identical XP award semantics.

**PTU impact:** None. Refactoring only, no behavior change.

### [M3] console.log statements -- FIXED

**Commit:** `0274bf9f`

The console.log audit trail block was removed entirely. The XP operation data (previousXp, newXp, previousLevel, newLevel, xpAdded, levelsGained) is available in the API response, so no information is lost.

**PTU impact:** None. Logging removal only.

---

## Regression Analysis

The fix cycle modified 5 source files:

1. **`xp.post.ts`** -- Only removed console.log. The `applyTrainerXp()` call, DB update, WebSocket broadcast, and response structure are all untouched. No regression risk.

2. **`xp-history.get.ts`** -- Added `TRAINER_MAX_LEVEL` import and max level check for `xpToNextLevel`. The existing data fields (`trainerXp`, `level`, `capturedSpecies`) are untouched. The only change is `xpToNextLevel` returning `null` instead of a potentially negative number at max level. This is strictly an improvement.

3. **`TrainerXpPanel.vue`** -- Refactored to extract `processXpAward`. The emit events, button actions, and XP flow are preserved. The template is unchanged. No game logic was modified.

4. **`CharacterModal.vue`** -- Added `refresh` emit and updated `handleXpChanged` to use payload values. The XP calculation is not done here (it delegates to the composable/API). The `TrainerXpPanel` binding in the template is unchanged. No game logic was modified.

5. **`app-surface.md`** -- Documentation only. No code impact.

**Conclusion:** No PTU rule regressions introduced by the fix cycle.

---

## Summary

All 10 PTU mechanics verified in rules-review-222 remain correct after the fix cycle. The 6 fix commits addressed code quality and UI reactivity issues identified in code-review-246 without modifying any game logic formulas or PTU rule implementations. The core `applyTrainerXp()` function is completely untouched by the fix cycle.

Key confirmations:
- XP bank threshold (10 per level) -- correct per PTU Core p.461
- Multi-level jumps -- correct via integer division
- Bank floor at 0 -- correct via `Math.max(0, ...)`
- Max level cap at 50 -- correct, now with improved `null` xpToNextLevel at cap
- Significance presets capped at x5 -- correct per decree-030
- No automatic skill rank grants -- compliant with decree-037
- Milestone independence maintained -- XP and manual level paths are separate
- No errata corrections affect trainer XP mechanics

## Rulings

No new rulings needed. All previously identified mechanics remain correct. The MEDIUM-01 naming concern from rules-review-222 (`capturedSpecies` vs `ownedSpecies`) remains a P1 advisory and is not affected by this fix cycle.

## Verdict

**APPROVED**

The fix cycle successfully addresses all 5 issues from code-review-246 without introducing any PTU rule regressions. All 10 mechanics verified in rules-review-222 remain correct. Decree-030 and decree-037 compliance is maintained. No new issues found.

## Required Changes

None. APPROVED unconditionally.
