# P0: Stat Point Allocation with Base Relations Validation

**Priority:** P0 (must ship)
**Scope:** Base Relations validation utility, stat point extraction, allocation endpoint, allocation UI component
**Matrix Rules:** R027
**Depends on:** decree-035 (nature-adjusted base stats for ordering)

## Overview

P0 delivers the core stat allocation workflow: the GM can allocate stat points earned from leveling up, with real-time Base Relations validation preventing invalid distributions. The system extracts the Pokemon's current allocation from existing DB fields (no schema migration needed), validates proposed changes against nature-adjusted base stat ordering, and persists the allocation.

## 1. Base Relations Validation Utility

### 1.1 New File: `app/utils/baseRelations.ts`

Shared between level-up allocation and evolution stat redistribution. Pure functions, no DB access.

```typescript
/**
 * PTU Base Relations Rule (Core p.198)
 *
 * Stats must maintain the same relative ordering as nature-adjusted base stats.
 * Equal base stats form a "tier" and may end up in any order relative to each other.
 *
 * Decree-035: ordering uses nature-adjusted base stats, not raw species base stats.
 */

import type { Stats } from '~/types/character'

const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
type StatKey = typeof STAT_KEYS[number]

export interface BaseRelationsTier {
  /** Stats in this tier (equal nature-adjusted base values) */
  stats: StatKey[]
  /** The nature-adjusted base value for this tier */
  baseValue: number
}

export interface BaseRelationsValidation {
  /** Whether the allocation is valid */
  valid: boolean
  /** Violation messages if invalid */
  violations: string[]
  /** Stat ordering tiers (highest to lowest) */
  tiers: BaseRelationsTier[]
}

/**
 * Build the stat ordering tiers from nature-adjusted base stats.
 * Groups stats with equal base values into tiers, sorted highest to lowest.
 */
export function buildStatTiers(
  natureAdjustedBase: Stats
): BaseRelationsTier[] {
  // Build entries and sort by base value descending
  const entries = STAT_KEYS.map(key => ({
    key,
    value: natureAdjustedBase[key]
  }))
  entries.sort((a, b) => b.value - a.value)

  // Group into tiers
  const tiers: BaseRelationsTier[] = []
  let currentTier: BaseRelationsTier | null = null

  for (const entry of entries) {
    if (!currentTier || currentTier.baseValue !== entry.value) {
      currentTier = { stats: [entry.key], baseValue: entry.value }
      tiers.push(currentTier)
    } else {
      currentTier.stats.push(entry.key)
    }
  }

  return tiers
}

/**
 * Validate that a stat point allocation preserves Base Relations ordering.
 *
 * Rule: if natureAdjustedBase[A] > natureAdjustedBase[B], then
 *   (natureAdjustedBase[A] + statPoints[A]) >= (natureAdjustedBase[B] + statPoints[B])
 *
 * Equal base stats may have any relative allocation.
 *
 * @param natureAdjustedBase - Base stats after nature modifiers (decree-035)
 * @param statPoints - Number of stat points allocated to each stat
 * @returns Validation result with any violations
 */
export function validateBaseRelations(
  natureAdjustedBase: Stats,
  statPoints: Stats
): BaseRelationsValidation {
  const tiers = buildStatTiers(natureAdjustedBase)
  const violations: string[] = []

  // Check every pair of stats from different tiers
  for (let i = 0; i < STAT_KEYS.length; i++) {
    for (let j = 0; j < STAT_KEYS.length; j++) {
      if (i === j) continue
      const a = STAT_KEYS[i]
      const b = STAT_KEYS[j]

      // If base[a] > base[b], then final[a] must >= final[b]
      if (natureAdjustedBase[a] > natureAdjustedBase[b]) {
        const finalA = natureAdjustedBase[a] + statPoints[a]
        const finalB = natureAdjustedBase[b] + statPoints[b]
        if (finalA < finalB) {
          violations.push(
            `${formatStatName(a)} (base ${natureAdjustedBase[a]}, final ${finalA}) ` +
            `must be >= ${formatStatName(b)} (base ${natureAdjustedBase[b]}, final ${finalB})`
          )
        }
      }
    }
  }

  // Deduplicate violations (A<B and B>A produce the same violation)
  const uniqueViolations = [...new Set(violations)]

  return {
    valid: uniqueViolations.length === 0,
    violations: uniqueViolations,
    tiers
  }
}

/**
 * Determine which stats can legally receive the next stat point
 * without violating Base Relations.
 *
 * For each stat S, check: if we add +1 to S, is the resulting
 * allocation still valid? Return true for each stat that passes.
 */
export function getValidAllocationTargets(
  natureAdjustedBase: Stats,
  currentStatPoints: Stats
): Record<StatKey, boolean> {
  const result: Record<string, boolean> = {}

  for (const key of STAT_KEYS) {
    const testPoints = { ...currentStatPoints, [key]: currentStatPoints[key] + 1 }
    const validation = validateBaseRelations(natureAdjustedBase, testPoints)
    result[key] = validation.valid
  }

  return result as Record<StatKey, boolean>
}

/**
 * Extract stat point allocation from a Pokemon's current DB state.
 *
 * Nature-adjusted base stats are stored in base<Stat> fields.
 * Calculated stats are stored in current<Stat> fields.
 * Stat points = calculated - nature-adjusted base.
 *
 * HP is special: maxHp = level + (hpStat * 3) + 10
 *   So: hpStat = (maxHp - level - 10) / 3
 *   And: hpStatPoints = hpStat - baseHp
 */
export function extractStatPoints(pokemon: {
  level: number
  maxHp: number
  baseStats: Stats
  currentStats: Stats
}): {
  statPoints: Stats
  totalAllocated: number
  expectedTotal: number
  isConsistent: boolean
} {
  // HP extraction from maxHp formula
  const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  const hpPoints = hpStat - pokemon.baseStats.hp

  const statPoints: Stats = {
    hp: Math.max(0, hpPoints),
    attack: Math.max(0, pokemon.currentStats.attack - pokemon.baseStats.attack),
    defense: Math.max(0, pokemon.currentStats.defense - pokemon.baseStats.defense),
    specialAttack: Math.max(0, pokemon.currentStats.specialAttack - pokemon.baseStats.specialAttack),
    specialDefense: Math.max(0, pokemon.currentStats.specialDefense - pokemon.baseStats.specialDefense),
    speed: Math.max(0, pokemon.currentStats.speed - pokemon.baseStats.speed)
  }

  const totalAllocated = Object.values(statPoints).reduce((sum, v) => sum + v, 0)
  const expectedTotal = pokemon.level + 10

  return {
    statPoints,
    totalAllocated,
    expectedTotal,
    isConsistent: totalAllocated === expectedTotal
  }
}

/** Format stat key for display */
function formatStatName(key: string): string {
  const names: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    specialAttack: 'Sp.Atk',
    specialDefense: 'Sp.Def',
    speed: 'Speed'
  }
  return names[key] || key
}

export { STAT_KEYS, type StatKey, formatStatName }
```

## 2. Server Endpoint: Allocate Stats

### 2.1 `POST /api/pokemon/:id/allocate-stats`

New endpoint at `app/server/api/pokemon/[id]/allocate-stats.post.ts`.

Validates and applies stat point allocation. Supports allocating points to a single stat (incremental mode, typical for level-up) or setting the full allocation (batch mode, for the UI to send all changes at once).

```typescript
/**
 * POST /api/pokemon/:id/allocate-stats
 *
 * Allocate stat points to a Pokemon, enforcing Base Relations Rule.
 *
 * Body (incremental mode):
 *   { stat: 'attack', points: 1 }
 *
 * Body (batch mode):
 *   { statPoints: { hp: 5, attack: 8, defense: 4, ... } }
 *
 * Both modes validate Base Relations before applying.
 *
 * Returns: updated Pokemon + validation result
 */

// Input validation
const body = await readBody(event)
const pokemon = await prisma.pokemon.findUnique({ where: { id } })

// Extract current allocation
const currentAllocation = extractStatPoints(pokemon)

// Apply the proposed change
let proposedStatPoints: Stats
if (body.stat && body.points) {
  // Incremental mode: add N points to one stat
  proposedStatPoints = { ...currentAllocation.statPoints }
  proposedStatPoints[body.stat] += body.points
} else if (body.statPoints) {
  // Batch mode: full allocation
  proposedStatPoints = body.statPoints
}

// Validate total doesn't exceed budget
const proposedTotal = Object.values(proposedStatPoints).reduce((s, v) => s + v, 0)
const budget = pokemon.level + 10
if (proposedTotal > budget) {
  throw createError({ statusCode: 400, message: `Stat points (${proposedTotal}) exceed budget (${budget})` })
}

// Validate Base Relations
const natureAdjustedBase = {
  hp: pokemon.baseHp, attack: pokemon.baseAttack,
  defense: pokemon.baseDefense, specialAttack: pokemon.baseSpAtk,
  specialDefense: pokemon.baseSpDef, speed: pokemon.baseSpeed
}
const validation = validateBaseRelations(natureAdjustedBase, proposedStatPoints)

if (!validation.valid && !body.skipBaseRelations) {
  throw createError({
    statusCode: 400,
    message: `Base Relations violated: ${validation.violations.join('; ')}`
  })
}

// Calculate new stats
const newCalculated = {
  attack: natureAdjustedBase.attack + proposedStatPoints.attack,
  defense: natureAdjustedBase.defense + proposedStatPoints.defense,
  specialAttack: natureAdjustedBase.specialAttack + proposedStatPoints.specialAttack,
  specialDefense: natureAdjustedBase.specialDefense + proposedStatPoints.specialDefense,
  speed: natureAdjustedBase.speed + proposedStatPoints.speed
}

const newHpStat = natureAdjustedBase.hp + proposedStatPoints.hp
const newMaxHp = pokemon.level + (newHpStat * 3) + 10

// Preserve HP ratio
const wasAtFullHp = pokemon.currentHp >= pokemon.maxHp
const newCurrentHp = wasAtFullHp ? newMaxHp : Math.min(pokemon.currentHp, newMaxHp)

// Write to DB
await prisma.pokemon.update({
  where: { id },
  data: {
    currentAttack: newCalculated.attack,
    currentDefense: newCalculated.defense,
    currentSpAtk: newCalculated.specialAttack,
    currentSpDef: newCalculated.specialDefense,
    currentSpeed: newCalculated.speed,
    maxHp: newMaxHp,
    currentHp: newCurrentHp
  }
})
```

### 2.2 Validation Rules

1. **Stat key must be valid:** one of `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`
2. **Points must be positive integer** (in incremental mode)
3. **Total must not exceed budget** (level + 10)
4. **All individual stat point values must be >= 0** (no negative allocation)
5. **Base Relations must be satisfied** (unless `skipBaseRelations: true` for Features that break it)
6. **Pokemon must exist** (404 if not found)

### 2.3 HP Handling

When HP stat points are allocated:
- New `maxHp` = Level + (newHpStat * 3) + 10
- If the Pokemon was at full HP, `currentHp` follows `maxHp` upward
- If the Pokemon was damaged, `currentHp` stays the same (unless it would exceed new `maxHp`)

This matches the pattern in `add-experience.post.ts`.

## 3. Composable: `useLevelUpAllocation()`

### 3.1 New File: `app/composables/useLevelUpAllocation.ts`

Client-side state management for the level-up allocation workflow.

```typescript
/**
 * Composable for managing Pokemon level-up stat allocation.
 *
 * Provides reactive state for:
 * - Current stat point allocation (extracted from Pokemon data)
 * - Unallocated points remaining
 * - Which stats are valid targets for the next point
 * - Base Relations validation result
 * - Allocation submission
 */
export function useLevelUpAllocation(pokemonRef: Ref<Pokemon | null>) {
  // --- State ---
  const pendingAllocation = ref<Stats>({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 })
  const isAllocating = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // --- Computed ---

  /** Nature-adjusted base stats (from the Pokemon record) */
  const natureAdjustedBase = computed((): Stats | null => {
    if (!pokemonRef.value) return null
    return pokemonRef.value.baseStats
  })

  /** Current stat points already allocated */
  const currentExtraction = computed(() => {
    if (!pokemonRef.value) return null
    return extractStatPoints(pokemonRef.value)
  })

  /** Total points that should be allocated at current level */
  const statBudget = computed(() => {
    if (!pokemonRef.value) return 0
    return pokemonRef.value.level + 10
  })

  /** Points allocated so far (existing + pending) */
  const totalAllocated = computed(() => {
    if (!currentExtraction.value) return 0
    const existing = currentExtraction.value.totalAllocated
    const pending = Object.values(pendingAllocation.value).reduce((s, v) => s + v, 0)
    return existing + pending
  })

  /** Unallocated points remaining */
  const unallocatedPoints = computed(() => {
    return statBudget.value - totalAllocated.value
  })

  /** Combined allocation (existing + pending) for validation */
  const combinedAllocation = computed((): Stats => {
    if (!currentExtraction.value) return { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
    const existing = currentExtraction.value.statPoints
    return {
      hp: existing.hp + pendingAllocation.value.hp,
      attack: existing.attack + pendingAllocation.value.attack,
      defense: existing.defense + pendingAllocation.value.defense,
      specialAttack: existing.specialAttack + pendingAllocation.value.specialAttack,
      specialDefense: existing.specialDefense + pendingAllocation.value.specialDefense,
      speed: existing.speed + pendingAllocation.value.speed
    }
  })

  /** Base Relations validation of the combined allocation */
  const validation = computed((): BaseRelationsValidation | null => {
    if (!natureAdjustedBase.value) return null
    return validateBaseRelations(natureAdjustedBase.value, combinedAllocation.value)
  })

  /** Which stats can receive the next point */
  const validTargets = computed((): Record<keyof Stats, boolean> => {
    if (!natureAdjustedBase.value || unallocatedPoints.value <= 0) {
      return { hp: false, attack: false, defense: false, specialAttack: false, specialDefense: false, speed: false }
    }
    return getValidAllocationTargets(natureAdjustedBase.value, combinedAllocation.value)
  })

  // --- Actions ---

  /** Start the allocation workflow */
  function startAllocation() {
    pendingAllocation.value = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
    isAllocating.value = true
    error.value = null
  }

  /** Add one stat point to a stat */
  function allocatePoint(stat: keyof Stats) {
    if (!validTargets.value[stat] || unallocatedPoints.value <= 0) return
    pendingAllocation.value = {
      ...pendingAllocation.value,
      [stat]: pendingAllocation.value[stat] + 1
    }
  }

  /** Remove one pending stat point from a stat */
  function deallocatePoint(stat: keyof Stats) {
    if (pendingAllocation.value[stat] <= 0) return
    pendingAllocation.value = {
      ...pendingAllocation.value,
      [stat]: pendingAllocation.value[stat] - 1
    }
  }

  /** Reset pending allocation */
  function resetAllocation() {
    pendingAllocation.value = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
  }

  /** Submit the allocation to the server */
  async function submitAllocation(): Promise<boolean> {
    if (!pokemonRef.value) return false
    isSaving.value = true
    error.value = null

    try {
      await $fetch(`/api/pokemon/${pokemonRef.value.id}/allocate-stats`, {
        method: 'POST',
        body: { statPoints: combinedAllocation.value }
      })
      isAllocating.value = false
      pendingAllocation.value = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
      return true
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to allocate stat points'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Cancel allocation */
  function cancelAllocation() {
    isAllocating.value = false
    resetAllocation()
    error.value = null
  }

  return {
    // State
    pendingAllocation: readonly(pendingAllocation),
    isAllocating: readonly(isAllocating),
    isSaving: readonly(isSaving),
    error: readonly(error),

    // Computed
    natureAdjustedBase,
    currentExtraction,
    statBudget,
    totalAllocated,
    unallocatedPoints,
    combinedAllocation,
    validation,
    validTargets,

    // Actions
    startAllocation,
    allocatePoint,
    deallocatePoint,
    resetAllocation,
    submitAllocation,
    cancelAllocation
  }
}
```

## 4. Component: `StatAllocationPanel.vue`

### 4.1 New File: `app/components/pokemon/StatAllocationPanel.vue`

Interactive stat point allocator with real-time Base Relations feedback.

### 4.2 UI Layout

```
+----------------------------------------------------------+
| Stat Point Allocation                    [X unallocated]  |
+----------------------------------------------------------+
| Base Relations Tiers:                                     |
| Tier 1: Speed (7), Sp.Atk (6)                           |
| Tier 2: Attack (5), Sp.Def (5)                          |
| Tier 3: HP (4), Defense (4)                              |
+----------------------------------------------------------+
|                                                           |
| HP         Base: 4   Points: [3] [-][+]   Final: 7      |
| Attack     Base: 5   Points: [4] [-][+]   Final: 9      |
| Defense    Base: 4   Points: [2] [-][+]   Final: 6      |
| Sp.Atk     Base: 6   Points: [3] [-][+]   Final: 9      |
| Sp.Def     Base: 5   Points: [2] [-][+]   Final: 7      |
| Speed      Base: 7   Points: [4] [-][+]   Final: 11     |
|                                                           |
| [Validation OK / Violation: ...]                          |
| [Reset] [Apply Allocation]                                |
+----------------------------------------------------------+
```

### 4.3 Props and Events

```typescript
defineProps<{
  pokemon: Pokemon
  /** Number of new stat points to allocate (e.g., levelsGained) */
  pointsToAllocate: number
}>()

defineEmits<{
  (e: 'allocated', result: { pokemon: Pokemon }): void
  (e: 'cancelled'): void
}>()
```

### 4.4 Visual Feedback

- **Valid target stats:** [+] button is enabled (normal color)
- **Invalid target stats:** [+] button is disabled with tooltip explaining why (e.g., "Would violate Base Relations: HP must stay below Attack")
- **Pending points:** shown in accent color, distinguished from existing allocation
- **Violations:** shown as red warning text below the stat grid
- **Unallocated counter:** prominent counter showing how many points remain
- **Stat bar visualization:** optional horizontal bars showing proportional stat values

### 4.5 Stat Tier Display

At the top of the panel, display the Base Relations tiers derived from nature-adjusted base stats. This helps the GM understand the ordering constraints:

```
Base Relations (Adamant nature):
  Speed (7) > Sp.Atk (4), Attack (7) > Sp.Def (5) > HP (4), Defense (4)
```

Stats in the same tier (equal base value) are grouped with commas. Tiers are separated by `>`.

### 4.6 Component Structure

```vue
<template>
  <div class="stat-allocation-panel">
    <!-- Header with unallocated count -->
    <div class="stat-allocation-panel__header">
      <h4>Stat Point Allocation</h4>
      <span class="unallocated-badge">{{ unallocatedPoints }} unallocated</span>
    </div>

    <!-- Base Relations tier display -->
    <div class="stat-allocation-panel__tiers">
      <span class="tier-label">Base Relations:</span>
      <span v-for="(tier, idx) in validation?.tiers" :key="idx">
        <span v-if="idx > 0" class="tier-separator"> &gt; </span>
        <span v-for="(stat, sidx) in tier.stats" :key="stat">
          <span v-if="sidx > 0">, </span>
          {{ formatStatName(stat) }} ({{ tier.baseValue }})
        </span>
      </span>
    </div>

    <!-- Stat rows -->
    <div class="stat-allocation-panel__stats">
      <div v-for="stat in STAT_KEYS" :key="stat" class="stat-row">
        <span class="stat-row__label">{{ formatStatName(stat) }}</span>
        <span class="stat-row__base">Base: {{ natureAdjustedBase?.[stat] || 0 }}</span>
        <span class="stat-row__points">
          {{ currentExtraction?.statPoints[stat] || 0 }}
          <span v-if="pendingAllocation[stat] > 0" class="stat-row__pending">
            +{{ pendingAllocation[stat] }}
          </span>
        </span>
        <div class="stat-row__controls">
          <button
            class="btn btn--icon"
            :disabled="pendingAllocation[stat] <= 0"
            @click="deallocatePoint(stat)"
          >
            <PhMinus :size="16" />
          </button>
          <button
            class="btn btn--icon"
            :disabled="!validTargets[stat] || unallocatedPoints <= 0"
            @click="allocatePoint(stat)"
          >
            <PhPlus :size="16" />
          </button>
        </div>
        <span class="stat-row__final">
          {{ (natureAdjustedBase?.[stat] || 0) + (combinedAllocation?.[stat] || 0) }}
        </span>
      </div>
    </div>

    <!-- Validation feedback -->
    <div v-if="validation && !validation.valid" class="stat-allocation-panel__violations">
      <PhWarning :size="16" />
      <ul>
        <li v-for="(v, idx) in validation.violations" :key="idx">{{ v }}</li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="stat-allocation-panel__actions">
      <button class="btn btn--secondary" @click="$emit('cancelled')">Cancel</button>
      <button class="btn btn--ghost" @click="resetAllocation">Reset</button>
      <button
        class="btn btn--primary"
        :disabled="unallocatedPoints > 0 || !validation?.valid || isSaving"
        @click="handleSubmit"
      >
        {{ isSaving ? 'Saving...' : 'Apply Allocation' }}
      </button>
    </div>
  </div>
</template>
```

## 5. Integration: PokemonLevelUpPanel Enhancement

### 5.1 Current Behavior

`PokemonLevelUpPanel.vue` shows read-only level-up info when editing a Pokemon's level. It fetches data from `POST /api/pokemon/:id/level-up-check`.

### 5.2 Enhancement

Add an "Allocate Stats" button below the stat points info. When clicked:
1. The `StatAllocationPanel` appears inline below the level-up info
2. The panel is pre-configured with the number of points to allocate (levels gained)
3. After allocation, the panel emits `allocated` and the Pokemon data is refreshed

### 5.3 Integration with XP Distribution

In the encounter context (`LevelUpNotification.vue`), add an action link per leveled-up Pokemon:
- "Allocate Stats" link navigates to `/gm/pokemon/:id?edit=true`
- Or opens a modal containing `StatAllocationPanel`

The P0 approach is the navigation link (simpler). A modal can be added as polish in P1 or P2.

## 6. Implementation Order

1. **Base Relations utility** -- `app/utils/baseRelations.ts` (pure functions, testable)
2. **Allocation endpoint** -- `app/server/api/pokemon/[id]/allocate-stats.post.ts`
3. **Composable** -- `app/composables/useLevelUpAllocation.ts`
4. **Stat allocation component** -- `app/components/pokemon/StatAllocationPanel.vue`
5. **PokemonLevelUpPanel enhancement** -- Add "Allocate Stats" button + StatAllocationPanel
6. **LevelUpNotification enhancement** -- Add "Allocate Stats" navigation link

## 7. Files Created/Modified

### New Files
- `app/utils/baseRelations.ts` -- Base Relations validation, stat extraction, valid targets
- `app/server/api/pokemon/[id]/allocate-stats.post.ts` -- Stat allocation endpoint
- `app/composables/useLevelUpAllocation.ts` -- Client-side allocation state
- `app/components/pokemon/StatAllocationPanel.vue` -- Interactive stat allocator UI

### Modified Files
- `app/components/pokemon/PokemonLevelUpPanel.vue` -- Add allocation controls
- `app/components/encounter/LevelUpNotification.vue` -- Add "Allocate" link

## 8. Acceptance Criteria

- [ ] `validateBaseRelations()` correctly enforces stat ordering from nature-adjusted base stats
- [ ] `validateBaseRelations()` treats equal base stats as same tier (no ordering required between them)
- [ ] `extractStatPoints()` correctly reverse-engineers allocation from DB fields
- [ ] `extractStatPoints()` handles HP extraction using PTU formula
- [ ] `getValidAllocationTargets()` returns correct valid/invalid flags for each stat
- [ ] `POST /api/pokemon/:id/allocate-stats` validates and applies stat changes
- [ ] `POST /api/pokemon/:id/allocate-stats` rejects allocations exceeding stat budget
- [ ] `POST /api/pokemon/:id/allocate-stats` rejects Base Relations violations (without skip flag)
- [ ] `POST /api/pokemon/:id/allocate-stats` allows violations with `skipBaseRelations: true`
- [ ] HP updates correctly with PTU formula when HP stat points are allocated
- [ ] Full HP Pokemon stays at full HP after allocation
- [ ] `StatAllocationPanel` shows all 6 stats with +/- controls
- [ ] Invalid stat targets are disabled with visual indication
- [ ] Unallocated points counter is accurate
- [ ] "Apply Allocation" is disabled when points remain unallocated or validation fails
- [ ] PokemonLevelUpPanel shows "Allocate Stats" when stat points are pending
- [ ] LevelUpNotification includes navigation link for stat allocation
