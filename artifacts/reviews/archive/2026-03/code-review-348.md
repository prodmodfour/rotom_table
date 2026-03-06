---
review_id: code-review-348
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-056
domain: character-lifecycle
commits_reviewed:
  - 39023946
  - a50208f0
  - ebbbcb4b
  - c122e81c
  - 85fc9241
  - 94d23791
  - d979952f
  - 93322204
  - b74e5381
  - 86d6ae96
  - 4c3e9c51
  - 5ee01d19
  - b8b3d868
  - 057d427d
files_reviewed:
  - app/utils/trainerExperience.ts
  - app/composables/useTrainerXp.ts
  - app/components/levelup/LevelUpModal.vue
  - app/components/character/TrainerXpPanel.vue
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/components/encounter/XpDistributionModal.vue
  - app/components/scene/QuestXpDialog.vue
  - app/server/api/characters/[id]/xp.post.ts
  - app/server/api/encounters/[id]/trainer-xp-distribute.post.ts
  - app/stores/encounterXp.ts
  - app/tests/unit/utils/trainerExperience.test.ts
  - app/tests/unit/composables/useTrainerXp.test.ts
  - app/tests/unit/api/captureAttempt.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-06T11:00:00Z
follows_up: null
---

## Review Scope

Bug-056 fix: XP auto-level skips milestone choices silently. 14 commits across 14 files. Three sub-problems addressed:
1. Race condition where server updates character level before LevelUpModal opens
2. No auto-save of level-up results after modal completion
3. Missing milestone trigger in encounter XP distribution and Quest XP dialog

Decrees checked: decree-022, decree-026, decree-027, decree-037, decree-051, decree-052. No violations found. No new ambiguities requiring decree-need tickets.

All 59 relevant unit tests pass (trainerExperience: 32, captureAttempt: 17, useTrainerXp: 10).

## Issues

### HIGH

**HIGH-001: LevelUpSummary receives stale `character.level` instead of `fromLevel`**

File: `app/components/levelup/LevelUpModal.vue`, line 96

The modal header correctly uses `fromLevel ?? character.level` (line 7), and the `onMounted` initialization correctly uses `fromLevel` to create `charForInit` (lines 181-185). However, the `LevelUpSummary` sub-component on line 96 passes `:from-level="character.level"` directly, bypassing the `fromLevel` prop.

In the XP-triggered level-up flow:
1. TrainerXpPanel calls the XP API (server updates the character's level)
2. TrainerXpPanel emits `xp-changed` then `level-up`
3. Parent calls `loadCharacter()` (async) which may refresh `character.value` to the new level
4. Parent opens LevelUpModal with `fromLevel` set to the old level

If the character prop is refreshed before the user reaches the summary step, `LevelUpSummary` will display "Level 6 -> Level 6" instead of "Level 5 -> Level 6". The initialization logic (`charForInit`) fixes the computation, but the display text in the summary is wrong.

**Fix:** Change line 96 from `:from-level="character.level"` to `:from-level="fromLevel ?? character.level"`.

### MEDIUM

**MEDIUM-001: `grid-column` used in flexbox context (no visual effect)**

File: `app/components/encounter/XpDistributionModal.vue`, line 1029

The `.trainer-xp-result-row__milestone` element uses `grid-column: 1 / -1`, but its parent `.trainer-xp-result-row` uses `display: flex` (line 997). The `grid-column` property has no effect in a flex context. The milestone div will appear inline with the name/xp/level-up spans instead of wrapping to its own line underneath.

**Fix:** Either change the parent to `display: flex; flex-wrap: wrap;` and use `flex-basis: 100%` on the milestone div, or remove the `grid-column` rule and use `width: 100%` instead.

**MEDIUM-002: Duplicate `applyTrainerXp` calls in QuestXpDialog preview**

File: `app/components/scene/QuestXpDialog.vue`, lines 98-122

`getLevelUpPreview()` and `getMilestonePreview()` both call `applyTrainerXp()` with identical parameters for the same character. Each is invoked per-character in the template's `v-for` loop. While `applyTrainerXp` is a fast pure function, the duplication is unnecessary and will compound with more characters.

**Fix:** Combine into a single preview function that returns both level-up and milestone data, or memoize via a computed property keyed by `xpAmount`.

## What Looks Good

1. **Core milestone detection logic is correct.** The `TRAINER_MILESTONE_LEVELS` constant matches PTU RAW (5, 10, 20, 30, 40). The filter `ml > currentLevel && ml <= newLevel` correctly excludes the current level and includes the exact new level. The 8 new unit tests thoroughly cover single milestones, multi-milestone jumps, boundary conditions (at current level, at max level), and the zero-level-up case.

2. **`fromLevel` prop design is sound.** The race condition fix is architecturally clean: passing `fromLevel` as an optional override that the modal uses for initialization without mutating the character prop. The `charForInit` spread pattern is correct.

3. **Auto-save on level-up completion.** Both `CharacterModal.vue` and `[id].vue` now persist level-up results to the server immediately after modal completion, fixing the silent data loss when the user was not in edit mode. Error handling with `console.error` + user-facing alert/toast is appropriate.

4. **API response propagation is thorough.** `milestoneLevelsCrossed` flows consistently from `applyTrainerXp()` -> API response -> composable -> store type -> UI components. The `?? []` fallback in `useTrainerXp.ts` line 51 provides backward compatibility.

5. **Encounter XP distribution milestone warnings are well-implemented.** Per-trainer milestone badges with "Open Character Sheet" links, plus a summary banner counting all milestone trainers. The NuxtLink to the character sheet provides a direct action path for the GM.

6. **QuestXpDialog milestone preview and toast notification.** The preview shows "Milestone at Lv.X" before awarding, and the post-award toast identifies which characters need attention. This covers the complete user flow for quest XP.

7. **Commit granularity is appropriate.** Each commit addresses a single logical change (utility, composable, modal prop, page integration, API, store type, UI, tests). The 14 commits for 14 files with clear conventional-commit prefixes follow project guidelines.

8. **Test updates are complete.** The capture attempt mock and useTrainerXp assertion were updated to include `milestoneLevelsCrossed`, preventing test failures from the interface change.

## Verdict

**CHANGES_REQUIRED** -- one HIGH issue must be fixed before merge.

## Required Changes

1. **HIGH-001 (must fix):** In `LevelUpModal.vue` line 96, change `:from-level="character.level"` to `:from-level="fromLevel ?? character.level"`. This is a one-line fix that ensures the LevelUpSummary display text is consistent with the modal's race-condition protection.

2. **MEDIUM-001 (fix now):** In `XpDistributionModal.vue`, replace the `grid-column: 1 / -1` rule on `.trainer-xp-result-row__milestone` with `width: 100%` and add `flex-wrap: wrap` to `.trainer-xp-result-row`. Without this, milestone warnings in the encounter XP results will not display on their own line.

3. **MEDIUM-002 (fix now):** In `QuestXpDialog.vue`, combine `getLevelUpPreview` and `getMilestonePreview` into a single function or computed to avoid redundant `applyTrainerXp` calls per character.
