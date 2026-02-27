# P1 Specification

## B. Significance Multiplier and XP Calculation (P1)

**Dependency:** ptu-rule-055 (XP system). This tier can be implemented in parallel with ptu-rule-055 or sequentially after it.

### GM User Flow

1. GM runs an encounter to completion (enemies are defeated, tracked in `defeatedEnemies`)
2. GM opens the significance panel (new component in the encounter view)
3. GM sets significance multiplier (dropdown or slider: x1.0 to x5.0, step 0.5) with PTU guidance text
4. GM optionally applies a difficulty adjustment (the +-0.5 to +-1.5 modifier from R009)
5. Panel shows calculated XP breakdown:
   - Base XP: sum of defeated enemy levels (trainers at 2x)
   - Significance: x{value}
   - Per-player XP: base * significance / playerCount
6. GM clicks "Distribute XP" to apply to participating Pokemon (or manually adjusts)

### Data Model Changes

#### `app/types/encounter.ts`

Add significance-related fields to the `Encounter` interface:

```typescript
export interface Encounter {
  // ... existing fields ...

  // Significance (PTU R008/R009)
  significanceMultiplier: number  // x1.0 to x5.0+ (default 1.0)

  // XP tracking (enhanced from current defeatedEnemies)
  defeatedEnemies: {
    combatantId: string
    species: string
    level: number
    isTrainer: boolean  // trainers count as 2x level for XP
  }[]
}
```

#### `app/prisma/schema.prisma`

Add `significanceMultiplier` column to Encounter model:

```prisma
model Encounter {
  // ... existing fields ...
  significanceMultiplier Float @default(1.0)
}
```

### New File: `app/utils/xpCalculation.ts`

Pure function, zero DB access. Follows `captureRate.ts` and `damageCalculation.ts` pattern.

```typescript
export interface XpCalcInput {
  defeatedEnemies: Array<{
    level: number
    isTrainer: boolean
  }>
  significanceMultiplier: number
  playerCount: number
}

export interface XpCalcResult {
  baseXp: number                    // sum of enemy levels (trainers at 2x)
  significanceMultiplier: number
  totalXp: number                   // base * significance
  xpPerPlayer: number               // total / playerCount
  breakdown: {
    enemyLevels: number             // sum of non-trainer levels
    trainerLevels: number           // sum of trainer levels (at 2x)
    playerCount: number
  }
}

export function calculateEncounterXp(input: XpCalcInput): XpCalcResult {
  const enemyLevels = input.defeatedEnemies
    .filter(e => !e.isTrainer)
    .reduce((sum, e) => sum + e.level, 0)

  const trainerLevels = input.defeatedEnemies
    .filter(e => e.isTrainer)
    .reduce((sum, e) => sum + (e.level * 2), 0)

  const baseXp = enemyLevels + trainerLevels
  const totalXp = Math.round(baseXp * input.significanceMultiplier)
  const xpPerPlayer = Math.floor(totalXp / Math.max(1, input.playerCount))

  return {
    baseXp,
    significanceMultiplier: input.significanceMultiplier,
    totalXp,
    xpPerPlayer,
    breakdown: {
      enemyLevels,
      trainerLevels,
      playerCount: input.playerCount
    }
  }
}
```

### New Endpoint: `app/server/api/encounters/[id]/significance.put.ts`

Updates the significance multiplier on an encounter.

```typescript
// Request: { significanceMultiplier: number }
// Validates: 0.5 <= value <= 10.0
// Response: updated encounter
```

### New Endpoint: `app/server/api/encounters/[id]/xp.get.ts`

Computes XP breakdown for the encounter using the pure utility.

```typescript
// Query: ?playerCount=3
// Response: XpCalcResult
// Reads defeatedEnemies and significanceMultiplier from encounter record
```

### New Component: `app/components/encounter/SignificancePanel.vue`

Displays in the encounter view (after combat or during). Contains:

1. **Significance selector** -- dropdown with PTU-labeled tiers:
   - x1.0 - Insignificant (routine wild encounter)
   - x1.5 - Minor (slightly challenging wild)
   - x2.0 - Everyday (average trainer battle)
   - x3.0 - Notable (strong trainer, gym warm-up)
   - x4.0 - Significant (gym leader, rival)
   - x5.0 - Climactic (championship, legendary)
   - Custom (manual entry for values outside presets)

2. **Difficulty adjustment** -- secondary modifier (R009): slider from -1.5 to +1.5 in 0.5 steps. Applied additively: final significance = base significance + difficulty adjustment (clamped to >= 0.5).

3. **XP breakdown** -- read-only display:
   - Base XP: {sum of defeated enemy levels}
   - Significance: x{multiplier}
   - Total XP: {base * significance}
   - Per player ({N} players): {total / N}

4. **Player count input** -- defaults to number of `player` combatants on the Players side.

### Store Changes

#### `app/stores/encounter.ts`

Add `setSignificance(encounterId, multiplier)` action. Add `getXpBreakdown(encounterId, playerCount)` action that calls the XP endpoint.

---

