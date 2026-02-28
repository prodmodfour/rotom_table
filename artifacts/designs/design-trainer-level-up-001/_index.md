---
design_id: design-trainer-level-up-001
ticket_id: feature-008
category: FEATURE_GAP
scope: FULL
domain: character-lifecycle
status: p0-implemented
affected_files:
  - app/components/character/CharacterModal.vue
  - app/pages/gm/characters/[id].vue
  - app/server/api/characters/[id].put.ts
  - app/stores/library.ts
  - app/constants/trainerStats.ts
  - app/utils/characterCreationValidation.ts
new_files:
  - app/composables/useTrainerLevelUp.ts
  - app/utils/trainerAdvancement.ts
  - app/components/levelup/LevelUpModal.vue
  - app/components/levelup/LevelUpStatSection.vue
  - app/components/levelup/LevelUpSkillSection.vue
  - app/components/levelup/LevelUpEdgeSection.vue
  - app/components/levelup/LevelUpFeatureSection.vue
  - app/components/levelup/LevelUpClassSection.vue
  - app/components/levelup/LevelUpMilestoneSection.vue
  - app/components/levelup/LevelUpSummary.vue
---


# Design: Trainer Level-Up Milestone Workflow

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Trainer Advancement Pure Logic, B. Level-Up Detection & Modal Trigger, C. Stat Point & Skill Rank Allocation | [spec-p0.md](spec-p0.md) |
| P1 | D. Edge/Feature Selection at Milestone Levels, E. Class Choice at Levels 5/10, F. Lifestyle Milestone Choices (Amateur/Capable/Veteran/Elite/Champion) | [spec-p1.md](spec-p1.md) |

## Summary

The current system allows the GM to edit a trainer's level via the character sheet (both the standalone page `gm/characters/[id].vue` and the modal `CharacterModal.vue`), but changing the level does nothing. There are no milestone prompts, no guided stat/skill/edge/feature allocation, and no enforcement of the PTU advancement table (Core Chapter 2, pp. 19-21).

This design adds a guided level-up workflow that activates when the GM increments a trainer's level. A modal presents each advancement step in sequence: stat points, skill rank, and (at milestone levels) edges, features, class choices, and lifestyle bonus selection. The workflow builds on the existing character creation components and composable patterns.

### PTU Trainer Advancement Rules (Reference)

Per PTU 1.05 Core Chapter 2 (pp. 19-21):

- **Every level:** +1 stat point (no per-stat cap after level 1), +1 skill rank (from owned class features or general)
- **Every odd level (3, 5, 7, ...):** +1 Feature from a class feature list
- **Every even level (2, 4, 6, ...):** +1 Edge
- **Level 2 (Adept Skills):** Unlock Adept skill rank + 1 bonus Skill Edge (cannot rank up to Adept with this edge)
- **Level 5 (Amateur):** Choose: Atk/SpAtk stat points on even levels 6-10 (retroactive +2 for L2/L4) OR 1 General Feature
- **Level 6 (Expert Skills):** Unlock Expert skill rank + 1 bonus Skill Edge (cannot rank up to Expert with this edge)
- **Level 10 (Capable):** Choose: Atk/SpAtk stat points on even levels 12-20 OR 2 Edges
- **Level 12 (Master Skills):** Unlock Master skill rank + 1 bonus Skill Edge (cannot rank up to Master with this edge)
- **Level 20 (Veteran):** Choose: Atk/SpAtk stat points on even levels 22-30 OR 2 Edges
- **Level 30 (Elite):** Choose: Atk/SpAtk stat points on even levels 32-40 OR 2 Edges OR 1 General Feature
- **Level 40 (Champion):** Choose: Atk/SpAtk stat points on even levels 42-50 OR 2 Edges OR 1 General Feature

### Matrix Rules Covered

| Rule | Title | Tier |
|------|-------|------|
| R044 | Level 2 Milestone -- Adept Skills | P0 (skill unlock) + P1 (bonus Skill Edge) |
| R045 | Level 5 Milestone -- Amateur Trainer | P1 |
| R046 | Level 6 Milestone -- Expert Skills | P0 (skill unlock) + P1 (bonus Skill Edge) |
| R047 | Level 10 Milestone -- Capable Trainer | P1 |
| R048 | Level 12 Milestone -- Master Skills | P0 (skill unlock) + P1 (bonus Skill Edge) |
| R049 | Level 20 Milestone -- Veteran Trainer | P1 |
| R050 | Level 30/40 Milestones -- Elite/Champion | P1 |

### Applicable Decrees

- **decree-022:** Branching class specialization uses suffix format (`"Type Ace: Fire"`)
- **decree-026:** Martial Artist is NOT a branching class (only Type Ace, Stat Ace, Style Expert, Researcher)
- **decree-027:** Pathetic skills cannot be raised during character creation. During level-up (post-creation), the Pathetic lock no longer applies -- trainers CAN raise Pathetic skills via Skill Edges during advancement. This is the key behavioral difference between creation and level-up.

---

## Current State Analysis

### What Exists

| Component | Level Editing | Advancement Guidance |
|-----------|--------------|---------------------|
| `gm/characters/[id].vue` | Raw number input, editable in edit mode | **None** |
| `CharacterModal.vue` | Raw number input, editable in edit mode | **None** |
| `trainerStats.ts` | `getStatPointsForLevel()`, `getExpectedEdgesForLevel()`, `getExpectedFeaturesForLevel()`, `getMaxSkillRankForLevel()` | Calculates totals but does not detect transitions |
| `levelUpCheck.ts` | **Pokemon only** -- stat points, moves, abilities, tutor points | No trainer equivalent |
| `useCharacterCreation.ts` | Full character creation composable | Creation only, not level-up |
| `characterCreationValidation.ts` | Validates totals against expected counts | Creation context only |
| `[id].put.ts` (API) | Accepts level change, updates all fields | No server-side advancement logic |

### What is Missing

- Trainer-specific level-up detection (detecting old level vs new level transition)
- Guided modal workflow for trainer advancement
- Milestone prompt system (stat points, skill ranks, edges, features, class choices)
- Lifestyle bonus choice tracking and application (Amateur/Capable/Veteran/Elite/Champion)
- Per-level advancement delta calculation (what changed between old and new level)

### DB Schema Status

**No schema changes needed.** All fields for stats, skills, edges, features, and classes already exist on `HumanCharacter`. The level-up workflow reads the current state, presents choices, and writes back the updated values through the existing PUT API.

---

## Priority Map

| # | Feature | What it Does | Priority |
|---|---------|-------------|----------|
| A | Trainer advancement pure logic | Pure functions: per-level deltas, milestone detection, skill rank caps | **P0** |
| B | Level-up detection & modal trigger | Watch level changes, show modal, support multi-level jumps | **P0** |
| C | Stat point & skill rank allocation | +1 stat per level, +1 skill rank per level (with cap enforcement) | **P0** |
| D | Edge/Feature selection at milestones | +1 Edge per even level, +1 Feature per odd level, bonus Skill Edges at 2/6/12 | **P1** |
| E | Class choice at levels 5/10 | New trainer class selection at milestone levels | **P1** |
| F | Lifestyle milestone choices | Amateur/Capable/Veteran/Elite/Champion bonus selection | **P1** |

---


## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [testing-strategy.md](testing-strategy.md)

---


## Out of Scope

- **Feature prerequisite enforcement:** Full prerequisite trees for class features are not encoded. The GM is expected to know the rules; the UI provides convenient free-text selection.
- **Automatic class feature filtering:** Showing only features the trainer qualifies for requires a complete feature database, which is a separate project.
- **Pokemon level-up integration:** Pokemon level-up (`levelUpCheck.ts`) already exists and is separate from trainer advancement.
- **Player View level-up:** This workflow is GM-only. Player self-service is a future feature.
- **Level-down handling:** Reducing a trainer's level is an uncommon GM action; no guided "de-level" workflow is provided.
- **Server-side enforcement:** The server does not enforce advancement rules. The client-side workflow guides the GM, and the GM has final say (soft warnings, not hard blocks).

---


## Implementation Log

### P0 — Implemented 2026-02-28

Branch: `slave/3-dev-feature-008-p0-20260228-205826` (8 commits)

| Commit | Description | Files |
|--------|-------------|-------|
| `258cda2` | Pure utility: trainerAdvancement.ts | `app/utils/trainerAdvancement.ts` (new) |
| `e0f32bb` | Composable: useTrainerLevelUp.ts | `app/composables/useTrainerLevelUp.ts` (new) |
| `739fa4e` | LevelUpStatSection.vue | `app/components/levelup/LevelUpStatSection.vue` (new) |
| `864bac1` | LevelUpSkillSection.vue | `app/components/levelup/LevelUpSkillSection.vue` (new) |
| `a2f4a75` | LevelUpSummary.vue | `app/components/levelup/LevelUpSummary.vue` (new) |
| `8bc7e87` | LevelUpModal.vue | `app/components/levelup/LevelUpModal.vue` (new) |
| `541420d` | Standalone character sheet integration | `app/pages/gm/characters/[id].vue` (modified) |
| `af10309` | CharacterModal integration | `app/components/character/CharacterModal.vue` (modified) |

**P0 deliverables:**
- Pure advancement logic with per-level deltas and multi-level jump support
- 3-step wizard: stat allocation -> skill rank allocation -> summary
- Level input interception (revert + modal pattern) in both character views
- Skill rank cap enforcement per target level
- MaxHP recalculation preview
- Soft warnings for unallocated points
- P1 indicators in summary (edges, features, milestones shown as future items)

---

## Implementation Order

1. **P0 (advancement logic + stat/skill allocation)**
   - `app/utils/trainerAdvancement.ts` -- pure advancement calculation functions
   - `app/composables/useTrainerLevelUp.ts` -- reactive level-up state management
   - `app/components/levelup/LevelUpModal.vue` -- modal shell with step navigation
   - `app/components/levelup/LevelUpStatSection.vue` -- stat point allocation step
   - `app/components/levelup/LevelUpSkillSection.vue` -- skill rank allocation step
   - `app/components/levelup/LevelUpSummary.vue` -- review and confirm step
   - Integration into `gm/characters/[id].vue` and `CharacterModal.vue`
   - Unit tests for advancement logic and composable

2. **P1 (edge/feature/class/milestone choices)**
   - `app/components/levelup/LevelUpEdgeSection.vue` -- edge selection step
   - `app/components/levelup/LevelUpFeatureSection.vue` -- feature selection step
   - `app/components/levelup/LevelUpClassSection.vue` -- class choice step (levels 5/10)
   - `app/components/levelup/LevelUpMilestoneSection.vue` -- lifestyle bonus choice
   - Expand `trainerAdvancement.ts` with milestone choice logic
   - Unit tests for milestone choices
