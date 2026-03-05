---
domain: pokemon-lifecycle
type: audit-tier
tier: 2
name: Core Workflows
items_audited: 8
correct: 8
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
---

# Tier 2: Core Workflows

8 items verifying core workflow behavior against PTU 1.05 rules.

---

## Item 10: R038 -- Pokemon Creation Workflow (C029, C030, C031)

**Rule:** "Start by checking the Pokedex to see the Pokemon's Base Stats. Next, apply your Pokemon's Nature. Next, add +X Stat Points, where X is the Pokemon's Level plus 10. [...] Calculate your Pokemon's Hit Points when you're done." (PTU p.198)

**Expected behavior:** Full creation pipeline: species lookup, nature application, stat distribution, HP calculation, move selection, ability selection.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:85-192` (`generatePokemonData()`):
1. Species lookup (lines 87-134): Reads all base stats, types, abilities, learnset, skills, capabilities from SpeciesData.
2. Nature selection and application (lines 136-146): Random nature from NATURE_TABLE, `applyNatureToBaseStats()`.
3. Stat distribution (line 149): `distributeStatPoints(adjustedBaseStats, input.level)` with `level + 10` points.
4. HP calculation (line 152): `input.level + (calculatedStats.hp * 3) + 10`.
5. Move selection (lines 155-157): Up to 6 most recent moves from learnset at or below level.
6. Ability selection (lines 160-162): Random Basic Ability from species list.
7. Tutor points (line 168): `1 + Math.floor(input.level / 5)`.
8. Gender (line 165): Random Male/Female.

`createPokemonRecord()` (lines 210-272) persists to DB with all fields. `generateAndCreatePokemon()` (lines 278-281) is the convenience wrapper.

**Classification:** Correct

---

## Item 11: R013 -- Abilities: Initial Assignment (C029)

**Rule:** "All Pokemon are born with a single Ability, chosen from their Basic Abilities. Normally the GM will decide what Ability a Pokemon starts with, either randomly or by choosing one." (PTU p.200)

**Expected behavior:** One ability selected from Basic Abilities only (not Advanced or High).

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:534-540` (`pickRandomAbility()`):
- `basicCount = Math.min(numBasicAbilities, abilityNames.length)` (line 536).
- `pool = basicCount > 0 ? basicCount : abilityNames.length` (line 537).
- Selects one random ability from the first `pool` entries (line 538).
- SpeciesData stores abilities ordered Basic-first, then Advanced, then High.
- Returns array with single ability object `[{ name, effect: '' }]`.

**Classification:** Correct

---

## Item 12: R018 -- Natural Move Sources (C002, C029)

**Rule:** "A Pokemon may fill as many of its Move slots as it likes with Moves from its Natural Move List. This includes all Moves gained from Level Up." (PTU p.200)

**Expected behavior:** Learnset contains level-up moves. Generation selects moves at or below current level.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:489-527` (`selectMovesFromLearnset()`):
- Filters learnset entries where `entry.level <= level` (line 493).
- Takes the last 6 entries (`.slice(-6)`, line 494) -- these are the 6 most recent level-up moves.
- Fetches full MoveData from DB for each move (lines 498-526).
- Learnset sourced from `SpeciesData.learnset` JSON field, populated by pokedex seed.

**Classification:** Correct

---

## Item 13: R026 -- Level Up Workflow (C018, C021)

**Rule:** "Whenever your Pokemon Levels up, follow this list: First, it gains +1 Stat Point. [...] Next, there is the possibility your Pokemon may learn a Move or Evolve. [...] Finally, your Pokemon may gain a new Ability." (PTU p.202)

**Expected behavior:** Per-level detection of stat points, new moves, evolution eligibility, ability milestones, and tutor points.

**Actual behavior:** `app/utils/levelUpCheck.ts:49-89` (`checkLevelUp()`):
- Iterates from `oldLevel + 1` to `min(newLevel, 100)` (line 58).
- For each level:
  - `statPointsGained: 1` (line 80) -- always.
  - `newMoves`: learnset entries at exactly this level (lines 60-62).
  - `abilityMilestone`: 'second' at 20, 'third' at 40 (lines 65-73).
  - `tutorPointGained`: `level >= 5 && level % 5 === 0` (line 76).
- `calculateLevelUps()` in `experienceCalculation.ts:316-354` wraps this with XP calculations, adding evolution level detection via `evolutionLevels` parameter.
- Both `xp-distribute.post.ts` and `add-experience.post.ts` use this to detect and report all level-up events, then apply DB updates for experience, level, tutorPoints, and maxHp.

**Classification:** Correct

---

## Item 14: R028 -- Level Up Move Check (C018)

**Rule:** "Check its Pokedex Entry to see if [your Pokemon may learn a Move]. If a Pokemon evolves, make sure to then check its new form's Move List to see if it learned any Moves that Level." (PTU p.202)

**Expected behavior:** New moves from learnset reported at each level gained.

**Actual behavior:** `app/utils/levelUpCheck.ts:60-62`:
```
const newMoves = learnset
  .filter(entry => entry.level === level)
  .map(entry => entry.move)
```
Reports moves available at exactly each level gained. Displayed in:
- `PokemonLevelUpPanel.vue` (line 26): Shows moves with "Learn Moves" action button.
- `LevelUpNotification.vue` (lines 48-56): Shows move count with clickable action to learn.
- `level-up-check.post.ts`: Returns `allNewMoves` via `summarizeLevelUps()`.

**Classification:** Correct

---

## Item 15: R023 -- Tutor Points: Level Progression (C018, C042)

**Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point." (PTU p.202)

**Expected behavior:** +1 tutor point at levels 5, 10, 15, 20, 25, ..., 100.

**Actual behavior:** `app/utils/levelUpCheck.ts:76`:
```
const tutorPointGained = level >= 5 && level % 5 === 0
```
This correctly identifies levels 5, 10, 15, 20, ..., 100.

DB updates in both endpoints:
- `add-experience.post.ts:106-108`: `tutorPointsGained = levelResult.levelUps.filter(lu => lu.tutorPointGained).length`.
- `add-experience.post.ts:129`: `tutorPoints: pokemon.tutorPoints + tutorPointsGained`.
- `xp-distribute.post.ts:193-195`: Same pattern.

**Classification:** Correct

---

## Item 16: R059 -- Experience Distribution Rules (C045, C078)

**Rule:** PTU p.460: "Divide by the number of Players -- not the number of Pokemon. If a Trainer used multiple Pokemon, he will have to split his experience among the Pokemon he used."

**Expected behavior:** GM allocates XP freely per Pokemon. Over-allocation prevented. No restriction on fainted Pokemon receiving XP.

**Actual behavior:** `app/server/api/encounters/[id]/xp-distribute.post.ts`:
- Accepts `distribution` array of `{ pokemonId, xpAmount }` entries (line 54).
- Validates total does not exceed `totalXpPerPlayer * playerCount` (lines 109-119).
- Rejects duplicate pokemonIds to prevent race conditions (lines 63-72).
- Each Pokemon gets its specified XP independently (lines 178-231).
- No restriction on which Pokemon can receive XP -- the "participated" constraint is left to GM judgment via the XpDistributionModal UI.
- `XpDistributionModal.vue` (C078) allows the GM to allocate per-player XP among that player's Pokemon.

**Classification:** Correct

---

## Item 17: R022 -- Tutor Points: Initial Value (C029)

**Rule:** "Each Pokemon, upon hatching, starts with a single precious Tutor Point." (PTU p.202)

**Expected behavior:** A newly created level 1 Pokemon starts with exactly 1 tutor point.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:168`:
```
const tutorPoints = 1 + Math.floor(input.level / 5)
```
- Level 1: `1 + Math.floor(1/5) = 1 + 0 = 1` -- correct.
- Level 5: `1 + Math.floor(5/5) = 1 + 1 = 2` -- correct (1 initial + 1 at level 5).
- Level 10: `1 + Math.floor(10/5) = 1 + 2 = 3` -- correct (1 initial + level 5 + level 10).
- Level 15: `1 + Math.floor(15/5) = 1 + 3 = 4` -- correct.

**Previous audit (session 59):** Classified as Incorrect (MEDIUM) because the initial value was wrong. The current formula `1 + floor(level/5)` correctly gives 1 for level 1 (initial tutor point) and scales correctly for higher levels by counting the number of 5-level milestones passed. This is now correct.

**Classification:** Correct

**Note on edge case:** For level 4 Pokemon: `1 + Math.floor(4/5) = 1`. For level 5 Pokemon: `1 + Math.floor(5/5) = 2`. This correctly models "starts with 1, gains another at level 5."

However, consider a Pokemon created at level 3 that then levels to 5: the creation gives `tutorPoints = 1`, and `checkLevelUp()` awards +1 at level 5, resulting in `tutorPoints = 2`. Compare to a Pokemon created directly at level 5: `tutorPoints = 1 + 1 = 2`. Both paths yield the same result.
