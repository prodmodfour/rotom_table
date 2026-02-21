---
design_id: design-level-budget-001
ticket_id: ptu-rule-060
category: FEATURE_GAP
scope: NEW_FEATURE
domain: scenes
status: open
dependencies:
  - ptu-rule-055  # Post-combat XP calculation (significance multiplier consumed here)
  - ptu-rule-058  # Density/significance conceptual mismatch (density reinterpretation)
affected_files:
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/scene/StartEncounterModal.vue
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/stores/encounter.ts
  - app/stores/encounterTables.ts
  - app/types/encounter.ts
  - app/types/habitat.ts
  - app/prisma/schema.prisma
new_files:
  - app/utils/encounterBudget.ts
  - app/composables/useEncounterBudget.ts
  - app/components/encounter/BudgetIndicator.vue
---

# Design: PTU Level-Budget Encounter Creation & Significance Multiplier

## Summary

Implement the PTU encounter creation budget system: a level-budget formula (average Pokemon level * 2 * number of players) that guides the GM in building appropriately difficult encounters, paired with a significance multiplier (x1-x5) that scales XP rewards. The current density-based spawn system controls spawn count but has no connection to PTU's level-budget difficulty scaling or significance-based XP.

### PTU Rules Reference

**Basic Encounter Creation Guidelines** (core/11-running-the-game.md, page 473):
> "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."

**Significance Multiplier** (core/11-running-the-game.md, page 460):
> "The Significance Multiplier should range from x1 to about x5"
> - x1 to x1.5: Insignificant encounters (wild Pidgeys)
> - x2 to x3: Average everyday encounters
> - x4 to x5: Significant encounters (gym leaders, rivals, tournament finals)

**XP Calculation** (core/11-running-the-game.md, page 460):
> 1. Total the Level of enemy combatants defeated (Trainer levels count as double)
> 2. Multiply by Significance Multiplier
> 3. Divide by number of players gaining XP

**Example from rulebook** (page 473):
Three Level 10 Trainers, Pokemon around Level 20. Budget = 20 * 2 * 3 = 120 levels. GM creates six Level 20 Pokemon. With significance x2, each player gets 80 XP (enough to level a Pokemon once).

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Level budget calculation formula | NOT_IMPLEMENTED | No budget computation anywhere | **P0** |
| B | Budget display in encounter creation UI | NOT_IMPLEMENTED | GM has no budget guidance | **P0** |
| C | Significance multiplier on encounters | NOT_IMPLEMENTED | No significance field on Encounter model | **P1** |
| D | Significance-aware XP calculation | NOT_IMPLEMENTED | Depends on ptu-rule-055 (XP system) | **P1** |
| E | Budget validation warnings | NOT_IMPLEMENTED | No over/under-budget feedback | **P2** |
| F | Difficulty presets | NOT_IMPLEMENTED | No quick-select difficulty levels | **P2** |

---

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
 * PTU Core p.473: average Pokemon level * 2 * player count
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

## C. Significance Multiplier on Encounters (P1)

### Data Model Changes

**Prisma schema** — add significance field to Encounter:
```prisma
model Encounter {
  // ... existing fields ...
  significance     Float   @default(1.0) // Significance multiplier (x1-x5)
  significanceTier String  @default("insignificant") // Preset tier label
}
```

**TypeScript type** — extend `Encounter` interface:
```typescript
export interface Encounter {
  // ... existing fields ...
  significance: number        // 1.0 to 5.0
  significanceTier: SignificanceTier
}
```

### UI: Significance Selection in StartEncounterModal

Add a significance tier selector to `StartEncounterModal.vue` below the battle type selection:

```html
<div class="form-group">
  <label class="form-label">Encounter Significance</label>
  <div class="significance-options">
    <label
      v-for="preset in SIGNIFICANCE_PRESETS"
      :key="preset.tier"
      class="radio-option"
      :class="{ 'radio-option--selected': selectedTier === preset.tier }"
    >
      <input type="radio" v-model="selectedTier" :value="preset.tier" />
      <div class="radio-option__content">
        <strong>{{ preset.label }} (x{{ preset.defaultMultiplier }})</strong>
        <span>{{ preset.description }}</span>
      </div>
    </label>
  </div>
  <div v-if="showCustomMultiplier" class="custom-multiplier">
    <label>Custom Multiplier</label>
    <input
      type="number"
      v-model.number="customMultiplier"
      min="0.5"
      max="10"
      step="0.5"
      class="form-input"
    />
  </div>
</div>
```

The selected significance is emitted with the confirm event and stored on the Encounter record when created.

### UI: Significance in GenerateEncounterModal

When creating encounters from tables (wild encounters), the significance defaults to `insignificant` (x1). The GM can override it in the modal.

### API Changes

**`POST /api/encounters`** — accept optional `significance` and `significanceTier` in request body. Default to `1.0` and `'insignificant'`.

**`POST /api/encounters/from-scene`** — accept optional `significance` and `significanceTier` in request body.

**`PUT /api/encounters/:id`** — allow updating significance mid-encounter (the GM might reassess significance after the encounter plays out).

### Significance-Aware XP Calculation (P1 — depends on ptu-rule-055)

Once ptu-rule-055 (XP system) is implemented, the significance multiplier is consumed by the XP calculation:

```
XP per player = floor(effectiveEnemyLevels * significance / playerCount)
```

The `calculateEncounterXp()` function in `encounterBudget.ts` already implements this formula. The XP UI (from ptu-rule-055) will read `encounter.significance` to compute the final XP.

**Dependency note**: P1 significance storage is independent of ptu-rule-055. The significance field is stored on Encounter and can be set by the GM immediately. The XP calculation that consumes it is blocked on ptu-rule-055 delivering the XP distribution UI.

---

## D. Budget Validation Warnings (P2)

### Encounter Creation Warnings

When the GM generates or assembles an encounter and the budget ratio falls outside the "balanced" range, display contextual warnings:

- **Under-budget (<70%)**: "This encounter may be too easy for your party. Consider adding more enemies or increasing their levels."
- **Over-budget (>130%)**: "This encounter exceeds the recommended budget. Your players may struggle. Consider reducing enemy count or levels."
- **Deadly (>180%)**: "WARNING: This encounter is significantly over-budget and could be lethal. Ensure this is intentional."

These are informational warnings, not blocks. The GM can always proceed.

### Active Encounter Budget Display

Add a small budget indicator to the encounter header (visible during combat) that shows the current encounter's budget analysis. This helps the GM contextualize difficulty mid-combat. Displayed as a compact badge: "Budget: 120/120 (Balanced)".

### Budget Warning in Add Combatant Flow

When the GM adds a combatant mid-encounter, show how the addition affects the budget ratio. If the new combatant pushes the encounter from "balanced" to "hard" or "deadly", display a brief warning.

---

## E. Difficulty Presets (P2)

### Quick Encounter Generation by Difficulty

Add preset buttons to `GenerateEncounterModal.vue` that auto-configure spawn count based on the budget:

- **Trivial**: Generate enemies totaling ~40% of budget
- **Easy**: Generate enemies totaling ~70% of budget
- **Balanced**: Generate enemies totaling ~100% of budget
- **Hard**: Generate enemies totaling ~140% of budget

These presets calculate how many Pokemon at the table's level range would fill the target budget, then set the spawn count accordingly.

```typescript
/**
 * Calculate spawn count to hit a target budget percentage.
 * Uses the midpoint of the table's level range as the expected average level.
 */
export function suggestSpawnCount(
  targetBudgetRatio: number,
  budget: number,
  levelRange: { min: number; max: number }
): number {
  const averageLevel = Math.floor((levelRange.min + levelRange.max) / 2)
  if (averageLevel <= 0) return 1
  const targetLevels = Math.floor(budget * targetBudgetRatio)
  return Math.max(1, Math.round(targetLevels / averageLevel))
}
```

The preset buttons appear next to the "Override spawn count" checkbox and auto-enable the override with the calculated count.

---

## Relationship to ptu-rule-058 (Density/Significance)

ptu-rule-058 identifies that the app's density tier system controls spawn count, while PTU density should affect encounter significance and XP. This design does NOT change how density controls spawn count — that system works well for its purpose (determining how many Pokemon appear in a habitat).

Instead, this design adds the PTU budget system as a parallel, complementary layer:

- **Density** answers: "How many Pokemon live here?" (spawn count from habitat ecology)
- **Level Budget** answers: "Is this encounter appropriately difficult?" (difficulty from party context)
- **Significance** answers: "How much XP should this be worth?" (reward from narrative context)

The density-to-significance mapping from ptu-rule-058 can be addressed as a follow-up: a "suggested significance" that defaults based on density tier (sparse = x1, moderate = x1.5, dense = x2, abundant = x2.5). But this is a convenience suggestion, not a hard coupling.

---

## Existing Patterns to Follow

- **`app/utils/captureRate.ts`** — pure utility with typed I/O and breakdown, consumed by API endpoint. Same pattern for `encounterBudget.ts`.
- **`app/utils/damageCalculation.ts`** — same pure utility pattern, proven in design-testability-001.
- **`app/components/scene/StartEncounterModal.vue`** — existing modal to extend with significance and budget info.
- **`app/components/habitat/GenerateEncounterModal.vue`** — existing modal to extend with budget guidance.
- **`app/types/habitat.ts`** — existing encounter table types to reference (DensityTier, LevelRange).

---

## What NOT To Change

- **Density tier system** — spawn count logic in `generate.post.ts` is unchanged. Density remains a spawn count mechanism.
- **Encounter table structure** — no changes to EncounterTable, EncounterTableEntry, or TableModification models.
- **Existing encounter creation flow** — all current workflows continue to work. Budget is additive guidance, not a gate.
- **Template loading** — encounter templates do not need budget fields (budget is computed at load time from party context).
- **VTT grid** — no grid changes.

---

## Open Questions for Senior Reviewer

1. **Party context persistence**: Should the "average Pokemon level" and "player count" be stored as app settings (so the GM doesn't re-enter them each time), or computed dynamically from the player characters in the database? Dynamic is more accurate but requires players to be registered in the app. A settings-based approach is simpler and works even when players aren't fully set up in the system.

2. **Significance on completed encounters**: When an encounter ends, should the significance be locked (preventing post-hoc changes that would alter XP), or remain editable? PTU rules suggest the GM decides significance after the encounter based on how it played out. Recommendation: allow editing until XP is distributed, then lock.

3. **Budget source for wild encounters**: The table generation modal may not have party context (it's opened from the encounter tables page, not a scene). Should the budget section require manual input, or should the app maintain a "current party" concept that auto-populates? The manual input approach is simpler and avoids assumptions about which characters are "the party."

4. **Encounter budget as a stored field**: Should the budget be stored on the Encounter record (computed at creation, frozen), or always computed on-the-fly from current party data? Storing it preserves the GM's intent at creation time; computing it stays current. Recommendation: store it, since party levels change over the campaign.

---

## Implementation Notes

### Suggested Implementation Order

1. **P0: `app/utils/encounterBudget.ts`** — pure functions, unit-testable immediately
2. **P0: `app/composables/useEncounterBudget.ts`** — reactive wrapper
3. **P0: `app/components/encounter/BudgetIndicator.vue`** — reusable display component
4. **P0: Extend `GenerateEncounterModal.vue`** — add party context props and budget guide section
5. **P0: Extend `StartEncounterModal.vue`** — add budget summary row
6. **P1: Prisma migration** — add `significance` and `significanceTier` to Encounter model
7. **P1: Extend `StartEncounterModal.vue`** — add significance tier selector
8. **P1: Extend encounter APIs** — accept and store significance
9. **P1: Extend `GenerateEncounterModal.vue`** — add significance selector for wild encounters
10. **P2: Budget warnings** — add contextual warnings to encounter creation and mid-combat
11. **P2: Difficulty presets** — add quick-select buttons in GenerateEncounterModal

---

## Implementation Log

### P0 — Initial Implementation (2026-02-21)

Commits: `902b518`, `6a4f6a1`, `ca5243f`, `171f9f5`, `97bff99`

Steps 1-5 implemented. Budget utility, composable, BudgetIndicator, and modal extensions.

### P0 — Review Fixes (2026-02-21)

Addressed code-review-124 (CHANGES_REQUIRED) and rules-review-114 HIGH-1:

| Commit | Fix |
|--------|-----|
| `9f43e79` | M2: Renamed `baselineXpPerPlayer` to `levelBudgetPerPlayer` |
| `107cc67` | M1/HIGH-1: Fixed playerCount to count human trainers only |
| `1c4a6cc` | H2: Extracted difficulty colors to `_difficulty.scss` mixin |
| `6fcd1d7` | C1: Wired budgetInfo prop in `pages/gm/scenes/[id].vue` |
| `65e5b77` | C1: Added manual party input to GenerateEncounterModal |
| `05f5847` | H1: Updated `app-surface.md` with budget system files |

P0 status: **complete** (all review issues addressed).
