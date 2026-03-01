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

**Applicable decrees:** decree-022 (branching class suffix), decree-026 (Martial Artist not branching), decree-027 (Pathetic block creation-only, lifted during level-up), decree-037 (skill ranks from Edge slots only, not automatic per-level)

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
- 2026-03-01: **P0 fix cycle** — 10 commits on branch `slave/3-dev-feature-008-fix-20260228-233710` (code-review-230 + rules-review-206 + decree-037):
  - `e3e1052` fix: prevent double modal open on level-up completion (C1 — isApplyingLevelUp guard in CharacterModal.vue and [id].vue)
  - `dfe26ee` fix: cap evasion at +6 in level-up stat preview (H1 — Math.min(..., 6) in LevelUpStatSection.vue)
  - `5fd0dfa` fix: heal currentHp to new max when trainer was at full HP on level-up (H2 — wasAtFullHp detection in useTrainerLevelUp.ts)
  - `699dfa7` refactor: remove skillRanksGained from trainer advancement per decree-037 (trainerAdvancement.ts)
  - `149dd43` refactor: remove skill rank allocation from useTrainerLevelUp per decree-037 (useTrainerLevelUp.ts)
  - `1d872b1` refactor: remove skills step from LevelUpModal wizard per decree-037 (LevelUpModal.vue)
  - `e6fdcca` refactor: remove skill changes from LevelUpSummary per decree-037 (LevelUpSummary.vue)
  - `6cc57b8` docs: update spec-p0 Section E to note skill ranks deferred to P1 per decree-037
  - `167d7c0` refactor: extract STAT_DEFINITIONS and RANK_PROGRESSION to shared constants (M1-M2)
  - `1fba52e` docs: add trainer level-up files to app-surface.md (M3)
- 2026-03-01: **P0 APPROVED** — code-review-235 + rules-review-211 passed
- 2026-03-01: **P1 implemented** — 10 commits on branch `slave/4-dev-feature-008-p1-20260301-093000`:
  - `140af576` feat: extend useTrainerLevelUp composable with P1 state (edge/feature/class/milestone)
  - `190c2088` feat: add LevelUpMilestoneSection.vue component (milestone radio choices at L5/10/20/30/40)
  - `29f3c602` feat: add LevelUpEdgeSection.vue component (regular edges + bonus Skill Edges at L2/6/12)
  - `4a97f625` feat: add LevelUpFeatureSection.vue component (free-text features at odd levels 3+)
  - `2d11a86a` feat: add LevelUpClassSection.vue component (searchable class picker at L5/10)
  - `d2fe7f9c` feat: update LevelUpSummary.vue to display all P1 choices
  - `18a912ac` feat: wire P1 sections into LevelUpModal step navigation
  - `2dceceed` fix: use milestone-aware totals for edge/feature step visibility
  - `e49cb3a5` fix: guard step index against step list shrinkage
  - `2b215c1a` chore: remove unused MilestoneOption import
- 2026-03-01: **P1 fix cycle** — 4 commits on branch `slave/2-developer-feature-008-fix-20260301` (code-review-239 CHANGES_REQUIRED + rules-review-215 APPROVED):
  - `fdfa2ed9` fix: include regular Skill Edge rank-ups in effective skills, payload, and summary (C1 CRITICAL + MED-01 cosmetic)
  - `67416ee0` fix: add informational warning for unfilled class choice at milestone levels (M2)
  - `ab2693fd` docs: update app-surface.md with P1 level-up components and composable extensions (H1)
  - `b8a66c1b` refactor: extract duplicated SCSS into _level-up-shared.scss partial (M1)
