# P0 Specification

## A. XP Calculation Utility (P0)

### New File: `app/utils/experienceCalculation.ts`

Pure functions, zero DB access, full breakdown output. Follows `captureRate.ts` pattern.

#### Constants

```typescript
// PTU Experience Chart (Core p.203)
// Maps level -> cumulative XP needed to reach that level
export const EXPERIENCE_CHART: Record<number, number> = {
  1: 0, 2: 10, 3: 20, 4: 30, 5: 40,
  6: 50, 7: 60, 8: 70, 9: 80, 10: 90,
  11: 110, 12: 135, 13: 160, 14: 190, 15: 220,
  16: 250, 17: 285, 18: 320, 19: 360, 20: 400,
  21: 460, 22: 530, 23: 600, 24: 670, 25: 745,
  26: 820, 27: 900, 28: 990, 29: 1075, 30: 1165,
  31: 1260, 32: 1355, 33: 1455, 34: 1555, 35: 1660,
  36: 1770, 37: 1880, 38: 1995, 39: 2110, 40: 2230,
  41: 2355, 42: 2480, 43: 2610, 44: 2740, 45: 2875,
  46: 3015, 47: 3155, 48: 3300, 49: 3445, 50: 3645,
  51: 3850, 52: 4060, 53: 4270, 54: 4485, 55: 4705,
  56: 4930, 57: 5160, 58: 5390, 59: 5625, 60: 5865,
  61: 6110, 62: 6360, 63: 6610, 64: 6865, 65: 7125,
  66: 7390, 67: 7660, 68: 7925, 69: 8205, 70: 8485,
  71: 8770, 72: 9060, 73: 9350, 74: 9645, 75: 9945,
  76: 10250, 77: 10560, 78: 10870, 79: 11185, 80: 11505,
  81: 11910, 82: 12320, 83: 12735, 84: 13155, 85: 13580,
  86: 14010, 87: 14445, 88: 14885, 89: 15330, 90: 15780,
  91: 16235, 92: 16695, 93: 17160, 94: 17630, 95: 18105,
  96: 18585, 97: 19070, 98: 19560, 99: 20055, 100: 20555
}

// Default significance multiplier presets (GM convenience)
export const SIGNIFICANCE_PRESETS = {
  insignificant: 1,
  below_average: 1.5,
  average: 2,
  above_average: 3,
  significant: 4,
  major: 5,
} as const

export type SignificancePreset = keyof typeof SIGNIFICANCE_PRESETS
```

#### Types

```typescript
export interface DefeatedEnemy {
  species: string
  level: number
  isTrainer: boolean  // Trainers count as 2x level for XP
}

export interface XpCalculationInput {
  defeatedEnemies: DefeatedEnemy[]
  significanceMultiplier: number  // GM-set, typically 1-5
  playerCount: number             // Number of players (NOT Pokemon)
  isBossEncounter: boolean        // Boss XP is not divided by players
}

export interface XpCalculationResult {
  totalXpPerPlayer: number
  breakdown: {
    enemyLevelsTotal: number       // Sum of enemy levels (trainers counted 2x)
    baseExperienceValue: number    // enemyLevelsTotal (before multiplier)
    significanceMultiplier: number
    multipliedXp: number           // base * multiplier
    playerCount: number
    isBossEncounter: boolean
    perPlayerXp: number            // final per-player amount
    enemies: {
      species: string
      level: number
      isTrainer: boolean
      xpContribution: number       // Effective level contribution
    }[]
  }
}

export interface XpApplicationResult {
  pokemonId: string
  species: string
  previousExperience: number
  xpGained: number
  newExperience: number
  previousLevel: number
  newLevel: number
  levelsGained: number
  levelUps: LevelUpEvent[]
}

export interface LevelUpEvent {
  newLevel: number
  statPointsGained: number        // Always 1 per level
  tutorPointGained: boolean       // True if level is divisible by 5
  newMovesAvailable: string[]     // Moves learned at this level from learnset
  canEvolve: boolean              // Whether evolution is available at this level
  newAbilitySlot: 'second' | 'third' | null  // Level 20 or 40
}
```

#### Functions

```typescript
/**
 * Calculate post-encounter XP per player.
 * PTU Core p.460: total defeated levels, apply significance, divide by players.
 */
export function calculateEncounterXp(input: XpCalculationInput): XpCalculationResult

/**
 * Given a Pokemon's current experience and XP to add, determine the new level
 * and any level-up events.
 * PTU Core p.202-203.
 */
export function calculateLevelUps(
  currentExperience: number,
  currentLevel: number,
  xpToAdd: number,
  learnset?: { level: number; move: string }[],
  evolutionLevels?: number[]
): XpApplicationResult

/**
 * Get the XP needed for a specific level from the chart.
 */
export function getXpForLevel(level: number): number

/**
 * Get the level a Pokemon should be at given a total experience value.
 */
export function getLevelForXp(totalXp: number): number

/**
 * Get XP remaining until next level.
 */
export function getXpToNextLevel(currentExperience: number, currentLevel: number): number
```

### Why Pure Functions

The XP calculation must be:
1. **Testable** -- Unit tests can verify every edge case without DB setup
2. **Reusable** -- The same functions serve the API endpoint, the UI preview, and future training XP
3. **Auditable** -- Full breakdown shows the GM exactly how XP was computed

---


## B. XP Calculation API Endpoint (P0)

### `POST /api/encounters/:id/xp-calculate`

**Purpose:** Calculate XP for a completed encounter without applying it. This is a read-only preview endpoint the GM uses before approving distribution.

**Request Body:**
```typescript
{
  significanceMultiplier: number  // Required, 1-10
  playerCount: number             // Required, 1+
  isBossEncounter?: boolean       // Optional, default false
  trainerEnemyIds?: string[]      // Optional: which defeated enemies were Trainers (level counted 2x)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    totalXpPerPlayer: number
    breakdown: XpCalculationResult['breakdown']
    // Convenience: list of player-side Pokemon who participated
    participatingPokemon: {
      id: string
      species: string
      nickname: string | null
      currentLevel: number
      currentExperience: number
      ownerId: string | null
      ownerName: string | null
    }[]
  }
}
```

**Logic:**
1. Load encounter by ID (must exist, may be active or ended)
2. Read `defeatedEnemies` from encounter record
3. Enrich with `isTrainer` flag from `trainerEnemyIds` (or infer from combatant type if the defeated enemy was a human combatant)
4. Call `calculateEncounterXp()` pure function
5. Collect participating player-side Pokemon from combatants (side === 'players' and type === 'pokemon')
6. Return calculation + participant list

**Validation:**
- `significanceMultiplier` must be a number between 0.5 and 10
- `playerCount` must be a positive integer

### Data Model Changes for P0

**Encounter.defeatedEnemies** -- Extend the existing `{ species: string; level: number }` to include `type: 'pokemon' | 'human'`:

```typescript
{ species: string; level: number; type: 'pokemon' | 'human' }
```

This change is backwards-compatible: existing entries without `type` default to `'pokemon'`. The `damage.post.ts` endpoint already pushes to this array when a combatant faints; we add the `type` field there.

**No new Prisma columns** for P0. The existing `defeatedEnemies` JSON column and `Pokemon.experience` column are sufficient.

---


## C. XP Distribution API Endpoint (P0)

### `POST /api/encounters/:id/xp-distribute`

**Purpose:** Apply XP to Pokemon after GM approval. This is the write endpoint.

**Request Body:**
```typescript
{
  significanceMultiplier: number
  playerCount: number
  isBossEncounter?: boolean
  trainerEnemyIds?: string[]
  // Distribution: how each player splits their XP among their Pokemon
  distribution: {
    pokemonId: string
    xpAmount: number
  }[]
}
```

**Validation Rules:**
- Each `pokemonId` must exist in the database
- Each `pokemonId` should belong to a player-side combatant in the encounter (warn but allow override for GM flexibility with non-participant Pokemon)
- The sum of `xpAmount` across all Pokemon belonging to the same player must not exceed `totalXpPerPlayer` (prevent over-allocation) -- unless GM explicitly overrides
- `xpAmount` must be a non-negative integer

**Response:**
```typescript
{
  success: true,
  data: {
    results: XpApplicationResult[]
    totalXpDistributed: number
  }
}
```

**Logic:**
1. Recalculate `totalXpPerPlayer` from encounter data (verify client values match)
2. Validate distribution does not exceed per-player totals
3. For each Pokemon in distribution:
   a. Load Pokemon from DB
   b. Calculate new experience total: `currentExperience + xpAmount`
   c. Determine new level from experience chart
   d. If leveled up, load learnset from SpeciesData to identify available moves
   e. Update Pokemon record: `experience`, `level`, `tutorPoints` (if level crossed a /5 boundary)
   f. Build `XpApplicationResult` with level-up events
4. Return all results

**Database Writes:**
```sql
UPDATE Pokemon SET
  experience = :newExperience,
  level = :newLevel,
  tutorPoints = tutorPoints + :tutorPointsGained
WHERE id = :pokemonId
```

Note: Stat points from leveling are NOT auto-applied. The GM/player must manually allocate them (P2 addresses this). The API only updates `experience`, `level`, and `tutorPoints`.

---

