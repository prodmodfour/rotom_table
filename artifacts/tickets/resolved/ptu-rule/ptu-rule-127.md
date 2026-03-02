---
ticket_id: ptu-rule-127
title: "Remove automatic skill rank per level (skill ranks come from Edge slots only)"
severity: HIGH
priority: P1
domain: character-lifecycle
source: decree-037
created_at: 2026-02-28
status: in-progress
---

## Summary

Per decree-037, trainers should NOT receive an automatic +1 skill rank per level. Skill ranks in PTU RAW come exclusively from spending Edge slots on Skill Edges (Basic/Adept/Expert/Master Skills, Core p.52). The current `skillRanksGained: 1` in the level-up system is a house rule that breaks the PTU skill rank economy.

## Required Changes

1. **`app/utils/trainerAdvancement.ts`** (line 252): Remove or set `skillRanksGained: 0` (or remove the field entirely from `LevelInfo`)
2. **`app/utils/trainerAdvancement.ts`** (line 306): Remove `totalSkillRanks` computed from `skillRanksGained`
3. **`app/utils/trainerAdvancement.ts`** (line 38): Remove `skillRanksGained` from `LevelInfo` type
4. **`app/composables/useTrainerLevelUp.ts`** (lines 87-95): Remove skill rank total/remaining computed properties
5. **`app/components/levelup/LevelUpSkillSection.vue`**: Remove or disable the entire skill allocation UI section (skill rank allocation will be re-implemented as part of P1 Edge selection)
6. **Design spec** `artifacts/designs/design-trainer-level-up-001/spec-p0.md` Section E: Update to note skill ranks are deferred to P1

## Acceptance Criteria

- Level-up flow no longer shows a skill rank allocation step
- `LevelInfo` type no longer includes `skillRanksGained`
- No automatic skill rank increment per level
- Existing tests updated to reflect removal
- Design spec updated

## PTU Reference

- Core p.19: Per-level gains (Stat Points, Features, Edges only)
- Core p.52: Skill Edges (Basic/Adept/Expert/Master Skills)
- Decree-037: Binding ruling

## Impact

P0 level-up will only handle stat point allocation until P1 Edge selection is implemented. This is the correct behavior per PTU RAW.

## Resolution Log

### Prior work (feature-008 fix cycle)
Items 1-4 were already resolved by a prior slave (slave-3, plan-20260228-233710):
- `skillRanksGained` removed from `TrainerLevelUpInfo` type in `trainerAdvancement.ts`
- `totalSkillRanks` removed from `TrainerAdvancementSummary` in `trainerAdvancement.ts`
- Skill rank computed properties removed from `useTrainerLevelUp.ts`
- Composable doc comment updated to cite decree-037

### This branch (slave/1-dev-ptu-rule-127-20260302)
- `e716e985` fix: remove skills step from level-up wizard per decree-037
  - Removed `LevelUpSkillSection` template block from `LevelUpModal.vue`
  - Removed `'skills'` from step navigation and `STEP_LABELS`
  - Added decree-037 comment to step navigation
- `c8426e90` docs: update spec-p0 to remove skillRanksGained references per decree-037
  - Updated Sections A, C, E, G, and Integration Summary
  - Removed `skillRanksGained` from type examples, composable code examples, step navigation examples
  - Updated banner and integration summary to reflect current state
