# P0 Specification

## A. Level Budget Calculation (P0)

### Pure Utility: `app/utils/encounterBudget.ts`

A pure-function utility following the `captureRate.ts` / `damageCalculation.ts` pattern: typed input, typed result with breakdown, zero side effects, zero DB access.

#### Types

```typescript
export interface BudgetCalcInput {
  /** Average Pokemon level of the player party */
  averagePokemonLevel: number
  /** Number of player trainers in the encounter */
  playerCount: number
}

export interface BudgetCalcResult {
  /** Total level budget available to spend on enemies */
  totalBudget: number
  /** Baseline XP drop per player (before significance) */
  baselineXpPerPlayer: number
  breakdown: {
    averagePokemonLevel: number
    playerCount: number
    /** averagePokemonLevel * 2 = baseline per player */
    baselinePerPlayer: number
    /** baselinePerPlayer * playerCount = total budget */
    totalBudget: number
  }
}

export type SignificanceTier = 'insignificant' | 'everyday' | 'significant' | 'climactic' | 'legendary'

export interface SignificancePreset {
  tier: SignificanceTier
  label: string
  multiplierRange: { min: number; max: number }
  defaultMultiplier: number
  description: string
}

export interface BudgetAnalysis {
  /** Total levels of enemy combatants in the encounter */
  totalEnemyLevels: number
  /** The calculated budget for the player party */
  budget: BudgetCalcResult
  /** Ratio of enemy levels to budget (1.0 = perfectly balanced) */
  budgetRatio: number
  /** Human-readable difficulty assessment */
  difficulty: 'trivial' | 'easy' | 'balanced' | 'hard' | 'deadly'
  /** Whether any trainer combatants exist (their levels count double) */
  hasTrainerEnemies: boolean
  /** Effective enemy levels (trainers count double per PTU) */
  effectiveEnemyLevels: number
}
```

#### Constants

```typescript
export const SIGNIFICANCE_PRESETS: SignificancePreset[] = [
  {
    tier: 'insignificant',
    label: 'Insignificant',
    multiplierRange: { min: 1.0, max: 1.5 },
    defaultMultiplier: 1.0,
    description: 'Random wild encounters, trivial roadside battles'
  },
  {
    tier: 'everyday',
    label: 'Everyday',
    multiplierRange: { min: 2.0, max: 3.0 },
    defaultMultiplier: 2.0,
    description: 'Standard trainer battles, strong wild Pokemon'
  },
  {
    tier: 'significant',
    label: 'Significant',
    multiplierRange: { min: 3.0, max: 4.0 },
    defaultMultiplier: 3.5,
    description: 'Gym leaders, rival encounters, mini-bosses'
  },
  {
    tier: 'climactic',
    label: 'Climactic',
    multiplierRange: { min: 4.0, max: 5.0 },
    defaultMultiplier: 4.5,
    description: 'Tournament finals, legendary encounters, arc finales'
  },
  {
    tier: 'legendary',
    label: 'Legendary',
    multiplierRange: { min: 5.0, max: 5.0 },
    defaultMultiplier: 5.0,
    description: 'Campaign-defining battles, one-of-a-kind showdowns'
  }
]

/**
 * Budget ratio thresholds for difficulty assessment.
 * Ratio = effectiveEnemyLevels / totalBudget
 */
export const DIFFICULTY_THRESHOLDS = {
  trivial: 0.4,    // < 40% of budget
  easy: 0.7,       // 40%-70% of budget
  balanced: 1.3,   // 70%-130% of budget
  hard: 1.8,       // 130%-180% of budget
  // > 180% = deadly
} as const
```

#### Core Functions

```typescript
/**
 * Calculate the level budget for an encounter.
 * PTU Encounter Creation Guide (Chapter 11): average Pokemon level * 2 * player count
 */
export function calculateEncounterBudget(input: BudgetCalcInput): BudgetCalcResult {
  const baselinePerPlayer = input.averagePokemonLevel * 2
  const totalBudget = baselinePerPlayer * input.playerCount

  return {
    totalBudget,
    baselineXpPerPlayer: baselinePerPlayer,
    breakdown: {
      averagePokemonLevel: input.averagePokemonLevel,
      playerCount: input.playerCount,
      baselinePerPlayer,
      totalBudget
    }
  }
}

/**
 * Calculate effective enemy levels for budget analysis.
 * Trainer levels count as doubled per PTU XP rules (p.460).
 */
export function calculateEffectiveEnemyLevels(
  enemies: Array<{ level: number; isTrainer: boolean }>
): { totalLevels: number; effectiveLevels: number } {
  let totalLevels = 0
  let effectiveLevels = 0
  for (const enemy of enemies) {
    totalLevels += enemy.level
    effectiveLevels += enemy.isTrainer ? enemy.level * 2 : enemy.level
  }
  return { totalLevels, effectiveLevels }
}

/**
 * Assess encounter difficulty by comparing enemy levels to budget.
 */
export function assessDifficulty(budgetRatio: number): BudgetAnalysis['difficulty'] {
  if (budgetRatio < DIFFICULTY_THRESHOLDS.trivial) return 'trivial'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.easy) return 'easy'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.balanced) return 'balanced'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.hard) return 'hard'
  return 'deadly'
}

/**
 * Full budget analysis for an encounter-in-progress.
 */
export function analyzeEncounterBudget(
  input: BudgetCalcInput,
  enemies: Array<{ level: number; isTrainer: boolean }>
): BudgetAnalysis {
  const budget = calculateEncounterBudget(input)
  const { totalLevels, effectiveLevels } = calculateEffectiveEnemyLevels(enemies)
  const budgetRatio = budget.totalBudget > 0 ? effectiveLevels / budget.totalBudget : 0

  return {
    totalEnemyLevels: totalLevels,
    budget,
    budgetRatio,
    difficulty: assessDifficulty(budgetRatio),
    hasTrainerEnemies: enemies.some(e => e.isTrainer),
    effectiveEnemyLevels: effectiveLevels
  }
}

/**
 * Calculate XP for a completed encounter.
 * PTU Core p.460: total enemy levels * significance / player count
 */
export function calculateEncounterXp(
  enemies: Array<{ level: number; isTrainer: boolean }>,
  significanceMultiplier: number,
  playerCount: number
): { totalXp: number; xpPerPlayer: number; baseXp: number } {
  const { effectiveLevels } = calculateEffectiveEnemyLevels(enemies)
  const baseXp = effectiveLevels
  const totalXp = Math.floor(baseXp * significanceMultiplier)
  const xpPerPlayer = Math.floor(totalXp / Math.max(1, playerCount))
  return { totalXp, xpPerPlayer, baseXp }
}
```

### Composable: `app/composables/useEncounterBudget.ts`

Reactive wrapper around the pure utility for use in Vue components.

```typescript
export function useEncounterBudget() {
  const encounterStore = useEncounterStore()

  /**
   * Compute budget analysis for the current encounter.
   * Requires knowing the average Pokemon level of the player party.
   * Returns null if no encounter is loaded.
   */
  const analyzeCurrent = (averagePokemonLevel: number): BudgetAnalysis | null => {
    const encounter = encounterStore.encounter
    if (!encounter) return null

    const players = encounter.combatants.filter(c => c.side === 'players')
    const enemies = encounter.combatants
      .filter(c => c.side === 'enemies')
      .map(c => ({
        level: c.entity.level,
        isTrainer: c.entityType === 'human'
      }))

    return analyzeEncounterBudget(
      { averagePokemonLevel, playerCount: players.length },
      enemies
    )
  }

  return { analyzeCurrent, calculateEncounterBudget, analyzeEncounterBudget, calculateEncounterXp }
}
```

### UI: Budget Display in GenerateEncounterModal

Add an optional "Party Info" section to `GenerateEncounterModal.vue` that accepts player party context and displays budget guidance. This section appears when the GM provides party information (average Pokemon level + player count).

**Changes to `GenerateEncounterModal.vue`:**

1. Add optional props for party context:
```typescript
defineProps<{
  table: EncounterTable
  hasActiveEncounter?: boolean
  addError?: string | null
  addingToEncounter?: boolean
  scenes?: Array<{ id: string; name: string }>
  // New: optional party context for budget calculation
  partyContext?: {
    averagePokemonLevel: number
    playerCount: number
  }
}>()
```

2. Add a collapsible "Budget Guide" section between the table info and generation options:
```html
<div v-if="partyContext" class="budget-guide">
  <h4>
    <PhScales :size="16" />
    Level Budget
  </h4>
  <div class="budget-summary">
    <div class="budget-stat">
      <span class="budget-stat__label">Budget</span>
      <span class="budget-stat__value">{{ budget.totalBudget }} levels</span>
    </div>
    <div class="budget-stat">
      <span class="budget-stat__label">Formula</span>
      <span class="budget-stat__value">
        Lv.{{ partyContext.averagePokemonLevel }} x 2 x {{ partyContext.playerCount }} players
      </span>
    </div>
  </div>
  <!-- After generation, show how the generated Pokemon compare to budget -->
  <div v-if="generatedPokemon.length > 0" class="budget-analysis">
    <BudgetIndicator :analysis="budgetAnalysis" />
  </div>
</div>
```

3. After Pokemon are generated, compute and display a `BudgetAnalysis` comparing the generated enemy levels against the party budget. Use the `BudgetIndicator` component (see below).

### UI: `app/components/encounter/BudgetIndicator.vue`

A reusable visual indicator showing budget usage. Displays:
- A horizontal bar showing enemy levels vs budget (like a progress bar)
- Color-coded difficulty label: trivial (gray), easy (green), balanced (blue), hard (orange), deadly (red)
- Numeric ratio (e.g., "120 / 120 levels (100%)")

```html
<template>
  <div class="budget-indicator" :class="`budget-indicator--${analysis.difficulty}`">
    <div class="budget-bar">
      <div
        class="budget-bar__fill"
        :style="{ width: `${Math.min(barPercent, 100)}%` }"
      />
      <div
        v-if="barPercent > 100"
        class="budget-bar__overflow"
        :style="{ width: `${Math.min(barPercent - 100, 100)}%` }"
      />
    </div>
    <div class="budget-details">
      <span class="budget-levels">
        {{ analysis.effectiveEnemyLevels }} / {{ analysis.budget.totalBudget }} levels
        <span v-if="analysis.hasTrainerEnemies" class="trainer-note">(trainers count x2)</span>
      </span>
      <span class="budget-difficulty">{{ difficultyLabel }}</span>
    </div>
  </div>
</template>
```

Props: `{ analysis: BudgetAnalysis }`

### Where Party Context Comes From

The `GenerateEncounterModal` can receive `partyContext` from two sources:

1. **Scene context**: When opened from a scene page (`/gm/scenes/[id]`), the scene already has characters attached. The parent page can compute the average Pokemon level from the scene's characters' Pokemon.

2. **Manual input**: When opened from the encounter tables list page (no scene context), the modal shows two small inputs (average Pokemon level, player count) that the GM can fill in. These fields are optional — the budget section simply hides when no context is provided.

**No DB changes needed for P0.** The budget calculation is purely informational — it reads existing data and displays guidance. The GM is not forced to follow the budget.

---


## B. Budget Display in StartEncounterModal (P0)

### Changes to `StartEncounterModal.vue`

When creating an encounter from a scene, the modal already knows `pokemonCount` and `characterCount`. Extend it to also show a budget summary if character data is available.

**New props:**
```typescript
defineProps<{
  sceneName: string
  pokemonCount: number
  characterCount: number
  // New: budget context computed from scene data
  budgetInfo?: {
    totalBudget: number
    totalEnemyLevels: number
    effectiveEnemyLevels: number
    difficulty: BudgetAnalysis['difficulty']
  }
}>()
```

**UI addition** — a budget summary row in the entity-counts section:
```html
<div v-if="budgetInfo" class="budget-summary-row">
  <PhScales :size="18" />
  <span>
    Budget: {{ budgetInfo.effectiveEnemyLevels }} / {{ budgetInfo.totalBudget }} levels
    <span :class="`difficulty--${budgetInfo.difficulty}`">({{ budgetInfo.difficulty }})</span>
  </span>
</div>
```

**Parent page computes budgetInfo** from scene characters' average Pokemon level and scene Pokemon levels. This is a computed property on `pages/gm/scenes/[id].vue` that calls `analyzeEncounterBudget()`.

---

