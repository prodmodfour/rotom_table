---
review_id: rules-review-318
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-056
domain: character-lifecycle
commits_reviewed:
  - deef6b99
  - fb9bc4f4
  - 7f4d2f50
mechanics_verified:
  - trainer-xp-bank-leveling
  - trainer-milestone-levels
  - milestone-detection-boundary
  - fromLevel-race-condition-protection
  - xp-preview-memoization
  - encounter-milestone-display
  - quest-xp-milestone-preview
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Page 19-21
  - core/11-running-the-game.md#Page 461
reviewed_at: 2026-03-06T18:30:00Z
follows_up: rules-review-315
---

## Mechanics Verified

### 1. Trainer XP Bank Leveling Formula (regression check)

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md#Page 461`)
- **Implementation:** `applyTrainerXp()` in `app/utils/trainerExperience.ts:90-91` computes `levelsFromXp = Math.floor(rawTotal / 10)` and `remainingXp = rawTotal - (levelsFromXp * 10)`. Max level capped at 50 (line 94-96). Bank clamped to non-negative (line 74).
- **Status:** CORRECT -- No changes to this function in D2. Remains identical to rules-review-315 verification.

### 2. Trainer Milestone Levels (regression check)

- **Rule:** "Level 5 -- Amateur Trainer: Choose One Bonus Below [...] Level 10 -- Capable Trainer [...] Level 20 -- Veteran Trainer [...] Level 30 -- Elite Trainer [...] Level 40 -- Champion" (`core/02-character-creation.md#Page 19-21`)
- **Implementation:** `TRAINER_MILESTONE_LEVELS = [5, 10, 20, 30, 40] as const` in `app/utils/trainerExperience.ts:23`.
- **Status:** CORRECT -- Unchanged from D1. All five PTU milestone levels present.

### 3. Milestone Detection Boundary Logic (regression check)

- **Rule:** A milestone is triggered when a trainer advances through that level (not when already at it).
- **Implementation:** `TRAINER_MILESTONE_LEVELS.filter(ml => ml > currentLevel && ml <= newLevel)` in `app/utils/trainerExperience.ts:104-106`. Exclusive of current level, inclusive of new level.
- **Status:** CORRECT -- Unchanged from D1. Boundary semantics remain correct.

### 4. fromLevel Race Condition Protection (D2 fix: HIGH-001)

- **Rule:** Level-up choices (stat points, edges, features, milestones) depend on the advancement range `[fromLevel+1, targetLevel]`. If `character.level` is stale/updated, the display and computation must use the original pre-XP level.
- **Implementation (D2 fix deef6b99):** `LevelUpModal.vue:96` now passes `:from-level="fromLevel ?? character.level"` to `LevelUpSummary`, matching the same pattern used in the modal header (line 7) and the `onMounted` initialization (line 181). Previously it passed `character.level` directly, which could show "Level 6 -> Level 6" if the character prop was refreshed after the server XP update.
- **Verification:** `LevelUpSummary.vue:5` displays `Level {{ fromLevel }} -> Level {{ toLevel }}`. With the fix, `fromLevel` is the pre-XP level when provided. The modal header badge (line 7) and the summary subtitle (LevelUpSummary:5) now both use the same source of truth.
- **Status:** CORRECT -- The display text is now consistent with the advancement computation. No game logic regression: the underlying stat/edge/feature calculation via `levelUp.initialize()` already used `fromLevel` correctly (per rules-review-315 finding #5).

### 5. XP Preview Memoization (D2 fix: MEDIUM-002)

- **Rule:** `applyTrainerXp()` is a pure function computing level-up results. The preview must show accurate level-up and milestone information per character.
- **Implementation (D2 fix 7f4d2f50):** `QuestXpDialog.vue:99-112` introduces `xpPreviewResults` as a `computed` Map, calling `applyTrainerXp()` once per character per `xpAmount` change. Both `getLevelUpPreview()` (line 114-117) and `getMilestonePreview()` (line 120-121) read from this cached Map instead of independently calling `applyTrainerXp()`.
- **Verification:** The `applyTrainerXp()` inputs are identical to the D1 version: `currentXp: char.trainerXp`, `currentLevel: char.level`, `xpToAdd: amount`. The outputs accessed are `result.levelsGained`, `result.newLevel`, and `result.milestoneLevelsCrossed` -- all correctly extracted. The `SceneCharacterXp` type annotation on `getLevelUpPreview` and `getMilestonePreview` parameter types is consistent with the props interface (lines 76-81).
- **Status:** CORRECT -- Pure refactoring. The same `applyTrainerXp()` call with the same inputs produces the same results. No rule computation change.

### 6. Encounter XP Milestone Display (regression check)

- **Rule:** When batch-distributing trainer XP after an encounter, trainers crossing milestone levels need level-up choices. The GM must be informed.
- **Implementation (D2 fix fb9bc4f4, CSS only):** `XpDistributionModal.vue:996-998` now uses `display: flex; flex-wrap: wrap;` on `.trainer-xp-result-row`. The milestone element (line 1030) uses `width: 100%` instead of `grid-column: 1 / -1`. This is a CSS-only fix ensuring the milestone warning renders on its own line below the trainer name/XP/level-up badges.
- **Verification:** The template logic at lines 236-244 is unchanged: `v-if="result.milestoneLevelsCrossed?.length > 0"` conditionally shows the milestone badge and "Open Character Sheet" NuxtLink. The `trainerMilestoneResults` computed (line 364-366) and the aggregate banner (lines 250-255) are untouched. The `milestoneLevelsCrossed` data flows correctly from `trainer-xp-distribute.post.ts:101` through `encounterXp.ts:13` to the template.
- **Status:** CORRECT -- CSS-only change, no game logic impact.

### 7. Quest XP Milestone Preview (regression check)

- **Rule:** Quest XP awards should preview milestone crossings before awarding and notify after.
- **Implementation:** `QuestXpDialog.vue:51-55` shows milestone preview. Lines 146-151 show toast after awarding. Both use `milestoneLevelsCrossed` from `applyTrainerXp()` results.
- **Verification:** The D2 memoization refactoring (7f4d2f50) did not change the template bindings at lines 51-55 or the post-award toast logic at lines 138-151. The `getMilestonePreview()` function still returns `milestoneLevelsCrossed` (now via the memoized Map lookup). The `handleAward()` function (lines 124-156) still checks `result.milestoneLevelsCrossed.length > 0` and collects milestone names for the toast.
- **Status:** CORRECT -- Functional behavior preserved through refactoring.

## Decrees Checked

- **decree-037** (skill ranks via Edge slots only): Not violated. D2 commits are CSS and display fixes only -- no changes to skill rank allocation logic.
- **decree-027** (block Skill Edges from raising Pathetic skills during creation): Not relevant to D2 fixes.
- **decree-030** (XP suggestions capped at x5): Not affected. `TRAINER_XP_SUGGESTIONS.critical.xp` remains 5.

## D2 Fix Cycle Resolution Summary

All three code-review-348 findings are addressed:

| Issue | Fix Commit | Resolution |
|-------|-----------|------------|
| HIGH-001: LevelUpSummary stale `character.level` | `deef6b99` | Changed `:from-level="character.level"` to `:from-level="fromLevel ?? character.level"` on LevelUpModal.vue line 96. Display now matches computation. |
| MEDIUM-001: `grid-column` in flexbox context | `fb9bc4f4` | Added `flex-wrap: wrap` to parent; replaced `grid-column: 1 / -1` with `width: 100%` on milestone element. Milestone warning now renders on its own line. |
| MEDIUM-002: Duplicate `applyTrainerXp` calls | `7f4d2f50` | Introduced `xpPreviewResults` computed Map. Both `getLevelUpPreview` and `getMilestonePreview` read from shared cache. One `applyTrainerXp` call per character per xpAmount change. |

## Regression Analysis

The D2 fixes are minimal and well-scoped:
- `deef6b99`: One prop binding change in a template expression. No logic code modified.
- `fb9bc4f4`: Two CSS property changes. No template or script changes.
- `7f4d2f50`: Refactoring of preview functions to use a shared computed. Same `applyTrainerXp()` inputs and outputs. No new game logic.

None of the 8 mechanics verified in rules-review-315 are affected by these changes. The core `applyTrainerXp()` function, milestone detection logic, `TrainerXpResult` interface, server endpoints, composable, and store types are all untouched in D2.

## Rulings

No new rulings required. No new ambiguities discovered.

## Verdict

**APPROVED** -- All three code-review-348 issues are correctly resolved. No game logic regressions. All previously-approved mechanics (rules-review-315) remain intact and correct per PTU 1.05 rules.

## Required Changes

None.
