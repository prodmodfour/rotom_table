---
review_id: rules-review-315
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - trainer-milestone-levels
  - trainer-xp-bank-leveling
  - milestone-detection-boundary
  - multi-level-milestone-crossing
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Page 19-21
  - core/11-running-the-game.md#Page 461
  - core/04-trainer-classes.md#Dabbler
reviewed_at: 2026-03-06T11:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Trainer Milestone Levels (TRAINER_MILESTONE_LEVELS)

- **Rule:** "Level 5 -- Amateur Trainer: Choose One Bonus Below [...] Level 10 -- Capable Trainer: Choose One Bonus Below [...] Level 20 -- Veteran Trainer: Choose One Bonus Below [...] Level 30 -- Elite Trainer: Choose One Bonus Below [...] Level 40 -- Champion: Choose One Bonus Below" (`core/02-character-creation.md#Page 19-21`)
- **Implementation:** `TRAINER_MILESTONE_LEVELS = [5, 10, 20, 30, 40] as const` in `app/utils/trainerExperience.ts:23`. The Dabbler feature (`core/04-trainer-classes.md`) independently confirms these same five levels ("At the Level 5, 10, 20, 30, and 40 Character Advancement Level Milestones").
- **Status:** CORRECT -- All five PTU milestone levels are enumerated exactly per RAW.

### 2. Milestone Detection Boundary Logic

- **Rule:** Milestones are "bonus choices at Level 5, 10, 20, 30, and 40" (`core/02-character-creation.md#Page 20`). A milestone is crossed when a trainer advances through (not from) that level.
- **Implementation:** `TRAINER_MILESTONE_LEVELS.filter(ml => ml > currentLevel && ml <= newLevel)` in `app/utils/trainerExperience.ts:104-106`. Uses strict greater-than for currentLevel (exclusive) and less-than-or-equal for newLevel (inclusive). This means: a trainer at level 5 leveling to 6 does NOT re-trigger milestone 5; a trainer at level 4 leveling to 5 DOES trigger milestone 5.
- **Status:** CORRECT -- Boundary conditions properly handle the exclusive-start, inclusive-end semantics. A trainer already at a milestone level is not prompted again. Unit tests at `app/tests/unit/utils/trainerExperience.test.ts:150-154` explicitly verify this edge case.

### 3. Multi-Level Milestone Crossing

- **Rule:** PTU Core p.461: "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." Large XP grants can cause multi-level jumps (e.g., bank 0 + 80 XP = 8 levels gained), potentially crossing multiple milestones.
- **Implementation:** The filter at `trainerExperience.ts:104-106` correctly identifies all milestones in the range `(currentLevel, newLevel]`. For example, level 3 -> level 11 correctly reports milestones [5, 10]. Level 1 -> level 41 correctly reports all five [5, 10, 20, 30, 40].
- **Status:** CORRECT -- Unit tests verify single-milestone, double-milestone, and all-five-milestone crossing scenarios.

### 4. Trainer XP Bank Leveling Formula

- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level." (`core/11-running-the-game.md#Page 461`)
- **Implementation:** `levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)` and `remainingXp = rawTotal - (levelsFromXp * TRAINER_XP_PER_LEVEL)` in `app/utils/trainerExperience.ts:90-91`. This correctly handles multi-level jumps (e.g., bank 8 + 15 = 23 -> 2 levels, remainder 3).
- **Status:** CORRECT -- Pre-existing logic, verified still intact after milestone additions. No regressions introduced.

### 5. fromLevel Race Condition Fix

- **Rule:** Level-up choices (stat points, edges, features, milestones) are computed based on the advancement range `[oldLevel+1, newLevel]`. If the server has already updated `character.level` to `newLevel`, the modal would compute zero advancement.
- **Implementation:** `LevelUpModal.vue:181` uses `props.fromLevel ?? props.character.level` as the starting level for advancement computation. When `fromLevel` is provided, a modified character object `{ ...props.character, level: startLevel }` is passed to `levelUp.initialize()`, which sets `oldLevel = char.level`. This ensures the advancement range is always `(fromLevel, targetLevel]`, not `(character.level, targetLevel]`.
- **Status:** CORRECT -- Both `CharacterModal.vue:354` and `[id].vue:359` set `levelUpFromLevel` to `payload.oldLevel` from the XP result, which is the pre-update level. This prevents the race condition described in bug-056.

### 6. Auto-Save Level-Up Results

- **Rule:** Level-up choices (stats, edges, features, milestone selections) must be persisted to the server, not just stored in local `editData`.
- **Implementation:** `CharacterModal.vue:396` auto-saves via `$fetch PUT /api/characters/:id` with the `updatedData` payload. `[id].vue:377` auto-saves via `libraryStore.updateHuman()`. Both emit `refresh` to reload fresh character data.
- **Status:** CORRECT -- Addresses bug-056 sub-problem #2 (no auto-save).

### 7. Encounter XP Distribution Milestone Warnings

- **Rule:** When batch-distributing trainer XP after an encounter, trainers who cross milestone levels need level-up choices. The system must surface this information to the GM.
- **Implementation:** `XpDistributionModal.vue:236` shows milestone badges with "Open Character Sheet" links for each trainer who crossed milestones. `XpDistributionModal.vue:250-255` shows an aggregate warning banner. Both use `milestoneLevelsCrossed` from the API response.
- **Status:** CORRECT -- The GM is informed and given navigation to resolve milestone choices. The implementation does not block the XP distribution (which is correct -- the choices are deferred to the character sheet).

### 8. Quest XP Dialog Milestone Preview and Toast

- **Rule:** Quest XP awards should preview milestone crossings before awarding, and notify after.
- **Implementation:** `QuestXpDialog.vue:51-55` shows milestone preview indicators per character using `getMilestonePreview()`, which calls `applyTrainerXp()` for each character. After awarding, `QuestXpDialog.vue:146-151` shows a warning toast listing characters who crossed milestones.
- **Status:** CORRECT -- Pure function preview avoids side effects. Toast notification provides actionable guidance.

## Decrees Checked

- **decree-037** (skill ranks via Edge slots only): Not violated. The milestone detection does not add automatic skill ranks. Milestone choices in `trainerAdvancement.ts` correctly offer lifestyle_stat_points, bonus_edges, and general_feature -- not skill ranks. Per decree-037, "Trainer per-level gains are limited to exactly what PTU Core p.19 specifies."
- **decree-027** (block Skill Edges from raising Pathetic skills during creation): Not relevant to this fix (creation-only restriction).
- **decree-030** (XP cap at x5): Not violated. `TRAINER_XP_SUGGESTIONS.critical.xp` remains 5.

## Summary

The bug-056 fix correctly implements PTU milestone level detection at [5, 10, 20, 30, 40] per RAW (Core pp.19-21). The implementation addresses all three sub-problems identified in the ticket:

1. **Race condition** resolved via `fromLevel` prop that overrides `character.level` in advancement computation.
2. **Auto-save** implemented in both character sheet contexts (standalone page and CharacterModal).
3. **Missing modal trigger** in encounter and quest XP pathways addressed via milestone warnings and navigation links.

The milestone detection logic uses correct boundary semantics (exclusive of current level, inclusive of new level), handles multi-level jumps, and degrades gracefully at max level. All five PTU milestone levels are enumerated correctly. Unit tests cover all critical edge cases including boundary conditions, multi-milestone crossing, and max-level behavior.

No PTU rule violations found. No decree violations found.

## Rulings

No new rulings required. The implementation faithfully represents PTU RAW milestone levels.

## Verdict

**APPROVED** -- All mechanics correctly implement PTU 1.05 rules. No issues found.

## Required Changes

None.
