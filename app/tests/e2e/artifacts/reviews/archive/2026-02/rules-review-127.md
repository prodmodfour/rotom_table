---
review_id: rules-review-127
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - stat-points-per-level
  - skill-rank-caps
  - edge-count-per-level
  - feature-count-per-level
  - bonus-skill-edges
  - milestone-bonuses
  - per-stat-cap
  - trainer-hp-formula
  - evasion-formula
  - background-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Step-5-Assign-Combat-Stats
  - core/02-character-creation.md#Character-Advancement
  - core/02-character-creation.md#Trainer-Progression-Chart
  - core/02-character-creation.md#Step-2-Create-Background
  - core/02-character-creation.md#Step-3-Choose-Edges
  - core/02-character-creation.md#Step-4-Choose-Features
  - core/02-character-creation.md#Step-6-Find-Derived-Stats
  - core/03-skills-edges-and-features.md#Skills
reviewed_at: 2026-02-23T07:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Stat Points Per Level

- **Rule:** "Every Level you gain a Stat Point." and "Level 1 Trainers begin with... 10 additional points among your Combat Stats" (`core/02-character-creation.md#Character-Advancement`, p.19; `Step-5-Assign-Combat-Stats`, p.15)
- **Implementation:** `getStatPointsForLevel(level)` returns `10 + Math.max(0, level - 1)` in `app/constants/trainerStats.ts:34-36`. This produces 10 at level 1, 11 at level 2, 19 at level 10, 59 at level 50.
- **Verification:** Tested all 50 levels against the Trainer Progression Chart (pp.19-21). Every level matches the "Total Stats" column exactly.
- **Status:** CORRECT

### 2. Skill Rank Caps (Novice / Adept / Expert / Master)

- **Rule:** "Keep in mind you cannot raise Skills above Novice at your starting level!" (p.13). "Level 2 -- Adept Skills: You now qualify to Rank Up Skills to Adept" (p.19). "Level 6 -- Expert Skills: You now qualify to Rank Up Skills to Expert" (p.19). "Level 12 - Master Skills: You now qualify to Rank Up Skills to Master" (p.19). Also confirmed in Chapter 3 (p.34): "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12."
- **Implementation:** `getMaxSkillRankForLevel(level)` in `app/constants/trainerStats.ts:51-56` returns `'Master'` for level >= 12, `'Expert'` for level >= 6, `'Adept'` for level >= 2, `'Novice'` otherwise. `isSkillRankAboveCap(rank, level)` at lines 58-64 compares against the ordered rank array.
- **Verification:** Thresholds match PTU text verbatim. The rank order array `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` correctly reflects the 6 skill ranks from PTU p.33-34.
- **Status:** CORRECT

### 3. Edge Count Per Level

- **Rule:** "Starting Trainers begin with four Edges" (p.13). "Every even Level you gain an Edge" (p.19). Bonus Skill Edges at levels 2, 6, 12 (p.19).
- **Implementation:** `getExpectedEdgesForLevel(level)` in `app/constants/trainerStats.ts:74-85`. Base = `4 + Math.floor(Math.max(1, level) / 2)` (starting 4 + 1 per even level). Bonus Skill Edges: +1 each at levels 2, 6, 12.
- **Verification:** Tested against all "Total Edges" values in the progression chart. Level 1=4, Level 2=6, Level 6=9, Level 10=11, Level 12=13, Level 20=17, Level 50=32. All match the chart exactly.
- **Status:** CORRECT

### 4. Feature Count Per Level

- **Rule:** "Starting Trainers begin with four Features... They also choose one Training Feature" (pp.13-14). "Every odd Level you gain a Feature" (p.19).
- **Implementation:** `getExpectedFeaturesForLevel(level)` in `app/constants/trainerStats.ts:97-99`. Returns `5 + Math.floor(Math.max(0, level - 1) / 2)`. The 5 = 4 class features + 1 Training Feature at level 1.
- **Verification:** Tested against all "Total Features" values in the progression chart. Level 1=5, Level 3=6, Level 5=7, Level 10=9, Level 20=14, Level 50=29. All match.
- **Status:** CORRECT

### 5. Bonus Skill Edges (Milestone Levels)

- **Rule:** "Level 2: You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." "Level 6: You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Expert Rank." "Level 12: You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Master Rank." (all from p.19)
- **Implementation:** The bonus Skill Edges are counted in `getExpectedEdgesForLevel()` and included in the total. The restriction that these edges cannot raise to the newly unlocked rank is documented in the informational message at `validateSkillBackground()` line 144 but not hard-enforced. This is appropriate since the system uses soft warnings, not hard constraints.
- **Status:** CORRECT

### 6. Milestone Bonuses (Amateur/Capable/Veteran/Elite/Champion)

- **Rule:** Level 5 Amateur: "On every even-numbered Level Up from Level 6 through Level 10, you gain +1 Stat Point that must be spent on Attack or Special Attack. You also gain +2 Stat Points, representing Levels 2 and 4, retroactively." OR "Gain one General Feature." (p.19). Level 10 Capable: Stat Points (Lv12-20) OR "Gain two Edges." Level 20 Veteran: Same pattern (Lv22-30) OR 2 Edges. Level 30 Elite: Same OR 2 Edges OR General Feature. Level 40 Champion: Same OR 2 Edges OR General Feature.
- **Implementation:** These are correctly documented as informational messages in `validateEdgesAndFeatures()` (lines 203-215) and `validateStatAllocation()` (lines 64-69). They are not included in the base counts because they are choice-based bonuses (GM discretion), which is explicitly stated in both code comments and user-facing messages.
- **Status:** CORRECT -- Milestone bonuses are intentionally excluded from automatic counts and flagged as manual additions. This is the right design choice because a character could choose stat points OR edges/features at each milestone, making automatic counting impossible.

### 7. Per-Stat Cap

- **Rule:** "You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat." (p.15, Step 5). For level-up: "Trainers don't follow Base Relations, so feel free to spend these freely." (p.19)
- **Implementation:** `MAX_POINTS_PER_STAT = 5` enforced only at `level === 1` in both `validateStatAllocation()` (lines 50-61) and `incrementStat()` (line 128 in useCharacterCreation.ts). The UI's disabled state also respects this: `level === 1 && statPoints[stat.key] >= MAX_POINTS_PER_STAT` (StatAllocationSection.vue line 30).
- **Verification:** The 5-per-stat cap is exclusively for the initial 10-point allocation at level 1. Level-up stat points are unrestricted ("spend freely"). For a level 2+ character creation, removing the cap is correct because the character could have allocated their level-up point(s) to any stat including one already at 5.
- **Status:** CORRECT

### 8. Trainer HP Formula

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) +10" (p.16). Also: "(Trainer Level x2) + (HP x3) + 10" (p.18 Quick-Start).
- **Implementation:** `form.level * 2 + computedStats.value.hp * 3 + 10` in `useCharacterCreation.ts` line 115. Where `computedStats.hp = BASE_HP (10) + form.statPoints.hp`.
- **Verification:** Cross-checked with Lisa's example (p.16): Level 1, HP stat 15 (with Feature tags) => 1*2 + 15*3 + 10 = 57. Formula matches.
- **Status:** CORRECT

### 9. Evasion Formula

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense" (p.15). Same pattern for Special Defense -> Special Evasion, Speed -> Speed Evasion.
- **Implementation:** `Math.min(6, Math.floor(stat / 5))` in `useCharacterCreation.ts` lines 119-123.
- **Verification:** Lisa's example: Defense 5 => 1 Physical Evasion, Speed 10 => 2 Speed Evasion. Both match. Cap at 30 => min(6, 6) = 6. Cap at 35 => min(6, 7) = 6.
- **Status:** CORRECT

### 10. Background Validation

- **Rule:** "Rank up one Skill to Adept Rank and one other Skill to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic." (p.14). "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (p.14). "you cannot use Edges to raise other Skills up to Adept until you are at least Level 2" (p.13).
- **Implementation:** `validateSkillBackground()` checks exactly 1 Adept, 1 Novice, 3 Pathetic. The Pathetic restriction is enforced in `addSkillEdge()` (line 245-247). The Adept cap at level 1 is enforced via `isSkillRankAboveCap()` at line 258.
- **Status:** CORRECT

## Summary

All 10 mechanics verified against PTU Core Chapter 2 (pp.12-21) and Chapter 3 (p.34). Every progression formula was tested against the complete Trainer Progression Chart spanning levels 1-50. No discrepancies found between the implementation and the rulebook.

The implementation correctly handles the distinction between baseline progression (deterministic formulas) and milestone choice bonuses (GM discretion). The soft warning approach is appropriate -- these are creation aids, not hard blockers.

The errata document (errata-2.md / September 2015 Playtest) contains no changes to trainer progression, stat allocation, skill rank caps, or character creation mechanics, so no errata overrides apply.

## Rulings

1. **Per-stat cap removal at level > 1:** APPROVED. The 5-per-stat limit is explicitly for the initial 10-point pool at level 1. Level-up points are stated as "spend freely" with no per-stat restriction.

2. **Milestone bonuses excluded from automatic counts:** APPROVED. These are choice-based (stat points vs. edges vs. features) and cannot be computed automatically. Documenting them as informational messages is the correct approach.

3. **Bonus Skill Edge rank restriction as soft warning:** APPROVED. The PTU text says the bonus Skill Edges at levels 2/6/12 "may not be used to Rank Up a Skill to [newly unlocked] Rank." This is documented in the info message but not hard-enforced. Given the system is a soft warning system (not a hard blocker), and the GM has final say, this is appropriate.

## Verdict

**APPROVED** -- All progression formulas are correct. All thresholds match PTU Core verbatim. No critical, high, or medium issues found.

## Required Changes

None.
