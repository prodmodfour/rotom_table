---
review_id: code-review-176
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-071
domain: character-creation
commits_reviewed:
  - 764da88
  - 24b96b9
  - 1bef5f3
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/components/create/ClassFeatureSection.vue
  - app/components/create/StatAllocationSection.vue
  - app/pages/gm/create.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T08:45:00Z
follows_up: null
---

## Review Scope

Two refactoring tickets addressed in this batch:

**refactoring-071 (P4 EXT-DEAD-CODE):** `useCharacterCreation.ts` defined `MAX_FEATURES = 4` which hard-capped feature addition at 4 regardless of trainer level. Meanwhile, `addEdge()` had no such cap. Fix: removed `MAX_FEATURES`, replaced with a level-aware `expectedFeatures` computed that uses the existing `getExpectedFeaturesForLevel()` utility (minus 1 for the training slot).

**refactoring-070 (P4 EXT-DEAD-CODE):** `StatAllocationSection.vue` assigned `defineProps<Props>()` to an unused `props` variable (`const props = defineProps<Props>()`). Fix: removed the assignment, leaving bare `defineProps<Props>()`.

3 commits (1 MAX_FEATURES removal, 1 props cleanup, 1 docs update). 4 files touched.

## Issues

None.

## What Looks Good

1. **Level-aware feature count is mathematically correct.** The new `expectedFeatures` computed uses `getExpectedFeaturesForLevel(form.level) - 1`. At level 1, `getExpectedFeaturesForLevel(1)` returns 5 (verified in `constants/trainerStats.ts`: `5 + floor(max(0, 1-1) / 2) = 5`), so `expectedFeatures = 4` -- identical to the old `MAX_FEATURES = 4` for level 1 characters. For level 3, it returns 5, so `expectedFeatures = 5` -- correctly allowing the extra feature slot. The formula is well-documented in `trainerStats.ts` with a verification table.

2. **Consistent with addEdge() behavior.** The ticket noted that `addEdge()` had no hard cap while `addFeature()` did. Now both functions allow unrestricted addition, relying on validation warnings (`validateEdgesAndFeatures`) to flag discrepancies. This is the correct pattern -- soft warnings, not hard blocks.

3. **UI properly updated.** `ClassFeatureSection.vue` changes:
   - Counter now shows `features.length / expectedFeatures (+1 Training)` -- level-aware.
   - Input field is no longer disabled when at the expected count -- allows intentional over-allocation (GM may have reasons).
   - Add button still checks `!newFeature.trim()` but no longer enforces the cap.
   - Prop renamed from `maxFeatures` to `expectedFeatures` to reflect the semantic change (it's an expectation, not a hard limit).

4. **Props rename is clean.** The prop rename (`maxFeatures` -> `expectedFeatures`) is propagated through all 3 files: composable (export), page (binding), component (prop definition + usage). No stale references remain.

5. **StatAllocationSection props fix is safe.** Grep confirms zero occurrences of `props.` in the file -- the template in `<script setup>` accesses prop values directly. The unused assignment was dead code.

6. **No new files, no surface doc update needed.** Pure modification of existing files. Constants file only removes an export -- no additions that need documenting.

## Verdict

**APPROVED** -- Both fixes are correct, minimal, and well-reasoned. The MAX_FEATURES removal properly replaces a silent hard cap with a level-aware expectation counter, matching the existing pattern used by edges. The unused props cleanup is trivially safe.

## Required Changes

None.
