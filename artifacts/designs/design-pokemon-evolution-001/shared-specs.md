# Shared Specs: Pokemon Evolution System

## Existing Code Analysis

### Data Model (Prisma Schema)

**SpeciesData** already stores evolution stage info but NOT evolution triggers:
- `evolutionStage: Int` -- current species' stage (1, 2, or 3)
- `maxEvolutionStage: Int` -- total stages in the evolution line
- `learnset: String` -- JSON `[{ level, move }]` for this species' move list
- `abilities: String` -- JSON array of ability names (Basic, Advanced, High)
- `numBasicAbilities: Int` -- count of Basic abilities (rest are Advanced + 1 High)
- `capabilities: String` -- JSON array of other capabilities
- `skills: String` -- JSON `{ skillName: diceFormula }`
- Movement stats: `overland`, `swim`, `sky`, `burrow`, `levitate`, `teleport`
- `size: String` -- PTU size class
- `power`, `jumpHigh`, `jumpLong`, `weightClass` -- physical capabilities

**Pokemon** (instance) stores all combat state:
- `species: String` -- current species name (key into SpeciesData)
- `baseHp/baseAttack/.../baseSpeed` -- nature-adjusted base stats (NOT raw species base)
- `currentAttack/.../currentSpeed` -- calculated stats (base + added stat points)
- `maxHp` -- calculated from HP stat via PTU formula
- `abilities: String` -- JSON array `[{ name, effect }]`
- `moves: String` -- JSON array of full move objects
- `capabilities: String` -- JSON object with all movement + capability data
- `skills: String` -- JSON `{ skillName: diceFormula }`
- `type1`, `type2` -- current types
- `nature: String` -- JSON `{ name, raisedStat, loweredStat }`
- `level`, `experience`, `heldItem`

**Key insight:** The Pokemon model stores nature-adjusted base stats, NOT raw species base stats. The `baseHp` field = species base HP +/- nature modifier. This means stat point allocation = `current<Stat>` - `base<Stat>`.

### Level-Up System

**`app/utils/levelUpCheck.ts`** -- Pure utility that checks what happens at each level:
- +1 stat point per level
- New moves from learnset
- Ability milestones (Level 20, Level 40)
- Tutor points every 5 levels
- NOTE: Explicitly does NOT handle evolution (see comment in file)

**`app/utils/experienceCalculation.ts`** -- XP calculation and level-up events:
- `calculateLevelUps()` accepts optional `evolutionLevels: number[]` parameter
- `LevelUpEvent.canEvolve: boolean` -- already flags evolution eligibility
- BUT: `canEvolve` is always `false` because no code provides evolution levels

**`app/components/encounter/LevelUpNotification.vue`** -- Already displays:
- "Evolution may be available at Level X!" when `canEvolve` is true
- Uses `PhArrowCircleUp` icon for evolution entries

**`app/components/pokemon/PokemonLevelUpPanel.vue`** -- Shows:
- "Check the Pokedex entry for possible evolution at this level." (hardcoded reminder)

### Pokemon Generator Service

**`app/server/services/pokemon-generator.service.ts`** provides:
- `generatePokemonData()` -- generates full Pokemon data from species + level
- `createPokemonRecord()` -- writes to DB
- `distributeStatPoints()` -- weighted random distribution respecting Base Relations
- `applyNatureToBaseStats()` -- imported from `constants/natures.ts`

The generator creates NEW Pokemon. Evolution is different -- it mutates an EXISTING Pokemon's species and recalculates stats while preserving stat point investments.

### Pokemon Update Endpoint

**`app/server/api/pokemon/[id].put.ts`** -- General-purpose update that accepts any combination of fields. Already supports updating `species`, `baseStats`, `currentStats`, `types`, `abilities`, `moves`, `maxHp`. This endpoint could be used as the final write target for evolution, but the stat recalculation logic needs to live in a dedicated service.

### Capture Rate System

**`app/utils/captureRate.ts`** uses `evolutionStage` and `maxEvolutionStage` to calculate capture difficulty modifiers. Evolution changes these values, so the capture system already handles the data -- it just needs the Pokemon's species to be updated correctly.

### Seed Parser

**`app/prisma/seed.ts`** parses pokedex files and extracts:
- Evolution stage/max stage from lines like `"2 - Charmeleon Minimum 15"`
- BUT discards the trigger text (e.g., "Minimum 15", "Water Stone", "Holding Metal Coat Minimum 30")
- This trigger data must either be parsed during seeding (preferred) or parsed on-demand from pokedex files

### Natures

**`app/constants/natures.ts`** provides:
- `NATURE_TABLE` -- all 36 natures with raise/lower stats
- `applyNatureToBaseStats()` -- applies +2/-2 (or +1/-1 for HP) to base stats, minimum 1
- This function is essential for evolution stat recalculation

## PTU Evolution Rules (Core Chapter 5, p.202)

### When Evolution Occurs

"Upon Evolving, several changes occur in a Pokémon."

Evolution can be triggered during level-up (PTU p.202):
> "Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry to see if either of these happens."

Evolution is optional:
> "You may choose not to Evolve your Pokémon if you wish."

### Stat Recalculation (PTU p.202)

> "Take the new form's Base Stats, apply the Pokémon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokémon, spreading the Stats as you wish. Again, Pokémon add +X Stat Points to their Base Stats, where X is the Pokémon's Level plus 10. You must of course, still follow the Base Relations Rule."

Formula breakdown:
1. Get new species' raw base stats from SpeciesData
2. Apply the Pokemon's existing Nature to those base stats
3. Player redistributes stat points (Level + 10 total)
4. Recalculate HP: `Level + (HP stat * 3) + 10`

### Ability Remapping (PTU p.202)

> "Abilities change to match the Ability in the same spot in the Evolution's Ability List."

This means positional mapping:
- If the Pokemon had Basic Ability 1 of the old species, it gets Basic Ability 1 of the new species
- If it had Advanced Ability 1, it gets Advanced Ability 1 of the new species
- High Ability maps to High Ability

### Move Learning (PTU p.202)

> "When Pokémon Evolve, they can immediately learn any Moves that their new form learns at a Level lower than their minimum Level for Evolution but that their previous form could not learn."

Example: Snorlax evolves at Minimum 30. If Snorlax's learnset has moves at levels 1-29 that Munchlax couldn't learn, those are available immediately upon evolution.

### Skills and Capabilities (PTU p.202)

> "Finally, check the Pokémon's Skills and Capabilities and update them for its Evolved form."

Direct replacement from the new species' SpeciesData.

## Evolution Trigger Data Format

### Pokedex File Format (observed patterns)

```
Evolution:
  1 - Charmander
  2 - Charmeleon Minimum 15
  3 - Charizard Minimum 30

  1 - Eevee
  2 - Vaporeon Water Stone
  2 - Jolteon Thunderstone
  2 - Flareon Fire Stone
  2 - Espeon Dawn Stone
  2 - Umbreon Dusk Stone
  2 - Leafeon Leaf Stone
  2 - Glaceon Shiny Stone

  1 - Scyther
  2 - Scizor Holding Metal Coat Minimum 30

  1 - Pichu
  2 - Pikachu Minimum 10
  3 - Raichu Thunderstone Minimum 20
```

### Trigger Categories (from PTU pokedex analysis)

| Trigger Type | Pattern in Pokedex Text | Examples |
|---|---|---|
| Level | `Minimum <N>` | Charmander -> Charmeleon at 15 |
| Stone | `<StoneName>` | Eevee -> Vaporeon with Water Stone |
| Held Item + Level | `Holding <Item> Minimum <N>` | Scyther -> Scizor Holding Metal Coat Min 30 |
| Stone + Level | `<StoneName> Minimum <N>` | Pikachu -> Raichu Thunderstone Min 20 |
| None (base stage) | (no trigger text) | Charmander (stage 1) |

NOTE: PTU 1.05 simplifies the evolution triggers compared to the video games. Happiness-based, trade-based, and location-based evolutions are converted to stone-based or level-based triggers in PTU. For example:
- Espeon (happiness+day in games) -> Dawn Stone in PTU
- Machamp (trade in games) -> Level 40 in PTU

### Proposed Schema: EvolutionTrigger

```typescript
interface EvolutionTrigger {
  /** Species that can evolve FROM */
  fromSpecies: string
  /** Species that evolves INTO */
  toSpecies: string
  /** Stage number of the target species (2 or 3) */
  targetStage: number
  /** Minimum level required (null if no level requirement) */
  minimumLevel: number | null
  /** Required item: stone name or held item name (null if level-only) */
  requiredItem: string | null
  /** Whether the item must be held (vs consumed like a stone) */
  itemMustBeHeld: boolean
}
```

### Where to Store Evolution Triggers

**Option A: Encode in SpeciesData (new column)**
- Add `evolutionChain: String @default("[]")` -- JSON array of EvolutionTrigger
- Populated during seeding by parsing the evolution text
- Pros: Single query to check evolution eligibility
- Cons: Redundant data (each species in a chain stores the full chain)

**Option B: Separate EvolutionTrigger table**
- New Prisma model with `fromSpecies`, `toSpecies`, `minimumLevel`, `requiredItem`, `itemMustBeHeld`
- Pros: Normalized, no redundancy, easy to query "what can X evolve into?"
- Cons: Extra table, extra join

**RECOMMENDATION: Option A** -- Store on SpeciesData as `evolutionTriggers` JSON column. Reasons:
1. Evolution data is static reference data, same as learnsets and abilities
2. Avoids join overhead in the hot path (level-up check runs per Pokemon per level)
3. Consistent with existing pattern (learnset, skills, capabilities are all JSON columns)
4. Redundancy is minimal -- same trigger list stored on each species in a family

### Proposed SpeciesData Addition

```prisma
model SpeciesData {
  // ... existing fields ...

  // Evolution triggers (JSON array of EvolutionTrigger objects)
  // Each entry describes one possible evolution FROM this species
  // Empty array means no further evolution possible
  evolutionTriggers String @default("[]")
}
```

Example stored values:
- Charmander: `[{ "toSpecies": "Charmeleon", "targetStage": 2, "minimumLevel": 15, "requiredItem": null, "itemMustBeHeld": false }]`
- Charmeleon: `[{ "toSpecies": "Charizard", "targetStage": 3, "minimumLevel": 30, "requiredItem": null, "itemMustBeHeld": false }]`
- Charizard: `[]`
- Eevee: `[{ "toSpecies": "Vaporeon", "targetStage": 2, "minimumLevel": null, "requiredItem": "Water Stone", "itemMustBeHeld": false }, ...]`

## Types and Interfaces

### Core Evolution Types

```typescript
/** Describes one possible evolution path from a species */
interface EvolutionTrigger {
  toSpecies: string
  targetStage: number
  minimumLevel: number | null
  requiredItem: string | null
  itemMustBeHeld: boolean
}

/** Input for evolution eligibility check */
interface EvolutionCheckInput {
  pokemonId: string
  currentSpecies: string
  currentLevel: number
  heldItem: string | null
}

/** Result of evolution eligibility check */
interface EvolutionCheckResult {
  canEvolve: boolean
  availableEvolutions: Array<{
    toSpecies: string
    trigger: EvolutionTrigger
    /** Why this evolution IS available */
    reason: string
  }>
  ineligibleEvolutions: Array<{
    toSpecies: string
    trigger: EvolutionTrigger
    /** Why this evolution is NOT available */
    reason: string
  }>
}

/** Input for performing the evolution */
interface EvolutionInput {
  pokemonId: string
  targetSpecies: string
  /** Stat point allocation for the new form (Level + 10 total) */
  statPoints: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
}

/** Result of performing the evolution */
interface EvolutionResult {
  success: boolean
  pokemon: Pokemon
  changes: {
    previousSpecies: string
    newSpecies: string
    previousTypes: string[]
    newTypes: string[]
    previousBaseStats: Stats
    newBaseStats: Stats
    previousAbilities: Ability[]
    newAbilities: Ability[]
    newMovesAvailable: string[]
    previousCapabilities: PokemonCapabilities
    newCapabilities: PokemonCapabilities
    previousSkills: Record<string, string>
    newSkills: Record<string, string>
    previousSize: string
    newSize: string
    previousMaxHp: number
    newMaxHp: number
  }
}
```

### Stat Recalculation Types

```typescript
/** Stat point extraction from a current Pokemon */
interface StatPointExtraction {
  /** Nature-adjusted base stats of the OLD species */
  oldNatureAdjustedBase: Stats
  /** Current calculated stats */
  currentCalculated: Stats
  /** Extracted stat point allocation: calculated - nature-adjusted base */
  statPointsAllocated: Stats
  /** Total stat points (should equal level + 10) */
  totalStatPoints: number
}

/** Stat recalculation input for the new species */
interface StatRecalculationInput {
  /** Raw base stats from the new species' SpeciesData */
  newSpeciesBaseStats: Stats
  /** Pokemon's existing nature */
  nature: Nature
  /** Pokemon's current level */
  level: number
  /** Stat points to allocate (from GM redistribution) */
  statPoints: Stats
}

/** Stat recalculation result */
interface StatRecalculationResult {
  /** New nature-adjusted base stats */
  newBaseStats: Stats
  /** New calculated stats (base + points) */
  newCalculatedStats: Stats
  /** New max HP from formula */
  newMaxHp: number
  /** Whether the allocation satisfies Base Relations */
  baseRelationsValid: boolean
  /** Validation errors if Base Relations violated */
  violations: string[]
}
```

## Existing Integration Points

### Level-Up Flow (where evolution hooks in)

1. XP is applied via `POST /api/encounter/:id/xp-distribute`
2. `calculateLevelUps()` is called, returns `LevelUpEvent[]` with `canEvolve` flag
3. `LevelUpNotification.vue` displays "Evolution may be available"
4. **MISSING:** No actual evolution workflow follows

### WebSocket Events (needed for sync)

Evolution must broadcast to Group View:
- `pokemon_evolved` event with species change, new stats, new sprite
- Existing patterns: `character_update` broadcasts entity changes

### Sprite System

The sprite URL must change on evolution. Current pattern:
- Gen 5 and below: Pokemon Black 2/White 2 sprites
- Gen 6+: Latest 3D game sprites
- `spriteUrl` field on Pokemon model -- set manually or via generator
