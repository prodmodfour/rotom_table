---
review_id: rules-review-215
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - eb7ea9b4
  - f81898b6
  - fe3c3e37
  - 858c1293
  - 4d7d8302
  - 254090d5
  - 506e1c67
  - ebd2b7ca
  - 771e022c
  - 83dc7a6e
  - 07a10c6a
mechanics_verified:
  - trainer-advancement-schedule
  - edge-selection-even-levels
  - bonus-skill-edge-rank-restriction
  - feature-selection-odd-levels
  - milestone-choices
  - class-choice-max-four
  - branching-class-specialization
  - trainer-hp-formula
  - pathetic-skill-edge-level-up
  - skill-ranks-via-edges-only
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/02-character-creation.md#page-19-21
  - core/03-skills-edges-and-features.md#page-52
  - core/04-trainer-classes.md#page-65
  - errata-2.md
reviewed_at: 2026-03-01T16:30:00Z
follows_up: rules-review-206
---

## Mechanics Verified

### 1. Trainer Advancement Schedule (Per-Level Gains)

- **Rule:** "Every Level you gain a Stat Point." / "Every odd Level you gain a Feature." / "Every even Level you gain an Edge." (`core/02-character-creation.md#page-19`)
- **Implementation:** `trainerAdvancement.ts` lines 245-258 — `computeTrainerLevelUp()` returns `statPointsGained: 1` (always), `edgesGained: isEven ? 1 : 0`, `featuresGained: (isOdd && level >= 3) ? 1 : 0`.
- **Verification:** The `level >= 3` guard for features is correct because level 1 grants starting features (creation), and level 2 is even. The progression table (p.20) confirms: L1=5 features, L2=5, L3=6. The code matches RAW.
- **Status:** CORRECT

### 2. Edge Selection at Even Levels

- **Rule:** "Every even Level you gain an Edge" (`core/02-character-creation.md#page-19`)
- **Implementation:** `useTrainerLevelUp.ts` line 147 computes `regularEdgesTotal` as `summary.totalEdges + milestoneBonusEdges`. The `summary.totalEdges` aggregates `edgesGained` across all levels in the advancement range. `LevelUpEdgeSection.vue` presents free-text edge input with counter enforcement (`edgeChoices.length >= regularEdgesTotal` disables input).
- **Verification:** For a jump from level 3 to level 8: levels 4, 6, 8 are even = 3 edges. The code produces this correctly via `computeTrainerAdvancement` loop.
- **Status:** CORRECT

### 3. Bonus Skill Edge Rank Restriction (Levels 2/6/12)

- **Rule:** "You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." (Level 2, `core/02-character-creation.md#page-19`). Same pattern at Level 6 (Expert restriction) and Level 12 (Master restriction).
- **Implementation:** `trainerAdvancement.ts` line 254 sets `bonusSkillEdge: [2, 6, 12].includes(level)`. The `skillRankCapUnlocked` maps to Adept/Expert/Master. `useTrainerLevelUp.ts` lines 290-308 (`addBonusSkillEdge`) validates: (a) one choice per level slot, (b) not at rank cap, (c) next rank is not the restricted rank. `LevelUpEdgeSection.vue` line 240 implements `isBonusSkillEdgeBlocked()` using the same next-rank-vs-restricted check.
- **Verification:** At level 2, `restrictedRank = 'Adept'`. A skill at Novice (next rank = Adept) is correctly blocked. A skill at Untrained (next rank = Novice) is correctly allowed. A skill at Pathetic (next rank = Untrained) is correctly allowed. This matches PTU RAW exactly.
- **Status:** CORRECT

### 4. Feature Selection at Odd Levels

- **Rule:** "Every odd Level you gain a Feature." (`core/02-character-creation.md#page-19`)
- **Implementation:** `trainerAdvancement.ts` line 253: `featuresGained: (isOdd && level >= 3) ? 1 : 0`. `LevelUpFeatureSection.vue` provides free-text input bounded by `totalFeatures` count (which includes milestone bonus features). The composable computes `featuresTotal = summary.totalFeatures + milestoneBonusFeatures`.
- **Verification:** Features at odd levels 3, 5, 7, 9, ... with no feature at level 1 (creation) or level 2 (even). Matches progression table. Milestone bonus features (from Elite/Champion `general_feature` choice) are correctly added on top.
- **Status:** CORRECT

### 5. Milestone Choices (Amateur/Capable/Veteran/Elite/Champion)

- **Rule:** Level 5 Amateur: "+1 Atk or SpAtk per even level (6-10), +2 retroactive for L2/L4" OR "1 General Feature". Level 10 Capable: "+1 Atk or SpAtk per even level (12-20)" OR "2 Edges". Level 20 Veteran: same as Capable (22-30 range). Level 30 Elite: stat points (32-40) OR 2 Edges OR 1 General Feature. Level 40 Champion: stat points (42-50) OR 2 Edges OR 1 General Feature. (`core/02-character-creation.md#pages-19-21`)
- **Implementation:** `trainerAdvancement.ts` lines 117-239 (`getMilestoneAt`) encodes all five milestones with the correct option types, level ranges, retroactive points, and edge counts. `LevelUpMilestoneSection.vue` presents radio buttons for each milestone. `useTrainerLevelUp.ts` lines 86-132 compute `milestoneRetroactiveStatPoints`, `milestoneBonusEdges`, and `milestoneBonusFeatures` that feed into total calculations.
- **Verification against PTU RAW:**
  - Amateur (L5): `lifestyle_stat_points` with `evenLevelRange: [6, 10]` and `retroactivePoints: 2` -- CORRECT (RAW says "+2 Stat Points, representing Levels 2 and 4, retroactively")
  - Capable (L10): `lifestyle_stat_points` with `evenLevelRange: [12, 20]` or `bonus_edges` with `edgeCount: 2` -- CORRECT
  - Veteran (L20): `lifestyle_stat_points` with `evenLevelRange: [22, 30]` or `bonus_edges` with `edgeCount: 2` -- CORRECT
  - Elite (L30): stat points [32, 40] OR 2 Edges OR 1 General Feature -- CORRECT (3 options per RAW)
  - Champion (L40): stat points [42, 50] OR 2 Edges OR 1 General Feature -- CORRECT (3 options per RAW)
- **Status:** CORRECT

### 6. Class Choice and Max 4 Classes

- **Rule:** "a Trainer can only ever take a maximum of four Classes" (`core/04-trainer-classes.md#page-65`)
- **Implementation:** `trainerClasses.ts` line 39: `MAX_TRAINER_CLASSES = 4`. `useTrainerLevelUp.ts` lines 326-329 (`addClass`): `if (currentTotal >= 4) return`. `LevelUpClassSection.vue` line 149: `canAddMore = totalClassCount.value < props.maxClasses`.
- **Verification:** The max-4 enforcement is correct. Class choices are prompted at levels 5 and 10 only (`classChoicePrompt: [5, 10].includes(level)`). PTU RAW does not mandate class acquisition at specific levels -- classes are taken via Feature slots. The levels 5/10 prompt is a design convenience documented in the spec (Section F: "levels 5 and 10 are conventional points"), not a rules violation. Higher milestones (20/30/40) already have the milestone choice system. This is an acceptable design simplification.
- **Status:** CORRECT

### 7. Branching Class Specialization (decree-022)

- **Rule:** Per decree-022, branching classes use specialization suffix format (e.g., "Type Ace: Fire"). Per decree-026, Martial Artist is NOT branching.
- **Implementation:** `trainerClasses.ts` lines 104-119 define `BRANCHING_CLASS_SPECIALIZATIONS` for exactly 4 classes: Type Ace (18 types), Stat Ace (5 combat stats), Style Expert (5 contest stats), Researcher (9 fields). Martial Artist on line 76 has no `isBranching` flag. `LevelUpClassSection.vue` lines 217-236 (`toggleClass`) opens specialization picker for branching classes, line 240 (`confirmBranching`) emits `"ClassName: Specialization"` format.
- **Verification:** Exactly 4 branching classes per decree-026 and PTU RAW [Branch] tag. Martial Artist correctly excluded. Specialization suffix format per decree-022 correctly applied.
- **Status:** CORRECT (per decree-022, decree-026)

### 8. Trainer HP Formula

- **Rule:** "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10" (`core/02-character-creation.md#page-18`)
- **Implementation:** `useTrainerLevelUp.ts` line 357: `return newLevel.value * 2 + updatedStats.value.hp * 3 + 10`
- **Verification:** Exact match to PTU formula. The `updatedStats.value.hp` includes both the character's existing HP stat and any stat points allocated during this level-up.
- **Status:** CORRECT

### 9. Pathetic Skill Edge During Level-Up (decree-027)

- **Rule:** Per decree-027, Pathetic skill restriction is creation-only. During level-up, Pathetic skills CAN be raised via Skill Edges.
- **Implementation:** `useTrainerLevelUp.ts` line 17 documents this. `addBonusSkillEdge` (lines 290-308) does NOT block Pathetic skills. `LevelUpEdgeSection.vue` `isBonusSkillEdgeBlocked` (line 240) only checks next-rank vs restricted-rank, not Pathetic status. `isRegularSkillEdgeCapped` (line 213) only checks rank vs level cap, not Pathetic.
- **Verification:** A skill at Pathetic rank can be raised to Untrained via any Skill Edge during level-up. The creation-only Pathetic block from decree-027 is correctly NOT applied during level-up. This matches PTU RAW: "You Rank Up a Skill from Pathetic to Untrained" (Basic Skills Edge, p.52) is the intended post-creation progression.
- **Status:** CORRECT (per decree-027)

### 10. Skill Ranks via Edges Only (decree-037)

- **Rule:** Per decree-037, skill ranks come from Edge slots only, not automatic per-level grants.
- **Implementation:** `trainerAdvancement.ts` does NOT include any `skillRanksGained` field. The `TrainerLevelUpInfo` interface has no skill rank entitlement. Skill ranks during level-up are gained exclusively via: (a) bonus Skill Edges at levels 2/6/12, (b) regular Edge slots used for Skill Edges. The composable's `effectiveSkills` computed (lines 182-197) tracks pending rank-ups from bonus Skill Edge choices only.
- **Verification:** No automatic skill rank grants exist. All skill progression is via Edge selection. This matches decree-037 and PTU RAW (Core p.19, p.52).
- **Status:** CORRECT (per decree-037)

### 11. Current HP Healing on Level-Up

- **Rule:** Not explicitly stated in PTU RAW, but the P0 fix cycle (commit `5fd0dfa` / `c668d16e`) established that if a trainer was at full HP before level-up, their current HP should be set to the new max HP.
- **Implementation:** `useTrainerLevelUp.ts` lines 424-427: `wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)`, then `newCurrentHp = wasAtFullHp ? newMaxHp : Math.min(character.value.currentHp, newMaxHp)`.
- **Verification:** A trainer at full HP who gains HP stat points will have their current HP raised to the new max. A trainer NOT at full HP keeps their current HP (clamped to the new max if it somehow exceeds it). This is a sensible implementation consistent with the P0 fix cycle ruling.
- **Status:** CORRECT

## Medium Issues

### MED-01: Skill Rank-Up Summary Display Does Not Account for Stacked Bonus Skill Edges

- **File:** `app/components/levelup/LevelUpSummary.vue`, lines 211-222
- **Rule:** When multiple bonus Skill Edges raise the same skill (e.g., jumping from L1 to L13, getting bonus Skill Edges at L2, L6, and L12, and using two of them on the same skill), the `skillRankUpDetails` computed shows each rank-up independently from the character's base rank. For example, raising Acrobatics (Untrained) at L2 and again at L6 would show two entries both displaying "Untrained -> Novice" instead of "Untrained -> Novice" and "Novice -> Adept".
- **Impact:** Display-only. The actual `buildUpdatePayload` correctly applies stacked rank-ups sequentially (lines 415-421). The data written to the database is correct. Only the summary preview is potentially misleading in the multi-jump stacking scenario.
- **Severity:** MEDIUM (cosmetic display issue, no game value error)

## Summary

The P1 implementation of the Trainer Level-Up Milestone Workflow is rules-correct across all 10 PTU mechanics verified. The advancement schedule (stat points every level, edges at even levels, features at odd levels 3+), bonus Skill Edge rank restrictions (cannot raise to newly unlocked rank), milestone choices (5 milestones with correct options per RAW), class selection (max 4, branching per decree-022, Martial Artist non-branching per decree-026), HP formula, and skill rank progression (edges only per decree-037) all match PTU 1.05 RAW.

All four applicable decrees are correctly respected:
- **decree-022:** Branching class specialization suffix format implemented in LevelUpClassSection
- **decree-026:** Martial Artist correctly excluded from branching classes (no `isBranching` flag)
- **decree-027:** Pathetic skill restriction correctly NOT applied during level-up (creation-only)
- **decree-037:** No automatic skill rank grants; all skill progression via Edge selection

One MEDIUM display issue was found in the summary component's handling of stacked bonus Skill Edge rank-ups on the same skill, but this is cosmetic only -- the underlying data payload is correct.

## Rulings

1. The class choice prompt at levels 5/10 only (not 20/30/40) is an acceptable design simplification. PTU RAW does not tie class acquisition to specific levels -- classes are Features taken via Feature slots. The milestones at 20/30/40 already provide Edge/Feature bonus choices which can be used toward class features. No rules violation.

2. The `calculateLifestyleStatPoints()` utility function correctly calculates future lifestyle stat points for the milestone stat-point option, including the Amateur retroactive +2 for levels 2/4. This is a utility for validation, not directly used in the P1 level-up flow (where the stat points are allocated during the milestone step), but it is consistent with RAW.

3. The regular Skill Edge shortcut in LevelUpEdgeSection (lines 41-81) allows spending regular edge slots on Skill Edges with no rank restriction (unlike the bonus Skill Edges which cannot raise to the newly unlocked rank). This is correct per PTU RAW: "You gain 4 Edges during character creation, another at every even Level" (p.52) -- regular edges have no restriction on Skill Edge use. Only the bonus Skill Edges at 2/6/12 have the rank restriction.

## Verdict

**APPROVED**

No CRITICAL or HIGH issues found. One MEDIUM cosmetic display issue (MED-01) does not block approval. All PTU 1.05 mechanics are correctly implemented. All four applicable decrees are respected.

## Required Changes

None. MED-01 is a cosmetic improvement that can be addressed in a future pass.
