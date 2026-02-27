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
