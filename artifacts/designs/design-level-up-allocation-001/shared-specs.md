# Shared Specs: Pokemon Level-Up Allocation UI

## Existing Code Analysis

### Data Model (Prisma Schema)

**Pokemon** stores nature-adjusted base stats and calculated stats:
- `baseHp/baseAttack/.../baseSpeed` -- nature-adjusted base stats (NOT raw species base)
- `currentAttack/.../currentSpeed` -- calculated stats (base + added stat points)
- `currentHp` / `maxHp` -- current and maximum HP
- `level` / `experience` -- current level and cumulative XP
- `nature: String` -- JSON `{ name, raisedStat, loweredStat }`
- `abilities: String` -- JSON array `[{ name, effect }]`
- `moves: String` -- JSON array of full move objects
- `species: String` -- species name (key into SpeciesData)

**SpeciesData** stores species reference data:
- `baseHp/baseAttack/.../baseSpeed` -- raw species base stats (before nature)
- `abilities: String` -- JSON array of all ability names
- `numBasicAbilities: Int` -- count of Basic abilities (remaining are Advanced + 1 High)
- `learnset: String` -- JSON `[{ level, move }]`

**AbilityData** stores ability reference:
- `name: String` (unique)
- `effect: String`
- `trigger: String?`

**MoveData** stores move reference:
- Full move details (name, type, damageClass, frequency, ac, damageBase, range, effect)

**Key insight:** The Pokemon model stores nature-adjusted base stats, NOT raw species base stats. The `baseHp` field = species base HP +/- nature modifier. This means:
- Stat points allocated = `currentStat - baseStat` (for non-HP stats)
- For HP: `hpStat = (maxHp - level - 10) / 3`, then `hpStatPoints = hpStat - baseHp`
- Total stat points should equal `level + 10`

### Level-Up Detection Chain

1. **XP applied** via `POST /api/pokemon/:id/add-experience` or `POST /api/encounters/:id/xp-distribute`
2. **Level-up calculated** by `calculateLevelUps()` in `utils/experienceCalculation.ts`
3. **Results returned** as `XpApplicationResult[]` with `LevelUpEvent[]` per Pokemon
4. **Displayed** by `LevelUpNotification.vue` (encounter context) or `PokemonLevelUpPanel.vue` (sheet context)
5. **MISSING: No allocation workflow follows**

### Current Level-Up Information Components

**`app/components/pokemon/PokemonLevelUpPanel.vue`**
- Used in: `app/pages/gm/pokemon/[id].vue` (Pokemon sheet, edit mode only)
- Props: `pokemonId`, `currentLevel`, `targetLevel`
- Fetches level-up summary from `POST /api/pokemon/:id/level-up-check`
- Displays: stat points count, tutor points, new moves list, ability milestones
- **Limitation:** Read-only. No controls to actually allocate/assign anything.

**`app/components/encounter/LevelUpNotification.vue`**
- Used in: `app/components/encounter/XpDistributionResults.vue`
- Props: `results: XpApplicationResult[]`
- Displays: per-Pokemon level-up details (stat points, tutor points, moves, abilities, evolution)
- **Limitation:** Read-only notification. No action buttons.

### Pokemon Sheet Page

**`app/pages/gm/pokemon/[id].vue`**
- Edit mode with Save/Cancel buttons
- `PokemonLevelUpPanel` shown in edit mode when `editData.level > pokemon.level`
- Save calls `libraryStore.updatePokemon()` which PUTs to `/api/pokemon/:id`
- Tabs: Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes

### Server Endpoints

**`PUT /api/pokemon/:id`** -- General-purpose update
- Accepts any combination of fields
- Already supports `baseStats`, `currentStats`, `maxHp`, `abilities`, `moves`
- No validation of Base Relations or stat point totals
- This is the existing write path but is too permissive for level-up allocation

**`POST /api/pokemon/:id/add-experience`** -- Add XP
- Validates amount, applies XP, calculates level-ups
- Updates `level`, `experience`, `tutorPoints`, `maxHp` (level component only)
- Returns `XpApplicationResult` with level-up events
- **Does NOT allocate stat points** -- the +1 per level is tracked but not applied

**`POST /api/pokemon/:id/level-up-check`** -- Query level-up info
- Returns what would happen from current level to target level
- Uses `checkLevelUp()` and `summarizeLevelUps()` from `utils/levelUpCheck.ts`

### Utilities

**`app/utils/levelUpCheck.ts`**
- `checkLevelUp(input)` -- pure function returning per-level info
- `summarizeLevelUps(infos)` -- aggregates multiple levels
- Returns: `statPointsGained`, `newMoves`, `abilityMilestone`, `tutorPointGained`

**`app/utils/experienceCalculation.ts`**
- `calculateLevelUps()` -- wraps `checkLevelUp()` with XP math
- `LevelUpEvent` type includes `canEvolve`, `newAbilitySlot`, `newMovesAvailable`

**`app/constants/natures.ts`**
- `NATURE_TABLE` -- all 36 natures with raise/lower stats
- `applyNatureToBaseStats(baseStats, natureName)` -- applies modifiers, returns new stats object
- HP: +1/-1, non-HP: +2/-2, minimum 1

### Pokemon Generator Service

**`app/server/services/pokemon-generator.service.ts`**
- `distributeStatPoints(baseStats, level)` -- weighted random distribution for NPC/wild Pokemon
- `enforceBaseRelations(baseStats, distributedPoints, statKeys)` -- sorts allocated points to maintain ordering
- These are NPC-oriented (random). Player-owned Pokemon need GM-controlled allocation.

### Stat Point Allocation in Current System

Currently, stat points are **not explicitly tracked**. The system:
1. Stores nature-adjusted base stats (`base<Stat>`)
2. Stores calculated stats (`current<Stat>`)
3. The difference is the allocated stat points
4. When level increases via XP, only `maxHp` is updated (by +1 per level for the level component)
5. Stat points from leveling are NOT auto-applied -- the GM manually edits stats in edit mode

This means there's no enforcement of Base Relations during manual stat editing. The new allocation UI must fill this gap.

## PTU Level-Up Rules (Core Chapter 5, p.202)

### Level-Up Sequence (PTU p.202)

> "Whenever your Pokemon Levels up, follow this list:
> First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule.
> Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens.
> Finally, your Pokemon may gain a new Ability. This happens at Level 20 and Level 40."

### Base Relations Rule (PTU p.198)

> "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."

Key nuances:
- Equal base stats form a "tier" and need not maintain order relative to each other
- Features can break Base Relations (e.g., "Enduring Soul" allows HP to exceed normal ordering)
- The ordering is based on **nature-adjusted** base stats (decree-035)

### Stat Point Budget

- Total stat points = Level + 10
- Level 1 Pokemon: 11 stat points
- Each level: +1 more stat point
- Level 100 Pokemon: 110 stat points

### Abilities (PTU p.200)

> "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities."
> "At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities."

The ability list structure in SpeciesData:
- Positions 0 to `numBasicAbilities - 1`: Basic Abilities
- Positions `numBasicAbilities` to `length - 2`: Advanced Abilities
- Last position: High Ability

Level 20 pool: Basic + Advanced (all except High)
Level 40 pool: all abilities (Basic + Advanced + High)

### Moves (PTU p.200)

> "Pokemon may learn a maximum of 6 Moves from all sources combined."

At each level, check the learnset for moves at that level. The Pokemon MAY learn them (optional). If already at 6 moves, one must be replaced.

## Types and Interfaces

### Stat Point Extraction

```typescript
/** Stat point extraction from a current Pokemon */
interface StatPointExtraction {
  /** Nature-adjusted base stats (as stored in Pokemon.base<Stat>) */
  natureAdjustedBase: Stats
  /** Current calculated stats (as stored in Pokemon.current<Stat>) */
  calculatedStats: Stats
  /** Extracted stat point allocation: calculated - nature-adjusted base */
  statPointsAllocated: Stats
  /** Total stat points (should equal level + 10) */
  totalStatPoints: number
  /** Expected stat points at this level (level + 10) */
  expectedStatPoints: number
  /** Whether the extracted total matches the expected total */
  isConsistent: boolean
}
```

### Base Relations Validation

```typescript
/** Result of Base Relations validation */
interface BaseRelationsValidation {
  /** Whether the allocation is valid */
  valid: boolean
  /** Violation messages if invalid */
  violations: string[]
  /** Stat ordering tiers (highest to lowest), with equal stats grouped */
  tiers: Array<{
    stats: Array<keyof Stats>
    baseValue: number
  }>
  /** For each stat, which stats it must be >= (after allocation) */
  constraints: Array<{
    stat: keyof Stats
    mustBeGreaterOrEqualTo: Array<keyof Stats>
  }>
}
```

### Level-Up Allocation State

```typescript
/** Client-side state for the allocation workflow */
interface LevelUpAllocationState {
  /** Pokemon ID being allocated */
  pokemonId: string
  /** Number of unallocated stat points */
  unallocatedPoints: number
  /** Current allocation (editable) */
  pendingAllocation: Stats
  /** Which stats are valid targets for the next point */
  validTargets: Record<keyof Stats, boolean>
  /** Base Relations validation result */
  validation: BaseRelationsValidation
  /** Ability milestone info (if applicable) */
  abilityMilestone: {
    type: 'second' | 'third' | null
    availableAbilities: Array<{ name: string; effect: string; category: string }>
    selectedAbility: { name: string; effect: string } | null
  }
  /** New moves available (if any) */
  newMoves: {
    available: Array<{ name: string; level: number }>
    currentMoveCount: number
    maxMoves: number
  }
}
```

### Endpoint Types

```typescript
/** POST /api/pokemon/:id/allocate-stats */
interface AllocateStatsRequest {
  /** Stat to allocate a point to */
  stat: keyof Stats
  /** How many points to allocate (default 1) */
  points?: number
}

interface AllocateStatsResponse {
  success: boolean
  data: {
    pokemon: Pokemon
    newStatValue: number
    remainingUnallocated: number
    validation: BaseRelationsValidation
  }
}

/** POST /api/pokemon/:id/assign-ability */
interface AssignAbilityRequest {
  /** Name of the ability to assign */
  abilityName: string
  /** Which milestone this assignment is for */
  milestone: 'second' | 'third'
}

/** POST /api/pokemon/:id/learn-move */
interface LearnMoveRequest {
  /** Name of the move to learn */
  moveName: string
  /** Index of the move to replace (0-5), or null to add to empty slot */
  replaceIndex: number | null
}
```

## Existing Integration Points

### Where Allocation UI Hooks In

**Sheet context (PokemonLevelUpPanel):**
- Currently: shows level-up info when editing level in Pokemon sheet
- After: shows allocation controls inline below the info panel
- Trigger: `editData.level > pokemon.level` (user changes level in edit mode)

**Encounter context (LevelUpNotification):**
- Currently: shows level-up summary after XP distribution
- After: adds "Allocate" action button per Pokemon that leveled up
- Trigger: XP distribution results in `levelsGained > 0`
- Action: opens allocation modal or navigates to Pokemon sheet

### WebSocket Events

Level-up allocation should broadcast changes:
- `character_update` (existing event) -- triggered when stats change
- No new event type needed -- stat/ability/move changes are entity updates

### Shared Code with Evolution (feature-006)

The following utilities are needed by BOTH level-up allocation and evolution stat redistribution:

1. `validateBaseRelations(natureAdjustedBase, statPoints)` -- identical logic
2. `extractStatPoints(pokemon)` -- identical extraction formula
3. `applyNatureToBaseStats()` -- already exists in `constants/natures.ts`

**Recommended location:** `app/utils/baseRelations.ts` (new shared utility file)

If evolution (feature-006) ships first, these will already exist in `evolution.service.ts` and should be extracted. If level-up ships first, evolution will import from the shared utility.
