## Tier 2: Core Constraints

### R002 — Starting Stat Baseline

- **Rule:** "Level 1 Trainers begin with 10 HP and 5 in each other Stat. Assign 10 points, no more than 5 per stat."
- **Expected behavior:** BASE_HP=10, BASE_OTHER=5, TOTAL_STAT_POINTS=10, MAX_POINTS_PER_STAT=5.
- **Actual behavior:** `app/constants/trainerStats.ts:11-19` defines all constants correctly. `useCharacterCreation.ts:127` enforces per-stat cap at level 1. `characterCreationValidation.ts:51-59` validates per-stat cap at level 1 only (per PTU, no per-stat cap after level 1).
- **Classification:** Correct

### R005 — Skill Rank Level Prerequisites

- **Rule:** "Adept requires Level 2. Expert requires Level 6. Master requires Level 12."
- **Expected behavior:** Skill rank caps at levels 2, 6, 12.
- **Actual behavior:** `app/constants/trainerSkills.ts:29-33` — `SKILL_RANK_LEVEL_REQS: { Adept: 2, Expert: 6, Master: 12 }`. `trainerStats.ts:51-56` — `getMaxSkillRankForLevel` returns correct rank per level. `isSkillRankAboveCap` correctly compares rank index against max.
- **Classification:** Correct

### R006 — Skills Default Rank

- **Rule:** "Skills begin at Untrained unless modified by a Background."
- **Expected behavior:** All 17 skills default to Untrained.
- **Actual behavior:** `app/constants/trainerSkills.ts:36-40` — `getDefaultSkills()` maps all skills to `'Untrained'`.
- **Classification:** Correct

### R021 — Rounding Rule

- **Rule:** "round down to the nearest whole number, even if .5 or higher."
- **Expected behavior:** Math.floor used consistently.
- **Actual behavior:** `Math.floor` used in evasion formulas (`useCharacterCreation.ts:119-121`), AP formula (`restHealing.ts:220`), stat points (`trainerStats.ts:35`), rest healing (`restHealing.ts:65`), and movement modifiers (`useGridMovement.ts:102,113,123`).
- **Classification:** Correct

### R022 — Starting Edges

- **Rule:** "Starting Trainers begin with four Edges."
- **Expected behavior:** 4 edges at level 1.
- **Actual behavior:** `trainerStats.ts:74-85` — `getExpectedEdgesForLevel(1)` returns `{ base: 4, bonusSkillEdges: 0, total: 4 }`. Formula: `base = 4 + Math.floor(1/2) = 4`.
- **Classification:** Correct

### R023 — Starting Skill Cap

- **Rule:** "you cannot raise Skills above Novice at your starting level!"
- **Expected behavior:** Novice max at level 1.
- **Actual behavior:** `trainerStats.ts:55` — `getMaxSkillRankForLevel(1)` returns `'Novice'`. `addSkillEdge` (line 256) blocks rank above cap.
- **Classification:** Correct

### R026 — Edges Per Level

- **Rule:** "4 during creation, another at every even Level, additional Edges at each level where max Skill Rank increases (L2, L6, L12)."
- **Expected behavior:** L1=4, L2=6, L4=7, L6=9, L12=13.
- **Actual behavior:** `trainerStats.ts:74-85`: `base = 4 + Math.floor(level / 2)`, plus `bonusSkillEdges` at L2/L6/L12. L1: 4+0+0=4. L2: 5+1=6. L4: 6+1=7. L6: 7+2=9. L12: 10+3=13. All match PTU progression.
- **Classification:** Correct

### R030 — Starting Features

- **Rule:** "4 Features + 1 Training Feature = 5 total at level 1."
- **Expected behavior:** 5 features at level 1.
- **Actual behavior:** `trainerStats.ts:97-99` — `getExpectedFeaturesForLevel(1) = 5`. Training feature tracked separately via `form.trainingFeature`.
- **Classification:** Correct

### R032 — Max Class Features

- **Rule:** "Maximum of 4 Class Features."
- **Expected behavior:** Max 4 trainer classes enforced.
- **Actual behavior:** `trainerClasses.ts:40` — `MAX_TRAINER_CLASSES = 4`. `useCharacterCreation.ts:182` — `if (form.trainerClasses.length >= MAX_TRAINER_CLASSES) return`. Also validated in `characterCreationValidation.ts:194`.
- **Classification:** Correct

### R036 — Features Per Level

- **Rule:** "Every odd Level you gain a Feature."
- **Expected behavior:** L1=5, L3=6, L5=7, L10=9.
- **Actual behavior:** `trainerStats.ts:97-99` — `5 + Math.floor((level - 1) / 2)`. L1=5, L3=6, L5=7, L10=9. Correct.
- **Classification:** Correct

### R038 — Stat Points Per Level

- **Rule:** "Every Level you gain a Stat Point."
- **Expected behavior:** Total = 10 + (level - 1).
- **Actual behavior:** `trainerStats.ts:34-36` — `TOTAL_STAT_POINTS + Math.max(0, level - 1)` = `10 + (level - 1)`. L1=10, L50=59.
- **Classification:** Correct

### R039 — Edges Per Level (Advancement)

- **Rule:** "Every even Level you gain an Edge."
- **Expected behavior:** +1 at levels 2, 4, 6, ...
- **Actual behavior:** `trainerStats.ts:76` — `base = 4 + Math.floor(level / 2)` correctly adds 1 per even level.
- **Classification:** Correct

### R040 — Max Trainer Level

- **Rule:** "Trainers have a Maximum Level of 50."
- **Expected behavior:** Level cannot exceed 50.
- **Actual behavior:** `HumanCharacter.level` is `Int @default(1)` with no max constraint. No validation in create/update APIs or composable prevents level > 50.
- **Classification:** Approximation
- **Severity:** LOW — Edge case, level 50 is rarely reached in campaigns. GM can manually enforce.

---
