---
review_id: rules-review-108
target: ptu-rule-056
trigger: design-implementation
verdict: FAIL
reviewed_commits: [5922d6b, d8c2c47, 9a81d53]
reviewed_files:
  - app/constants/trainerSkills.ts
  - app/constants/trainerBackgrounds.ts
  - app/utils/characterCreationValidation.ts
  - app/composables/useCharacterCreation.ts
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] Trainer skills -- all 17 skills, 3 categories (Body/Mind/Spirit)
- [x] Skill rank progression -- dice rolls and rank values
- [x] Skill rank level requirements -- Adept/Expert/Master thresholds
- [x] Starting stat bases -- HP 10, others 5
- [x] Stat point allocation rules -- 10 points, max 5 per stat
- [x] Trainer HP formula
- [x] Evasion formula and cap
- [x] All 11 sample backgrounds -- Adept/Novice/Pathetic assignments

### Mechanics Verified

#### 1. Skill Categories (Body/Mind/Spirit)
- **Rule:** PTU Core p. 33 -- "The Body Skills are Acrobatics, Athletics, Combat, Intimidate, Stealth, and Survival. The Mind Skills are General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, and Perception. The Spirit Skills are Charm, Command, Focus, and Intuition."
- **Implementation:** `PTU_SKILL_CATEGORIES` in `trainerSkills.ts` lists Body (6), Mind (7), Spirit (4) = 17 total. Names use "Ed" abbreviation (e.g., "General Ed" vs "General Education") -- acceptable display shorthand.
- **Status:** CORRECT

#### 2. Skill Rank Dice Rolls
- **Rule:** PTU Core p. 33 table -- Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6
- **Implementation:** `SKILL_RANKS` array with `{ rank, value, dice }` tuples matches exactly: values 1-6, dice "1d6" through "6d6".
- **Status:** CORRECT

#### 3. Skill Rank Level Requirements
- **Rule:** PTU Core p. 34 -- "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12."
- **Implementation:** `SKILL_RANK_LEVEL_REQS` = `{ Adept: 2, Expert: 6, Master: 12 }`
- **Status:** CORRECT

#### 4. Starting Stat Bases
- **Rule:** PTU Core p. 15 -- "Level 1 Trainers begin with 10 HP and 5 in each of their other Stats."
- **Implementation:** `BASE_HP = 10`, `BASE_OTHER = 5`
- **Status:** CORRECT

#### 5. Stat Point Allocation
- **Rule:** PTU Core p. 15 -- "You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat."
- **Implementation:** `TOTAL_STAT_POINTS = 10`, `MAX_POINTS_PER_STAT = 5`. Both `incrementStat()` and `validateStatAllocation()` enforce these limits.
- **Status:** CORRECT

#### 6. Trainer Hit Points Formula
- **Rule:** PTU Core p. 16 -- "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Implementation:** `form.level * 2 + computedStats.value.hp * 3 + 10`, where `computedStats.value.hp = BASE_HP + form.statPoints.hp`.
- **Validation:** Level 1 trainer with HP stat 13 (10 base + 3 allocated) yields `2 + 39 + 10 = 51`. Matches manual calculation. Book example (Lisa, HP 15 after feature tags) yields 57, which is correct with feature bonuses applied on top -- P0 does not include feature [+HP] tags, so the base formula is sound.
- **Status:** CORRECT

#### 7. Evasion Formula
- **Rule:** PTU Core p. 16 -- "To calculate these Evasion values, divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone."
- **Implementation:** `Math.floor(computedStats.value.defense / 5)` etc. -- the floor-divide-by-5 is correct. However, **the +6 cap is missing**. The code does not call `Math.min(6, ...)` to enforce the maximum.
- **Impact:** At level 1 the max defense is 10 (evasion 2), so the cap cannot be hit during character creation. But the formula is technically incomplete and will produce incorrect evasion values if reused at higher levels where stats exceed 30.
- **Status:** INCORRECT -- missing `Math.min(6, ...)` cap

#### 8. Default Skills (Untrained)
- **Rule:** PTU Core p. 13 -- "All Skills except for those modified by your Background begin at the Untrained Rank"
- **Implementation:** `getDefaultSkills()` initializes all 17 skills to `'Untrained'`.
- **Status:** CORRECT

#### 9. Background Structure Rule
- **Rule:** PTU Core p. 14 -- "Choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank. Then choose 3 Skills to lower one Rank, down to Pathetic."
- **Implementation:** `TrainerBackground` interface enforces exactly 1 `adeptSkill`, 1 `noviceSkill`, 3 `patheticSkills`. Validation in `validateSkillBackground()` checks these counts.
- **Status:** CORRECT

#### 10. Background Presets (per-background verification)

##### Fitness Training
- **Rule:** PTU Core p. 14 -- Adept Athletics, Novice Acrobatics, Pathetic Guile/Intuition/Focus
- **Implementation:** Matches exactly.
- **Status:** CORRECT

##### Book Worm
- **Rule:** PTU Core p. 14 -- "One Education Skill at Adept, one at Novice", Pathetic Athletics/Acrobatics/Combat
- **Implementation:** Adept General Ed, Novice Pokemon Ed, Pathetic Athletics/Acrobatics/Combat. Valid default choice for an open-ended background.
- **Status:** CORRECT (reasonable default for "choose one" rule)

##### Hermit
- **Rule:** PTU Core p. 14 -- "Adept Education Skill, Novice Perception", Pathetic Charm/Guile/Intuition
- **Implementation:** `adeptSkill: 'Perception'`, `noviceSkill: 'Survival'`, Pathetic Charm/Guile/Intuition.
- **Analysis:** The PTU text clearly says Adept goes to an Education skill and Novice goes to Perception. The code inverts this AND substitutes Survival for Perception. The code comment acknowledges the discrepancy (`// see note: PTU lists "Adept Education, Novice Perception" variant`) but the implementation contradicts the rules.
- **Status:** INCORRECT -- Adept should be an Education skill (e.g., Occult Ed), Novice should be Perception

##### Old Timer
- **Rule:** PTU Core p. 14 -- Adept Focus, Novice "Intuition or Perception", Pathetic Acrobatics/Combat/Tech Education
- **Implementation:** Adept Focus, Novice Intuition, Pathetic Acrobatics/Combat/Technology Ed. Valid choice of Intuition variant.
- **Status:** CORRECT

##### Quick and Small
- **Rule:** PTU Core p. 14 -- Adept Acrobatics, Novice Guile, Pathetic Athletics/Intimidate/Command
- **Implementation:** Matches exactly.
- **Status:** CORRECT

##### Rough
- **Rule:** PTU Core p. 14 -- Adept Combat, Novice Intimidate, Pathetic Charm/Guile/Perception
- **Implementation:** Matches exactly.
- **Status:** CORRECT

##### Silver Tongued
- **Rule:** PTU Core p. 14 -- Adept Guile, Novice "Charm or Intimidate", Pathetic Athletics/Combat/Survival
- **Implementation:** Novice Charm chosen. Matches.
- **Status:** CORRECT

##### Street Rattata
- **Rule:** PTU Core p. 14 -- Adept Guile, Novice "Perception or Stealth", Pathetic Focus/General Education/Survival
- **Implementation:** Novice Perception chosen. Pathetic Focus/General Ed/Survival. Matches.
- **Status:** CORRECT

##### Super Nerd
- **Rule:** PTU Core p. 14 -- Adept Tech Education, Novice Guile, Pathetic Charm/Intimidate/Intuition
- **Implementation:** Matches exactly.
- **Status:** CORRECT

##### Wild Child
- **Rule:** PTU Core p. 14 -- Adept Survival, Novice "Athletics or Stealth", Pathetic "General, Tech, and Medicine Education"
- **Implementation:** Novice Athletics chosen. Pathetic General Ed/Technology Ed/Medicine Ed. Matches.
- **Status:** CORRECT

##### At Least He's Pretty
- **Rule:** PTU Core p. 14 -- Adept Charm, Novice "Command or Intuition", Pathetic Combat/Intimidate/Perception
- **Implementation:** Novice Command chosen. Matches.
- **Status:** CORRECT

### Issues Found

#### ISSUE 1: Hermit background has wrong skill assignments (INCORRECT)
- **File:** `app/constants/trainerBackgrounds.ts`, lines 32-37
- **Problem:** PTU says Hermit = Adept Education Skill + Novice Perception. Code has Adept Perception + Novice Survival. Both the adept and novice are wrong.
- **Fix:** Change to `adeptSkill: 'Occult Ed'` (or another education skill as default), `noviceSkill: 'Perception'`.

#### ISSUE 2: Evasion formula missing +6 cap (INCORRECT)
- **File:** `app/composables/useCharacterCreation.ts`, lines 81-85
- **Problem:** PTU Core p. 16 states evasion has a max of +6. The formula omits `Math.min(6, ...)`.
- **Fix:** Change each evasion computation to `Math.min(6, Math.floor(stat / 5))`.

### Summary
- Mechanics checked: 10 (+ 11 individual backgrounds = 21 total checks)
- Correct: 19
- Incorrect: 2 (Hermit background, evasion cap)
