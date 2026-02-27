---
review_id: code-review-137
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-080
domain: character-lifecycle
commits_reviewed:
  - 9a4b92c
  - fb5ac76
  - 76f944b
  - 5607f5c
  - 3029b96
  - cfcc129
files_reviewed:
  - app/constants/trainerStats.ts
  - app/utils/characterCreationValidation.ts
  - app/composables/useCharacterCreation.ts
  - app/components/create/StatAllocationSection.vue
  - app/pages/gm/create.vue
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-080.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-23T06:20:00Z
follows_up: null
---

## Review Scope

Reviewed 6 commits implementing ptu-rule-080: extending character creation validation for higher-level characters. The fix adds 5 pure functions for PTU trainer progression calculations, extends 3 validation functions to fire at all levels instead of only level 1, updates the composable for level-aware stat tracking and skill edge caps, and updates the UI component and page to pass level-aware props.

### PTU Rule Verification

All formulas were verified against the PTU Core Chapter 2 progression table (pp. 19-21):

| Function | Level 1 | Level 2 | Level 6 | Level 10 | Level 12 | Level 50 | Table Match |
|---|---|---|---|---|---|---|---|
| `getStatPointsForLevel` | 10 | 11 | 15 | 19 | 21 | 59 | Yes |
| `getExpectedEdgesForLevel` (total) | 4 | 6 | 9 | 11 | 13 | 32 | Yes |
| `getExpectedFeaturesForLevel` | 5 | 5 | 7 | 9 | 10 | 29 | Yes |
| `getMaxSkillRankForLevel` | Novice | Adept | Expert | Expert | Master | Master | Yes |

Skill rank progression milestones (Lv2 Adept, Lv6 Expert, Lv12 Master) match PTU Core pp. 19, 34.

Bonus Skill Edge rules correctly implemented: the Skill Edges granted at levels 2, 6, and 12 cannot be used to raise a skill to the newly unlocked rank tier, and the code enforces this via `isSkillRankAboveCap` in the composable's `addSkillEdge()`.

Per-stat cap (max 5 per stat) correctly restricted to level 1 only, per PTU Core p. 15 ("no more than 5 points into any single stat" in the level 1 creation context; post-creation stat points from leveling have no per-stat cap as stated on p. 19: "Trainers don't follow Base Relations, so feel free to spend these freely").

Milestone bonus descriptions in the informational messages are reasonable summaries of the PTU choice options at levels 5/10/20/30/40.

## Issues

### MEDIUM

**M1. Unused `props` variable in StatAllocationSection.vue (line 93)**

The diff changed `defineProps<Props>()` to `const props = defineProps<Props>()`, but `props` is never referenced anywhere in the component (the template accesses prop values directly in `<script setup>`). This is a no-op but introduces a linter-flaggable unused variable.

File: `app/components/create/StatAllocationSection.vue`, line 93.

Fix: Revert to `defineProps<Props>()` without the assignment.

**M2. `MAX_FEATURES` constant not updated for higher-level characters**

In `useCharacterCreation.ts`, the `addFeature()` function still uses the hardcoded `MAX_FEATURES = 4` cap (line 200-202). For a level 1 character this is correct (4 class features + 1 training feature = 5 total), but for a higher-level character, this cap will prevent adding more than 4 non-training features through the composable even though higher-level characters should have more features.

The validation warnings correctly flag when feature count differs from expected, but the composable's own guard silently blocks the user from adding features beyond 4 (excluding the training feature). The `addEdge()` function does NOT have an equivalent cap, which is the correct behavior -- it lets the user add freely, relying on the warning to flag discrepancies.

File: `app/composables/useCharacterCreation.ts`, lines 200-202.

Fix: Either remove the hard cap on `addFeature()` (matching `addEdge()` behavior and relying on warnings), or make it level-aware using `getExpectedFeaturesForLevel(form.level) - 1` (subtract 1 for the training feature slot).

## What Looks Good

1. **Pure function design**: All 5 new functions in `trainerStats.ts` are pure, deterministic, and take level as an explicit parameter. No side effects, no reactive state. This is the correct pattern for calculation helpers.

2. **Immutability preserved**: All state updates in the composable use spread syntax (`form.statPoints = { ...form.statPoints, [stat]: ... }`) rather than direct mutation. Consistent with project coding standards.

3. **Clean separation of concerns**: Calculation logic lives in `constants/trainerStats.ts`, validation logic in `utils/characterCreationValidation.ts`, reactive binding in the composable, and display in the component. Each layer has a single responsibility.

4. **Defensive edge-case handling**: `isSkillRankAboveCap` returns `false` for unknown rank strings (the safe default). `getStatPointsForLevel` uses `Math.max(0, level - 1)` to prevent negative results. `getExpectedEdgesForLevel` uses `Math.max(1, level)` for clamping.

5. **Graceful degradation**: Validation is purely advisory (warnings/info, not blocking errors). The "GM always has final say" philosophy is maintained. Milestone bonus info is shown as `severity: 'info'` not `'warning'`, correctly signaling that these are optional choices.

6. **Good commit granularity**: 5 logical commits, each touching a focused set of files. The progression is bottom-up: pure helpers first, then validation functions, then composable + UI. Each commit produces a working state.

7. **Component prop interface**: The `StatAllocationSection` now receives `level` and `statPointsTotal` as explicit props rather than importing constants internally, making the component properly controlled by its parent.

8. **Level 1 backward compatibility**: The changes are additive for level 1 characters. The same validation rules fire, the same caps apply, the same messages appear. No regression for the primary use case.

## Verdict

**APPROVED** with 2 medium issues noted.

M1 (unused `props` assignment) is a trivial cleanup that does not affect behavior. M2 (MAX_FEATURES cap not level-aware) is a UX friction issue for higher-level characters but does not cause data loss or incorrect validation -- the warnings correctly flag the expected feature count even if the add button stops working early. Both should be addressed in a follow-up pass but do not block this fix from proceeding.

## Required Changes

None blocking. The 2 medium issues should be filed or addressed in the next development pass on the character creation system.
