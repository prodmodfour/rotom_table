---
review_id: rules-review-107
target: ptu-rule-055
trigger: design-implementation
verdict: PASS
reviewed_commits: [ef6a3b8, fb043aa, 5ea8850, e3b0203, ecc3bac, b4ec379]
reviewed_files:
  - app/utils/experienceCalculation.ts
  - app/utils/levelUpCheck.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/types/encounter.ts
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] Experience chart values (EXPERIENCE_CHART constant vs. PTU Core p.203/p.497)
- [x] XP formula: sum defeated enemy levels, trainers count 2x, multiply by significance, divide by players
- [x] Boss encounters: XP not divided by players
- [x] Rounding: floor after division
- [x] Level 100 cap at 20,555 XP
- [x] Level-up detection (cross-reference with experience chart)
- [x] Tutor points at levels divisible by 5
- [x] Ability milestones (Level 20 = second, Level 40 = third)
- [x] +1 stat point per level
- [x] Fainted Pokemon can receive XP
- [x] defeatedEnemies type field for trainer identification

### Mechanics Verified

#### 1. Experience Chart (PTU Core p.203, p.497)
- **Rule:** The Pokemon Experience Chart maps Level 1 (0 XP) through Level 100 (20,555 XP) with specific cumulative thresholds at each level.
- **Implementation:** `EXPERIENCE_CHART` constant in `experienceCalculation.ts` (lines 26-47).
- **Spot-check (15 levels across the full range):**

| Level | PTU Book | Implementation | Match |
|-------|----------|----------------|-------|
| 1     | 0        | 0              | YES   |
| 5     | 40       | 40             | YES   |
| 10    | 90       | 90             | YES   |
| 15    | 220      | 220            | YES   |
| 20    | 400      | 400            | YES   |
| 25    | 745      | 745            | YES   |
| 30    | 1,165    | 1,165          | YES   |
| 40    | 2,230    | 2,230          | YES   |
| 50    | 3,645    | 3,645          | YES   |
| 60    | 5,865    | 5,865          | YES   |
| 70    | 8,485    | 8,485          | YES   |
| 75    | 9,945    | 9,945          | YES   |
| 80    | 11,505   | 11,505         | YES   |
| 90    | 15,780   | 15,780         | YES   |
| 95    | 18,105   | 18,105         | YES   |
| 100   | 20,555   | 20,555         | YES   |

- **Status:** CORRECT

#### 2. Base XP Calculation -- Sum of Defeated Enemy Levels (PTU Core p.460)
- **Rule:** "First off, total the Level of the enemy combatants which were defeated."
- **Implementation:** `calculateEncounterXp()` reduces `defeatedEnemies` array by summing each enemy's `xpContribution` (lines 216-225). For non-trainers, contribution = `enemy.level`. For trainers, contribution = `enemy.level * 2`.
- **Status:** CORRECT

#### 3. Trainer Enemies Counted at 2x Level (PTU Core p.460)
- **Rule:** "For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. For example, if your players fought a Level 10 Trainer with a level 20 Pokemon, Base Experience Value for this encounter is 40."
- **Implementation:** Line 220: `xpContribution: enemy.isTrainer ? enemy.level * 2 : enemy.level`. The `isTrainer` flag is derived from either `entry.type === 'human'` (new entries from `damage.post.ts`) or `trainerEnemyIds` (manual override / legacy support).
- **Book example verification:** Level 10 Trainer + Level 20 Pokemon = (10 * 2) + 20 = 40. Implementation would produce the same: trainer at level 10 contributes 20, pokemon at level 20 contributes 20, total = 40.
- **Status:** CORRECT

#### 4. Significance Multiplier (PTU Core p.460)
- **Rule:** "Consider the significance of the encounter. This will decide a value to multiply the Base Experience Value." Range x1 to x5+: insignificant x1-x1.5, average x2-x3, significant x4-x5+. Adjust by +/- x0.5 to x1.5 based on difficulty.
- **Implementation:** Line 228: `Math.floor(enemyLevelsTotal * significanceMultiplier)`. The multiplier is passed in by the GM. Presets match the book ranges: insignificant=1, below_average=1.5, average=2, above_average=3, significant=4, major=5. Validation allows 0.5-10 (inclusive of the book's full range plus headroom for extreme encounters).
- **Status:** CORRECT

#### 5. Division by Players (PTU Core p.460)
- **Rule:** "Third, divide the Experience by the number of players gaining Experience. Divide by the number of Players -- not the number of Pokemon."
- **Implementation:** Lines 231-233: `Math.floor(multipliedXp / Math.max(1, playerCount))`. Division by number of players (not Pokemon). The `Math.max(1, ...)` prevents division by zero.
- **Book example verification (p.258-259):** 3 Oddish total 39 levels, significance x1, 2 players. Implementation: 39 * 1 = 39, floor(39) = 39, floor(39 / 2) = floor(19.5) = 19. Book says "giving each player 19 Experience." MATCH.
- **Status:** CORRECT

#### 6. Boss Encounter XP -- Not Divided by Players (PTU Core p.489)
- **Rule:** "When awarding Experience for a Boss encounter, do not divide the Experience from the Boss Enemy itself by the number of players."
- **Implementation:** Lines 231-232: `isBossEncounter ? multipliedXp : Math.floor(multipliedXp / Math.max(1, playerCount))`. When `isBossEncounter` is true, division is skipped entirely and each player receives the full `multipliedXp`.
- **Status:** CORRECT

#### 7. Rounding -- Floor After Division (PTU Convention)
- **Rule:** XP values are always rounded down. Fractional XP is discarded.
- **Implementation:** `Math.floor()` applied after multiplication (line 228) and after division (line 233). Both applications are correct: the multiplication floor prevents floating-point drift from significance multipliers like 1.5 or 2.5, and the division floor correctly discards remainders.
- **Status:** CORRECT

#### 8. Level 100 Cap at 20,555 XP
- **Rule:** "Pokemon have a maximum Level of 100." (PTU Core p.202). Experience chart shows Level 100 = 20,555 XP.
- **Implementation:** `MAX_LEVEL = 100`, `MAX_EXPERIENCE = EXPERIENCE_CHART[100]` = 20,555. `calculateLevelUps()` caps at line 272: `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`. The distribution endpoint also caps at line 176: `Math.min(levelResult.newExperience, MAX_EXPERIENCE)`. `getLevelForXp()` returns `MAX_LEVEL` when `totalXp >= MAX_EXPERIENCE` (line 173). `getXpForLevel()` returns `MAX_EXPERIENCE` for levels > 100 (line 160).
- **Status:** CORRECT

#### 9. Level-Up Detection (PTU Core p.202-203)
- **Rule:** "Whenever your Pokemon gains Experience, add its Experience to its previous Experience total. If the new total reaches the next Level's 'Exp Needed', the Pokemon Levels up."
- **Implementation:** `getLevelForXp()` walks from level 100 down to find the highest level where `totalXp >= EXPERIENCE_CHART[level]` (lines 176-179). `calculateLevelUps()` determines `newLevel = getLevelForXp(newExperience)` and delegates to `checkLevelUp()` for per-level details (lines 273-274, 277-280). The `checkLevelUp()` function iterates from `oldLevel + 1` through `newLevel` (line 58), correctly handling multi-level jumps.
- **Status:** CORRECT

#### 10. +1 Stat Point Per Level (PTU Core p.202)
- **Rule:** "First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule."
- **Implementation:** `checkLevelUp()` sets `statPointsGained: 1` for every level gained (line 80). This is correctly propagated through the `LevelUpEvent` type.
- **Note:** Stat points are NOT auto-applied by the API -- the endpoint only updates experience, level, and tutor points. Stat allocation is deferred to P2 (GM/player manual action). This is a deliberate design decision, not a correctness issue.
- **Status:** CORRECT

#### 11. Tutor Points at Levels Divisible by 5 (PTU Core p.202)
- **Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."
- **Implementation:** `checkLevelUp()` line 76: `level >= 5 && level % 5 === 0`. This grants tutor points at 5, 10, 15, 20, ..., 100. The `xp-distribute` endpoint correctly tallies tutor points from level-up events (line 171-173) and adds them to the existing `tutorPoints` in the DB update (line 185).
- **Status:** CORRECT

#### 12. Ability Milestones (PTU Core p.202, p.200)
- **Rule:** "Your Pokemon may gain a new Ability. This happens at Level 20 and Level 40." Level 20 = second ability (Basic or Advanced), Level 40 = third ability (any category).
- **Implementation:** `checkLevelUp()` lines 65-73: Level 20 sets `abilityMilestone: 'second'`, Level 40 sets `abilityMilestone: 'third'`. These are propagated to `LevelUpEvent.newAbilitySlot`.
- **Status:** CORRECT

#### 13. Fainted Pokemon Can Receive XP (PTU Core p.460)
- **Rule:** "Note that unlike in the video games, Fainted Pokemon can still gain Experience."
- **Implementation:** The `xp-distribute` endpoint does not check Pokemon HP or fainted status. It accepts any valid `pokemonId` that exists in the database, regardless of current HP. The distribution list is populated from `participatingPokemon` in the calculate endpoint, which filters by side=players and type=pokemon but does not exclude fainted Pokemon.
- **Status:** CORRECT (no filtering by fainted status)

#### 14. Defeated Enemies Type Field (damage.post.ts)
- **Rule:** Trainers must be identified separately from Pokemon for the 2x level rule.
- **Implementation:** `damage.post.ts` line 62: `type: combatant.type` is pushed alongside `species` and `level` when an enemy faints. The combatant `type` is already `'pokemon'` or `'human'`, which maps directly to the XP calculation's `isTrainer` check. Backwards compatibility is maintained: `type` is optional in the type definition, and legacy entries without it default to `isTrainer: false` unless overridden by `trainerEnemyIds`.
- **Status:** CORRECT

### Edge Cases Verified

#### Floor Placement on Fractional Multipliers
- Input: 5 enemies at level 7 = 35 base, significance 1.5 = 52.5, floored = 52, divided by 3 players = 17.333, floored = 17.
- Implementation: `Math.floor(35 * 1.5)` = `Math.floor(52.5)` = 52, then `Math.floor(52 / 3)` = `Math.floor(17.333)` = 17.
- The double-floor approach (floor after multiply, floor after divide) is consistent with PTU convention and prevents fractional XP leakage. CORRECT.

#### XP to Next Level at Max
- `getXpToNextLevel(20555, 100)` returns 0 (line 193 checks `currentLevel >= MAX_LEVEL`). CORRECT.

#### Empty Defeated Enemies
- `calculateEncounterXp` with empty `defeatedEnemies` produces `enemyLevelsTotal = 0`, `multipliedXp = 0`, `perPlayerXp = 0`. CORRECT.

#### Zero XP Distribution Entry
- Validated at line 66: `xpAmount < 0` throws an error. Zero is allowed (harmless no-op). CORRECT.

### Summary
- Mechanics checked: 14
- Correct: 14
- Incorrect: 0

All PTU 1.05 experience mechanics implemented in the P0 tier are rule-accurate. The experience chart matches the book across 15 spot-checked levels spanning the full 1-100 range. The XP formula correctly totals defeated enemy levels (trainers at 2x), applies the significance multiplier, divides by players (skipping for boss encounters), and floors at each step. Level-up detection, tutor points, ability milestones, and the level 100 cap are all correctly implemented. The distribution endpoint properly recalculates server-side and updates experience, level, and tutor points in the database.
