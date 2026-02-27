---
domain: pokemon-lifecycle
audited_at: 2026-02-26T20:30:00Z
audited_by: implementation-auditor
rules_catalog: pokemon-lifecycle-rules.md
capabilities_catalog: pokemon-lifecycle-capabilities.md
matrix: pokemon-lifecycle-matrix.md
source_files_read: 16
items_audited: 29
correct: 25
incorrect: 1
approximation: 3
ambiguous: 0
---

# Implementation Audit: Pokemon Lifecycle

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 25 |
| Incorrect | 1 |
| Approximation | 3 |
| Ambiguous | 0 |
| **Total Audited** | **29** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 2 | R022 (Incorrect), R066 (Approximation) |
| LOW | 2 | R017 (Approximation), R064 (Approximation) |

### Changes from Previous Audit (2026-02-19)

The following items were re-classified due to code changes since the last audit:

| Rule | Previous | Current | Reason |
|------|----------|---------|--------|
| R009 | Incorrect (CRITICAL) | Correct | `distributeStatPoints()` now uses `level + 10` |
| R006 | Incorrect (HIGH) | Correct | `applyNatureToBaseStats()` now called before stat distribution |
| R010 | Approximation (HIGH) | Correct | `enforceBaseRelations()` added with tier-based enforcement |
| R058 | Approximation (LOW) | Correct | Full XP calculation system implemented |
| R026 | Approximation (MEDIUM) | Correct | `checkLevelUp()` + `calculateLevelUps()` implemented |
| R023 | Correct (storage) | Correct (calculation) | Tutor points now auto-calculated on level-up |
| R060 | Correct (storage) | Correct (full chart) | `EXPERIENCE_CHART` with all 100 levels implemented |
| R014 | Approximation | Correct (detection) | `checkLevelUp()` reports ability milestone at level 20 |
| R015 | Approximation | Correct (detection) | `checkLevelUp()` reports ability milestone at level 40 |
| R027 | Approximation | Correct (detection) | `checkLevelUp()` reports +1 stat point per level |
| R028 | Approximation | Correct (detection) | `checkLevelUp()` reports new moves from learnset |

---

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

## Tier 2: Core Workflows

### R038: Pokemon Creation Workflow

- **Rule:** "Start by checking the Pokedex to see the Pokemon's Base Stats. Next, apply your Pokemon's Nature. Next, add +X Stat Points. Calculate your Pokemon's Hit Points when you're done."
- **Expected behavior:** Full creation pipeline: species lookup -> nature application -> stat distribution -> HP calculation.
- **Actual behavior:** `generatePokemonData()` at `pokemon-generator.service.ts:83-186`:
  1. Species lookup (lines 85-132): reads all base stats, types, abilities, learnset from SpeciesData.
  2. Nature selection and application (lines 136-144): random nature, `applyNatureToBaseStats()`.
  3. Stat distribution (line 147): `distributeStatPoints(adjustedBaseStats, input.level)` with `level + 10` points.
  4. HP calculation (line 150): `level + (calculatedStats.hp * 3) + 10`.
  5. Move selection (lines 153-155): up to 6 moves from learnset.
  6. Ability selection (lines 158-161): random Basic Ability.
- **Classification:** Correct
- **Notes:** All 4 creation pathways (manual, wild spawn, template, CSV import) converge through this service.

### R013: Abilities -- Initial Assignment

- **Rule:** "All Pokemon are born with a single Ability, chosen from their Basic Abilities."
- **Expected behavior:** One ability, selected from Basic Abilities only.
- **Actual behavior:** `pickRandomAbility()` at `pokemon-generator.service.ts:512-518`: `const basicCount = Math.min(numBasicAbilities, abilityNames.length)`. Selects one random ability from the first `basicCount` entries in the abilities list (which are ordered Basic then Advanced in SpeciesData).
- **Classification:** Correct

### R026: Level Up Workflow

- **Rule:** "Whenever your Pokemon Levels up: First, +1 Stat Point. Next, check for Move or Evolution. Finally, check Abilities at Level 20 and 40."
- **Expected behavior:** Per-level detection of stat points, new moves, ability milestones, tutor points.
- **Actual behavior:** `checkLevelUp()` at `utils/levelUpCheck.ts:49-89`: iterates from oldLevel+1 to newLevel, for each level computing:
  - `statPointsGained: 1` (always)
  - `newMoves`: moves from learnset at exactly this level
  - `abilityMilestone`: 'second' at 20, 'third' at 40
  - `tutorPointGained`: level >= 5 && level % 5 === 0
  `calculateLevelUps()` at `experienceCalculation.ts:315-353` wraps this with XP calculations. Both `xp-distribute.post.ts` and `add-experience.post.ts` use this to detect and report all level-up events.
- **Classification:** Correct
- **Notes:** The level-up events are detected and reported. Stat point allocation and move/ability assignment still require manual GM action (no auto-apply), but the detection and notification system is correct.

### R059: Experience Distribution Rules

- **Rule:** "Experience can only be distributed to Pokemon who participated directly in an encounter, and it can be split however the player sees fit."
- **Expected behavior:** Per-Pokemon XP allocation with player choice.
- **Actual behavior:** `xp-distribute.post.ts` accepts a `distribution` array of `{ pokemonId, xpAmount }` entries. Validates total does not exceed available XP. Each Pokemon gets its specified XP amount independently. Duplicate pokemonIds are rejected. The endpoint does not restrict which Pokemon can receive XP (the "participated" constraint is left to the GM/player via the XpDistributionModal).
- **Classification:** Correct

---

## Tier 3: Core Constraints

### R002: Pokemon Maximum Level

- **Rule:** "Pokemon have a maximum Level of 100."
- **Expected behavior:** Level capped at 100.
- **Actual behavior:** `MAX_LEVEL = 100` at `experienceCalculation.ts:52`. `getLevelForXp()` returns max 100. `MAX_EXPERIENCE = 20555` (XP for level 100). `calculateLevelUps()` caps experience at `MAX_EXPERIENCE`. No Pokemon can level past 100 through the XP system. Manual level edits via PUT have no enforcement, but this is consistent with the GM-tool design.
- **Classification:** Correct

### R010: Base Relations Rule

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."
- **Expected behavior:** After stat distribution, higher base stats must have >= stat points added compared to lower base stats. Equal base stats may differ.
- **Actual behavior:** `enforceBaseRelations()` at `pokemon-generator.service.ts:406-461`:
  1. Groups stats by base value into tiers (line 412-419).
  2. Sorts all added-point values descending (line 422).
  3. Assigns largest added values to highest base tier, smallest to lowest (lines 432-458).
  4. Within a tier (equal base stats), shuffles randomly (lines 445-450).
- **Classification:** Correct
- **Notes:** This was Approximation (HIGH) in the previous audit. The `enforceBaseRelations()` function has been added to guarantee the ordering constraint. The weighted random distribution still creates the initial allocation, but the enforcement step corrects any violations.

### R007: Neutral Natures

- **Rule:** "These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."
- **Expected behavior:** When raise === lower, no stat modification.
- **Actual behavior:** `applyNatureToBaseStats()` at `constants/natures.ts:97-98`: `if (nature.raise === nature.lower) return { ...baseStats }`. The 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) all have raise === lower and return unmodified stats.
- **Classification:** Correct

---

## Tier 4: Enumerations

### R003: Base Stats Definition

- **Rule:** "Start by checking the Pokedex to see the Pokemon's Base Stats."
- **Expected behavior:** 6 base stats stored per species.
- **Actual behavior:** SpeciesData model stores `baseHp`, `baseAttack`, `baseDefense`, `baseSpAtk`, `baseSpDef`, `baseSpeed`. Seeded from PTU pokedex files. `generatePokemonData()` reads all 6.
- **Classification:** Correct

### R004: Pokemon Types

- **Rule:** "Each Pokemon has one or two elemental Types, chosen from the 18 Types."
- **Expected behavior:** 18 types, 1-2 per Pokemon.
- **Actual behavior:** SpeciesData stores `type1` (required) and `type2` (optional). Generator propagates both. Pokemon model stores `type1`/`type2`.
- **Classification:** Correct

### R005: Nature System

- **Rule:** "Next, apply your Pokemon's Nature. This will simply raise one stat, and lower another."
- **Expected behavior:** 36 natures (30 non-neutral + 6 neutral) with raise/lower mappings.
- **Actual behavior:** `NATURE_TABLE` at `constants/natures.ts:22-72`: 36 entries. 5 HP-raising, 5 Attack-raising, 5 Defense-raising, 5 SpAtk-raising, 5 SpDef-raising, 5 Speed-raising, 6 neutral. Each has `raise` and `lower` NatureStat fields.
- **Classification:** Correct

### R018: Natural Move Sources

- **Rule:** "A Pokemon may fill as many of its Move slots as it likes with Moves from its Natural Move List. This includes all Moves gained from Level Up."
- **Expected behavior:** Learnset contains level-up moves, selectable at generation.
- **Actual behavior:** SpeciesData stores `learnset` as JSON array of `{ level, move }`. `selectMovesFromLearnset()` at `pokemon-generator.service.ts:467-505`: filters `entry.level <= level`, takes last 6, looks up full MoveData.
- **Classification:** Correct

### R061: Size Classes

- **Rule:** "Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4."
- **Expected behavior:** Size stored per species, mapped to grid token size.
- **Actual behavior:** SpeciesData stores `size`. `sizeToTokenSize()` in `grid-placement.service.ts` maps Small/Medium -> 1, Large -> 2, Huge -> 3, Gigantic -> 4.
- **Classification:** Correct

### R062: Weight Classes

- **Rule:** "Weight Classes range from 1 to 6."
- **Expected behavior:** Weight class integer per species.
- **Actual behavior:** SpeciesData stores `weightClass` as Int. Propagated to Pokemon capabilities via generator.
- **Classification:** Correct

### R063: Species Capabilities

- **Rule:** "Pokemon do not derive their Capabilities from their Skill Ranks; instead, they are determined by their species."
- **Expected behavior:** Capabilities come from species data, not from stats.
- **Actual behavior:** SpeciesData stores all capability fields (overland, swim, sky, burrow, levitate, teleport, power, jump, weightClass, size, otherCapabilities). Generator copies them directly to Pokemon.
- **Classification:** Correct

### R065: Pokemon Skills

- **Rule:** "The Pokedex document assigns each species a roll value in Athletics, Acrobatics, Combat, Stealth, Perception, and Focus."
- **Expected behavior:** 6 skills per species with dice formulas.
- **Actual behavior:** SpeciesData stores `skills` as JSON object. Propagated to Pokemon via generator.
- **Classification:** Correct

---

## Tier 5: Partial Items -- Present Portion

### R014: Ability 20 Milestone Detection

- **Rule:** "At Level 20, a Pokemon gains a Second Ability."
- **Expected behavior:** Level-up system reports the level 20 ability milestone.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:67-69`: `if (level === 20) { abilityMilestone = 'second' }`. Reported in level-up results. `PokemonLevelUpPanel` displays it (per matrix).
- **Classification:** Correct (detection present)
- **Notes:** The milestone is detected and reported. No UI exists for the GM to assign the ability from the species' Basic/Advanced list. Manual edit via PUT required.

### R015: Ability 40 Milestone Detection

- **Rule:** "At Level 40, a Pokemon gains a Third Ability."
- **Expected behavior:** Level-up system reports the level 40 ability milestone.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:70-72`: `if (level === 40) { abilityMilestone = 'third' }`. Reported in level-up results.
- **Classification:** Correct (detection present)

### R017: Move Limit at Generation (6 Moves)

- **Rule:** "Pokemon may learn a maximum of 6 Moves from all sources combined."
- **Expected behavior:** Generation limits to 6 moves. Manual edits should enforce the limit.
- **Actual behavior:** `selectMovesFromLearnset()` at `pokemon-generator.service.ts:471-473`: `.slice(-6)` limits to 6 moves. PUT endpoint (`pokemon/[id].put.ts`) allows saving any number of moves with no validation.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** Generation path correctly limits to 6. The lack of enforcement on manual edits is the gap. PTU does note "certain Abilities and Features may allow a Pokemon to bypass this limit", so no hard enforcement may be intentional.

### R027: Stat Point Reporting (+1/Level)

- **Rule:** "First, it gains +1 Stat Point."
- **Expected behavior:** Level-up detection reports +1 stat point per level gained.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:78`: `statPointsGained: 1` for each level. `summarizeLevelUps()` sums them into `totalStatPoints`.
- **Classification:** Correct (detection present)
- **Notes:** Stat points are reported but not auto-allocated. GM must manually allocate via the Pokemon sheet.

### R028: New Move Detection

- **Rule:** "Check its Pokedex Entry to see if [the Pokemon] learned any Moves that Level."
- **Expected behavior:** Level-up detection reports moves available at the new level.
- **Actual behavior:** `checkLevelUp()` at `levelUpCheck.ts:60-62`: `const newMoves = learnset.filter(entry => entry.level === level).map(entry => entry.move)`. Reports all moves at exactly this level.
- **Classification:** Correct (detection present)
- **Notes:** Moves are reported but not auto-added. GM must manually add via the Pokemon sheet.

### R064: Capabilities Stored

- **Rule:** "Certain Moves can grant Capabilities or boost existing Capabilities. These bonuses are lost if the Move is ever forgotten."
- **Expected behavior:** Capabilities stored on Pokemon, linked to moves that grant them.
- **Actual behavior:** Capabilities stored as JSON on Pokemon (from species data). No linkage between moves and capability grants. If a capability-granting move is forgotten, the capability persists until manually removed.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** This is a data integrity gap. The app stores capabilities but does not track their source (species vs. move-granted). GM must manually remove move-granted capabilities when forgetting moves.

### R066: Mega Stone Held Item

- **Rule:** "First, the Pokemon must be holding a special type of Held Item called a Mega Stone."
- **Expected behavior:** Held item field can store Mega Stone name.
- **Actual behavior:** Pokemon model has `heldItem` field (String, nullable). Generator accepts optional `heldItem` in generated data. Can store any string including Mega Stone names.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** The held item field exists and can store a Mega Stone name. No Mega Evolution trigger, stat changes, or constraint enforcement exists. This is a storage-only approximation of the full Mega Evolution system.

---

## Incorrect Items

### R022: Tutor Points -- Initial Value

- **Rule:** "Each Pokemon, upon hatching, starts with a single precious Tutor Point."
- **Expected behavior:** Newly generated Pokemon should have tutor points = 1 + floor(level / 5) based on their level. A level 1 Pokemon gets 1 tutor point.
- **Actual behavior:** `generatePokemonData()` does not compute tutor points. `createPokemonRecord()` at `pokemon-generator.service.ts:201`: `experience: 0` -- no tutor points field is set. The `createdPokemonToEntity()` at line 312: `tutorPoints: 0`. Prisma schema defaults `tutorPoints` to 0. A newly created Pokemon starts with 0 tutor points regardless of level.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** Level-up tutor point gains are correctly handled by `checkLevelUp()` and applied during XP distribution. But the base tutor point (1 for hatching) and catch-up tutor points (for Pokemon generated at levels > 1) are missing from the generation pipeline. A level 20 wild Pokemon should have 1 (initial) + 4 (levels 5, 10, 15, 20) = 5 tutor points, but starts with 0. The `xp-distribute` and `add-experience` endpoints only add tutor points for levels gained after creation, not retroactively for the creation level.

---

## Escalation Notes

### R022: Tutor Points Not Set at Generation

- **Impact:** All generated Pokemon (wild spawns, template loads, etc.) start with 0 tutor points regardless of level. A level 30 wild Pokemon should have 7 tutor points (1 initial + 6 from levels 5-30) but has 0.
- **Recommendation:** MEDIUM-severity ticket. The `generatePokemonData()` or `createPokemonRecord()` function should compute initial tutor points as `1 + floor(level / 5)` for levels >= 5, or just `1` for levels < 5.

### R017: Move Limit Not Enforced on Manual Edits

- **Impact:** GM can save a Pokemon with more than 6 moves via the PUT endpoint. While PTU allows some abilities to bypass this limit, having no validation means data entry errors go undetected.
- **Recommendation:** LOW-severity ticket. Add optional validation (warning, not blocking) on the PUT endpoint.

### R064: Move-Granted Capabilities Not Tracked

- **Impact:** Capabilities persist even when their granting move is forgotten. This is a rare scenario and the GM can manually fix it.
- **Recommendation:** LOW-severity ticket. Quality-of-life improvement.
