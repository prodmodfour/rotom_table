---
review_id: code-review-239
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - 8c83b021
  - eb7ea9b4
  - 99b106b3
  - c668d16e
  - 83dc7a6e
  - f81898b6
  - fe3c3e37
  - 858c1293
  - 4d7d8302
  - 254090d5
  - 506e1c67
  - ebd2b7ca
  - 771e022c
files_reviewed:
  - app/composables/useTrainerLevelUp.ts
  - app/components/levelup/LevelUpMilestoneSection.vue
  - app/components/levelup/LevelUpEdgeSection.vue
  - app/components/levelup/LevelUpFeatureSection.vue
  - app/components/levelup/LevelUpClassSection.vue
  - app/components/levelup/LevelUpSummary.vue
  - app/components/levelup/LevelUpModal.vue
  - app/utils/trainerAdvancement.ts
  - app/constants/trainerClasses.ts
  - app/constants/trainerStats.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
reviewed_at: 2026-03-01T12:30:00Z
follows_up: code-review-235
---

## Review Scope

P1 implementation of feature-008 (Trainer Level-Up Milestone Workflow). Reviewed all 7 modified/new source files plus the pure logic utility and constants files. Verified decree compliance against decrees 022, 026, 027, and 037. Checked correctness of Edge/Feature/Class selection, milestone-aware totals, step navigation, branching class handling, bonus Skill Edge rank restriction logic, and the update payload builder.

Commits span: `8c83b021` (initial composable) through `83dc7a6e` (cleanup) — 13 commits total (including P0 commits already reviewed in code-review-235, focused on delta since).

## Issues

### CRITICAL

#### C1: Regular Skill Edges do not update skill ranks in payload or effective skills

**Files:** `app/composables/useTrainerLevelUp.ts` (lines 169-197, 411-421), `app/components/levelup/LevelUpEdgeSection.vue` (line 237), `app/components/levelup/LevelUpSummary.vue` (lines 211-222)

When a user adds a regular Skill Edge via the "Add Skill Edge" shortcut button in `LevelUpEdgeSection.vue`, `onAddRegularSkillEdge(skill)` emits `addEdge` with string `"Skill Edge: ${skill}"`. This is stored as a plain string in `edgeChoices`. However:

1. **`effectiveSkills` computed** (composable line 182-197) only tracks rank-ups from `bonusSkillEdgeChoices`, not regular Skill Edges in `edgeChoices`. A regular Skill Edge for Athletics will not show the Athletics rank as increased.

2. **`buildUpdatePayload()`** (composable line 411-421) only applies rank-ups for `bonusSkillEdgeChoices`. Regular Skill Edges are saved to the `edges` array but the `skills` record is never updated. The character will have "Skill Edge: Athletics" in their edge list but Athletics remains at its original rank.

3. **`skillRankUpDetails`** in LevelUpSummary (line 211-222) only computes rank-up display for bonus Skill Edges. Regular Skill Edge rank-ups are invisible in the summary.

4. **`isRegularSkillEdgeCapped`** in LevelUpEdgeSection (line 213-219) checks `effectiveSkills` which omits regular Skill Edge rank-ups. A user can add "Skill Edge: Athletics" twice but the second addition will not know the first already raised the rank, potentially allowing the skill to exceed the level cap.

**Impact:** Data corruption — the edge is recorded but the skill rank is not updated. This is the most critical path in the P1 implementation since regular Skill Edges (using normal edge slots) are likely the most common way players advance skills.

**Fix:** Parse `edgeChoices` entries matching `"Skill Edge: <skill>"` in the composable, include them in `effectiveSkills` computation, include them in `buildUpdatePayload()` skill rank-ups, include them in LevelUpSummary's `skillRankUpDetails`, and include them in cap checks. Alternatively, store regular Skill Edges with structured data (like `bonusSkillEdgeChoices`) instead of plain strings, then unify the handling.

### HIGH

#### H1: app-surface.md not updated with P1 components

**File:** `.claude/skills/references/app-surface.md` (line 88)

The app-surface entry for "Trainer level-up" still says "P1 will add edges/features/classes" and does not list the 4 new P1 components (`LevelUpMilestoneSection.vue`, `LevelUpEdgeSection.vue`, `LevelUpFeatureSection.vue`, `LevelUpClassSection.vue`). The P1 composable extensions (milestone state, edge/feature/class actions, effective skills) are also not documented.

Per project conventions, new components and routes must be registered in app-surface.md. This is a required deliverable.

**Fix:** Update the trainer level-up entry in app-surface.md to list all P1 components and composable extensions. Remove the "P1 will add" placeholder text.

### MEDIUM

#### M1: Duplicated SCSS patterns across 4 level-up components

**Files:** `LevelUpEdgeSection.vue` (lines 505-548), `LevelUpFeatureSection.vue` (lines 249-276), `LevelUpClassSection.vue` (lines 467-505), `LevelUpModal.vue` (lines 412-448)

The `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--sm` styles are duplicated across 4 components (approximately 40-50 lines each). Additionally, `.counter`, `.tag`, `.selected-tags` patterns are duplicated across `LevelUpEdgeSection`, `LevelUpFeatureSection`, and `LevelUpClassSection`.

This violates DRY and increases maintenance burden. If the button or tag styling needs to change, 4 files must be updated.

**Fix:** Extract shared `.btn` styles into a SCSS partial (e.g., `_level-up-shared.scss`) or use existing global button/tag classes. Similarly for `.counter`, `.tag`, and `.selected-tags`. File a refactoring ticket if not fixed in this cycle.

#### M2: Class choice warnings are missing for unfilled class slots

**File:** `app/composables/useTrainerLevelUp.ts` (lines 361-386)

The `warnings` computed checks for unfilled stat points, edges, bonus Skill Edges, features, and milestones — but does NOT warn about unfilled class choice prompts. If the level-up crosses levels 5 or 10 and the GM does not select a new class, no warning appears in the summary. While class choice is optional per the design spec, an informational note like "Class choice available but not selected" would be consistent with the other warning patterns and help the GM make an informed decision before applying.

**Fix:** Add an optional informational warning when class choice levels are crossed but no new class is selected. Mark it as informational (not blocking) to distinguish from the other allocation warnings.

## What Looks Good

**Decree compliance is thorough.** All 4 applicable decrees are correctly implemented:
- decree-022: Branching classes use `": "` suffix format (line 240 of LevelUpClassSection). `hasBaseClass()` prefix matching used for selection checks. `confirmBranching()` builds the correct string.
- decree-026: Martial Artist has `isBranching: false` in trainerClasses.ts (line 76). No specialization picker appears for it.
- decree-027: Pathetic skills CAN be raised during level-up. The composable and edge section apply no Pathetic block. `getRegularSkillEdgeTooltip` correctly maps Pathetic -> Untrained progression.
- decree-037: Skill ranks come from Edge slots only. No automatic `skillRanksGained` per level. Bonus Skill Edges at 2/6/12 provide the structured skill rank-up mechanism.

**Milestone-aware totals are well-designed.** The pattern of computing `milestoneRetroactiveStatPoints`, `milestoneBonusEdges`, and `milestoneBonusFeatures` from milestone choices and feeding them into `statPointsTotal`, `regularEdgesTotal`, and `featuresTotal` is clean. The step ordering (milestones first) ensures these bonuses are reflected before the user reaches the edge/feature steps.

**Bonus Skill Edge rank restriction logic is correct.** The restriction at level 2 (cannot raise to Adept), level 6 (cannot raise to Expert), and level 12 (cannot raise to Master) is properly implemented in both the composable's `addBonusSkillEdge` validation and the component's `isBonusSkillEdgeBlocked` function.

**Immutability patterns are consistent.** All ref updates use spread/filter (e.g., `edgeChoices.value = [...edgeChoices.value, edgeName]`). Milestone choices use spread for object update. The `reactive()` stat allocations use `Object.assign` for bulk reset and direct property mutation through controlled functions — standard Vue 3 pattern.

**Step navigation guards are solid.** The `watch(steps, ...)` handler on line 248 of LevelUpModal clamps the step index when the step list shrinks (e.g., if a milestone choice removes the edge step). The `currentStep` fallback to `'stats'` is a safe default.

**Component boundaries are clean.** Each P1 component communicates via props and emits only. No store coupling, no direct composable access from child components. The composable is instantiated only in LevelUpModal and threaded down as props/events. Good ISP compliance.

**Class picker search is well-implemented.** The `filteredClasses` computed searches across name, category, description, and associated skills — giving the GM multiple discovery paths.

**Branching class handling is thorough.** The `availableSpecializations` filters out taken specializations, `isFullySpecialized` prevents adding when all specs are taken, and the toggle/confirm/cancel flow handles the branching picker lifecycle cleanly.

## Verdict

**CHANGES_REQUIRED**

C1 (regular Skill Edges not updating skill ranks) is a data corruption bug that affects the most common use case in the Edge selection workflow. It must be fixed before P1 can be approved.

H1 (app-surface.md not updated) is a required deliverable that was done for P0 but missed for P1.

## Required Changes

1. **C1 (CRITICAL):** Fix regular Skill Edge rank-up handling in the composable, payload builder, summary display, and cap checks. All Skill Edges — whether from regular edge slots or bonus slots — must update the skills record when the level-up is applied.

2. **H1 (HIGH):** Update `.claude/skills/references/app-surface.md` trainer level-up entry to include all P1 components and composable extensions.

3. **M1 (MEDIUM):** Extract duplicated `.btn` / `.counter` / `.tag` / `.selected-tags` SCSS into a shared partial, or file a refactoring ticket to address it in the next cycle.

4. **M2 (MEDIUM):** Add informational warning for unfilled class choice prompts in the `warnings` computed.
