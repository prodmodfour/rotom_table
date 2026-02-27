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
