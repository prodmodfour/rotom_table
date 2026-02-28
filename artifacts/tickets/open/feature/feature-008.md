---
id: feature-008
title: Trainer Level-Up Milestone Workflow
priority: P1
severity: HIGH
status: in-progress
domain: character-lifecycle
source: matrix-gap (SG-1)
matrix_source: character-lifecycle R044, R045, R046, R047, R048, R049, R050
created_by: master-planner
created_at: 2026-02-28
design_ref: artifacts/designs/design-trainer-level-up-001/
---

# feature-008: Trainer Level-Up Milestone Workflow

## Summary

No guided trainer level-up workflow exists. Trainer levels are editable but there are no milestone prompts, no guided feature/edge/stat allocation, and no enforcement of PTU advancement rules. 7 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R044 | Level 2 Milestone | Missing — no guided prompt for +1 Edge, +1 Feature |
| R045 | Level 5 Milestone | Missing — no guided prompt for new class or specialization |
| R046 | Level 6 Milestone | Missing — no guided prompt for +1 Edge, +1 Feature |
| R047 | Level 10 Milestone | Missing — no guided prompt for class choice |
| R048 | Level 12 Milestone | Missing — no guided prompt for +1 Edge, +1 Feature |
| R049 | Level 20 Milestone | Missing — no guided prompt (rarely reached) |
| R050 | Level 30/40 Milestones | Missing — no guided prompt (very rare) |

## PTU Rules

- Chapter 4: Trainer Advancement table
- Even levels (2/6/12/etc.): +1 Edge, +1 Feature
- Levels 5/10: new class choice
- Each level: +2 stat points, +1 skill rank
- Base stat points per level determined by class and Lifestyle (0-3)

## Implementation Scope

FULL-scope feature requiring design spec. Should build on the existing character creation form patterns.

## Design Reference

**Design spec:** `artifacts/designs/design-trainer-level-up-001/`

| Tier | Scope | Files |
|------|-------|-------|
| P0 | Advancement logic, stat/skill allocation, level-up modal | `trainerAdvancement.ts`, `useTrainerLevelUp.ts`, `LevelUpModal.vue`, `LevelUpStatSection.vue`, `LevelUpSkillSection.vue`, `LevelUpSummary.vue` |
| P1 | Edges, features, class choice, lifestyle milestones | `LevelUpEdgeSection.vue`, `LevelUpFeatureSection.vue`, `LevelUpClassSection.vue`, `LevelUpMilestoneSection.vue` |

**Applicable decrees:** decree-022 (branching class suffix), decree-026 (Martial Artist not branching), decree-027 (Pathetic block creation-only, lifted during level-up)

## Resolution Log

- 2026-02-28: Design spec created — `design-trainer-level-up-001/` with _index, shared-specs, spec-p0, spec-p1, testing-strategy
- 2026-02-28: **P0 implemented** — 8 commits on branch `slave/3-dev-feature-008-p0-20260228-205826`:
  - `258cda2` feat: add trainerAdvancement.ts pure utility (new file)
  - `e0f32bb` feat: add useTrainerLevelUp.ts composable (new file)
  - `739fa4e` feat: add LevelUpStatSection.vue component (new file)
  - `864bac1` feat: add LevelUpSkillSection.vue component (new file)
  - `a2f4a75` feat: add LevelUpSummary.vue component (new file)
  - `8bc7e87` feat: add LevelUpModal.vue component (new file)
  - `541420d` feat: integrate level-up detection into gm/characters/[id].vue
  - `af10309` feat: integrate level-up detection into CharacterModal.vue
