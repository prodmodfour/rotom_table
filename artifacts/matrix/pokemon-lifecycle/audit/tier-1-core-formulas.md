## Tier 1: Core Formulas

### R011: Pokemon HP Formula

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10"
- **Expected behavior:** maxHp = level + (hpStat * 3) + 10, where hpStat is the calculated stat (base + nature + stat points).
- **Actual behavior:** `generatePokemonData()` at `server/services/pokemon-generator.service.ts:150`: `const maxHp = input.level + (calculatedStats.hp * 3) + 10`. `calculatedStats.hp` is the nature-adjusted base stat plus distributed stat points.
- **Classification:** Correct
- **Notes:** HP formula uses the fully calculated HP stat. Level-up endpoints (`xp-distribute.post.ts:192-197`, `add-experience.post.ts:103`) correctly increase maxHp by 1 per level gained (the level component of the formula).

### R006: Nature Stat Adjustments

- **Rule:** "HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1."
- **Expected behavior:** Nature applied to base stats before stat distribution. HP: +1/-1, others: +2/-2, floor 1.
- **Actual behavior:** `constants/natures.ts:78-80`: `modifierAmount()` returns 1 for HP, 2 for all others. `applyNatureToBaseStats()` at lines 87-106: creates a new stats object, applies `+modifierAmount(raise)` and `-modifierAmount(lower)` with `Math.max(1, ...)` floor. Neutral natures (raise === lower) return unmodified stats. In `generatePokemonData()` at line 144: `const adjustedBaseStats = applyNatureToBaseStats(baseStats, selectedNature)` -- applied before stat distribution.
- **Classification:** Correct
- **Notes:** This was Incorrect in the previous audit. The code has been fixed: nature is now applied to base stats before `distributeStatPoints()` receives them.

### R009: Stat Points Allocation Total

- **Rule:** "Next, add +X Stat Points, where X is the Pokemon's Level plus 10."
- **Expected behavior:** Total distributed stat points = level + 10.
- **Actual behavior:** `distributeStatPoints()` at `pokemon-generator.service.ts:364`: `let remainingPoints = Math.max(0, level + 10)`. For a level 30 Pokemon, this is 40 stat points.
- **Classification:** Correct
- **Notes:** This was Incorrect (CRITICAL) in the previous audit. The code has been fixed from `level - 1` to `level + 10`, matching the PTU rulebook exactly.

### R023: Tutor Points -- Level Progression

- **Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."
- **Expected behavior:** +1 tutor point at levels 5, 10, 15, 20, 25, ..., 100.
- **Actual behavior:** `checkLevelUp()` at `utils/levelUpCheck.ts:76`: `const tutorPointGained = level >= 5 && level % 5 === 0`. The `xp-distribute.post.ts:182-184` and `add-experience.post.ts:92-95` both count tutor points gained across level-ups and add them to the Pokemon's `tutorPoints` field in the DB update.
- **Classification:** Correct
- **Notes:** Tutor points are now auto-calculated and applied during XP distribution and manual XP grants. The initial tutor point (hatching) is not auto-set; generation defaults to 0.

### R058: Experience Calculation from Encounter

- **Rule:** "Total the Level of the enemy combatants defeated. For encounters where Trainers were directly involved, treat their Level as doubled. Multiply by Significance Multiplier. Divide by number of players."
- **Expected behavior:** XP = floor(floor(sumEnemyLevels * significance) / playerCount), trainers at 2x.
- **Actual behavior:** `calculateEncounterXp()` at `utils/experienceCalculation.ts:258-299`:
  - Step 1: `xpContribution = enemy.isTrainer ? enemy.level * 2 : enemy.level` (line 272)
  - Step 2: `multipliedXp = Math.floor(enemyLevelsTotal * significanceMultiplier)` (line 279)
  - Step 3: `perPlayerXp = Math.floor(multipliedXp / Math.max(1, playerCount))` (line 283)
  - Boss encounters skip division (line 282-283).
- **Classification:** Correct
- **Notes:** This was Approximation in the previous audit. The full XP calculation system is now implemented with proper formula, types, and breakdown. Both the `encounterBudget.ts` and `experienceCalculation.ts` versions implement the same formula (the former for budget analysis, the latter for actual XP distribution).

### R060: Experience Chart

- **Rule:** "Whenever your Pokemon gains Experience, add its Experience to its previous Experience total. If the new total reaches the next Level's 'Exp Needed', the Pokemon Levels up."
- **Expected behavior:** Full level 1-100 experience chart with cumulative XP thresholds.
- **Actual behavior:** `EXPERIENCE_CHART` at `utils/experienceCalculation.ts:28-49`: complete mapping from level 1 (0 XP) to level 100 (20,555 XP). `getLevelForXp()` at line 222: walks from 100 down to find the level. `MAX_EXPERIENCE = 20555`.
- **Classification:** Correct

### R012: Evasion Calculation (Cross-Domain)

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6"
- **Expected behavior:** Evasion = min(6, floor(stat / 5)). Uses calculated stats (not base).
- **Actual behavior:** `calculateEvasion()` at `utils/damageCalculation.ts:102-109`: `const statEvasion = Math.min(6, Math.floor((applyStageModifier(baseStat, combatStage) + statBonus) / 5))`. Uses the stage-modified calculated stat. Cap at 6. Additive evasion bonus stacks on top. Total clamped to min 0.
- **Classification:** Correct
- **Notes:** The function uses the calculated stat (currentDefense, currentSpDef, currentSpeed) which includes base + nature + stat points. This matches PTU: evasion is derived from the full stat value.

---
