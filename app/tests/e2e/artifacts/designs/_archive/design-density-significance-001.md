---
design_id: design-density-significance-001
ticket_id: ptu-rule-058
category: PTU_INCORRECT
scope: FULL
domain: encounter-tables
status: p1-complete
dependencies:
  - ptu-rule-055 (XP calculation system)
  - ptu-rule-060 (level-budget encounter creation)
affected_files:
  - app/types/habitat.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
  - app/server/api/encounter-tables/[id]/generate.post.ts
  - app/server/api/encounters/[id]/significance.put.ts (new)
  - app/server/api/encounters/[id]/xp.get.ts (new)
  - app/utils/xpCalculation.ts (new)
  - app/stores/encounterTables.ts
  - app/stores/encounter.ts
  - app/components/habitat/GenerateEncounterModal.vue
  - app/components/encounter/SignificancePanel.vue (new)
  - app/components/habitat/EncounterTableCard.vue
  - app/components/habitat/EncounterTableModal.vue
  - app/stores/terrain.ts
---

# Design: Density/Significance Separation and Environmental Modifiers

## Summary

The current encounter table system conflates PTU "density" (a population flavor concept) with spawn count, and uses `densityMultiplier` on sub-habitat modifications as a spawn-count scaler. In PTU, encounter significance (x1 to x5+) is a post-combat XP multiplier determined by narrative importance and challenge level -- it does not control how many Pokemon spawn. Spawn count is determined by the GM's level budget and encounter design goals.

Additionally, the VTT terrain/fog systems are generic tactical tools (movement cost, visibility) that do not implement PTU-specific environmental modifier mechanics (darkness accuracy penalties, ice weight-class rules, hazard factory interactivity).

This design separates density from spawn count, introduces a significance multiplier for XP calculation, and plans environmental modifier integration for future PTU-specific terrain effects.

---

## Problem Analysis

### Problem 1: Density = Spawn Count (Incorrect)

**Current behavior:** `DensityTier` (`sparse | moderate | dense | abundant`) maps directly to `DENSITY_RANGES` spawn count ranges. The `densityMultiplier` on `TableModification` scales those ranges. The generate endpoint (`generate.post.ts:101-118`) computes `count` from density.

**PTU reality:** PTU does not define density tiers that map to spawn counts. Encounter size (number of enemies) is determined by the GM's **level budget** (R006: avg Pokemon level x 2 x number of trainers = total levels to distribute). The GM decides how to split that budget -- six L20 enemies vs two L40 + four L25 enemies. "Dense" and "sparse" are habitat flavor descriptors, not spawn formulas.

**Mapping:**
| Current Concept | PTU Concept | Correct Mapping |
|---|---|---|
| `DensityTier` | Habitat population flavor | Informational label on habitat, no mechanical effect |
| `DENSITY_RANGES` | No PTU equivalent | Replace with explicit spawn count input |
| `densityMultiplier` | No PTU equivalent (conflated with R009 difficulty modifier) | Remove; spawn count is an independent input |
| (missing) Significance Multiplier | R008: x1-x5+ XP multiplier | New field on Encounter |
| (missing) Difficulty Modifier | R009: +/- x0.5-x1.5 applied to significance | Folds into significance multiplier |

### Problem 2: No Significance Multiplier or XP System

**Current behavior:** The `Encounter` type has `defeatedEnemies: { species: string; level: number }[]` but no significance field and no XP calculation. The GM manually enters XP on each Pokemon.

**PTU formula (R005):**
1. Sum defeated enemy levels (trainers count as 2x their level)
2. Multiply by significance multiplier (x1 to x5+)
3. Divide by number of players
4. Result = XP per player (player distributes among their Pokemon)

### Problem 3: VTT Terrain is Generic, Not PTU-Specific

**Current behavior:** The terrain store defines 6 types (`normal`, `difficult`, `blocking`, `water`, `earth`, `rough`, `hazard`, `elevated`) with movement cost multipliers. These are generic tactical grid tools.

**PTU environmental modifiers (R025):** PTU describes specific mechanical effects tied to environments:
- Dark caves: -2 accuracy/perception per unilluminated meter
- Arctic: weight class 5+ breaks ice, slow terrain, acrobatics checks on injury
- Hazard factories: interactive machinery elements

The VTT terrain system is a valid foundation -- the problem is not that it exists, but that it lacks the connection to PTU-specific mechanical effects. This is a P2 enhancement, not a P0 bug.

---

## Priority Map

| # | Change | Current Status | Gap | Priority |
|---|--------|---------------|-----|----------|
| A | Separate density from spawn count | Density drives spawn count | Density should be informational; spawn count should be independent | **P0** |
| B | Explicit spawn count on generation | Derived from density | GM provides spawn count directly (or uses level-budget suggestion) | **P0** |
| C | Rename/repurpose densityMultiplier | Scales spawn count | Remove spawn-count scaling; field becomes composition modifier or is removed | **P0** |
| D | Add significance multiplier field to Encounter | Missing entirely | New field: x1.0 to x5.0+ (GM-set) | **P1** |
| E | XP calculation utility + endpoint | No XP calculation | Pure function + API (depends on ptu-rule-055) | **P1** |
| F | Significance panel in encounter UI | No UI for significance | Panel showing significance, base XP, final XP per player | **P1** |
| G | Environmental modifier framework | Generic terrain only | PTU-specific terrain effect rules (accuracy, weight-class, etc.) | **P2** |
| H | Level-budget encounter helper | No budget calculator | Suggest spawn count/levels from player party data (depends on ptu-rule-060) | **P2** |

---

## A. Separate Density from Spawn Count (P0)

### Conceptual Change

Density tier (`sparse | moderate | dense | abundant`) becomes a **descriptive label** on encounter tables -- it tells the GM how populated this habitat is. It no longer mechanically determines spawn count.

Spawn count becomes an explicit, independent parameter in the generation flow. The GM either specifies a count directly or gets a suggestion from the level-budget calculator (P2).

### Data Model Changes

#### `app/types/habitat.ts`

Remove `DENSITY_RANGES` and `MAX_SPAWN_COUNT`. Replace with a new constant for the spawn count cap (safety limit).

```typescript
// Population density tiers -- DESCRIPTIVE ONLY, no mechanical effect
export type DensityTier = 'sparse' | 'moderate' | 'dense' | 'abundant';

// Suggested spawn ranges per density tier (GM reference, not enforced)
// These are hints shown in the UI to help the GM pick a spawn count
export const DENSITY_SUGGESTIONS: Record<DensityTier, { suggested: number; description: string }> = {
  sparse: { suggested: 2, description: 'Few Pokemon -- isolated individuals or a mated pair' },
  moderate: { suggested: 4, description: 'Small group -- a pack or family unit' },
  dense: { suggested: 6, description: 'Large group -- multiple packs or a colony' },
  abundant: { suggested: 8, description: 'Swarm territory -- many overlapping groups' },
};

// Hard cap on spawn count for safety (prevents accidental massive generation)
export const MAX_SPAWN_COUNT = 20;
```

Remove the `densityMultiplier` field from `TableModification` interface -- it no longer has a mechanical purpose. The field already exists in Prisma and the DB; we will keep the column for backward compatibility but stop using it in generation logic.

```typescript
export interface TableModification {
  id: string;
  name: string;
  description?: string;
  parentTableId: string;
  levelRange?: LevelRange;
  // densityMultiplier removed from interface -- no longer used in generation
  entries: ModificationEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### `app/prisma/schema.prisma`

No schema migration needed for P0. The `density` column on `EncounterTable` stays (it becomes descriptive). The `densityMultiplier` column on `TableModification` stays in the DB but is ignored by generation logic. This avoids a migration and preserves existing data.

### API Changes

#### `app/server/api/encounter-tables/[id]/generate.post.ts`

The `count` parameter becomes **required** (no longer derived from density). The density-based calculation block is removed entirely.

```typescript
export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const body = await readBody(event)

  // ... table fetch (unchanged) ...

  // Spawn count -- required from client, capped at MAX_SPAWN_COUNT
  const count = Math.min(
    Math.max(1, body.count ?? 4),
    MAX_SPAWN_COUNT
  )

  // NOTE: densityMultiplier is no longer read from modifications.
  // Modifications still affect species pool (add/remove/override weights)
  // but do not scale spawn count.

  // ... rest of generation logic unchanged ...

  return {
    success: true,
    data: {
      generated,
      meta: {
        tableId: table.id,
        tableName: table.name,
        modificationId: modificationId ?? null,
        levelRange: { min: levelMin, max: levelMax },
        density: table.density as DensityTier, // informational only
        spawnCount: count,
        totalPoolSize: entries.length,
        totalWeight
        // densityMultiplier removed from meta
      }
    }
  }
})
```

### Store Changes

#### `app/stores/encounterTables.ts`

Update `generateFromTable` to require `count` parameter. Remove `densityMultiplier` from the response meta type.

```typescript
async generateFromTable(tableId: string, options: {
  count: number  // now required
  modificationId?: string
  levelRange?: LevelRange
}): Promise<{
  generated: Array<{ ... }>
  meta: {
    tableId: string
    tableName: string
    modificationId: string | null
    levelRange: LevelRange
    density: DensityTier  // informational
    spawnCount: number
    totalPoolSize: number
    totalWeight: number
    // densityMultiplier removed
  }
}>
```

### UI Changes

#### `app/components/habitat/GenerateEncounterModal.vue`

Replace the current density-derived spawn info with an explicit spawn count input.

**Before:**
```
Spawn Count
  4-8 Pokemon (based on Moderate density)
  [ ] Override spawn count: [___]
```

**After:**
```
Spawn Count: [4] (spinner, min 1, max 20)
  Suggestion: 4 (Moderate habitat -- small group)
```

The density label still appears in the table info badges as a descriptive tag. The density suggestion is shown as a hint below the spinner, derived from `DENSITY_SUGGESTIONS[table.density]`.

#### `app/components/encounter-table/ModificationCard.vue`

Remove the `densityMultiplier` display/editor from modification cards. Modifications still show their species overrides but no longer show a density multiplier slider.

#### `app/components/habitat/EncounterTableModal.vue`

Keep the density tier dropdown (it is still a useful descriptive label). Remove any language suggesting it controls spawn count. Update the help text to describe it as a habitat population description.

### Migration Path

Existing encounter tables with density tiers keep their data. The density field becomes informational. Existing `densityMultiplier` values on modifications are preserved in the DB but ignored by the generation endpoint. No data loss.

---

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

## C. Environmental Modifier Framework (P2)

**Dependency:** ptu-rule-060 (level-budget system provides encounter difficulty context for when environmental modifiers matter most).

### Scope Clarification

The existing VTT terrain system is a valid, useful tactical tool. This tier does **not** replace it. Instead, it adds an optional **environmental preset** layer that connects PTU-specific environmental rules to the existing terrain and combat systems.

### Conceptual Model

An **Environment Preset** is a named collection of mechanical effects that the GM can attach to an encounter. Each preset maps to a PTU environmental modifier example.

```typescript
export interface EnvironmentPreset {
  id: string
  name: string                    // "Dark Cave", "Frozen Lake", "Hazard Factory"
  description: string             // PTU rule text summary
  effects: EnvironmentEffect[]
}

export interface EnvironmentEffect {
  type: 'accuracy_penalty' | 'terrain_override' | 'status_trigger' | 'movement_modifier' | 'custom'
  // Accuracy penalty (Dark Cave)
  accuracyPenaltyPerMeter?: number  // -2 per unilluminated meter
  // Terrain override (Arctic)
  terrainRules?: {
    weightClassBreak?: number       // weight class 5+ breaks ice
    slowTerrain?: boolean           // all squares are slow terrain
    acrobaticsOnInjury?: boolean    // acrobatics check when taking injury
  }
  // Status trigger (Frozen Lake water)
  statusOnEntry?: {
    terrain: string                 // 'water'
    effect: string                  // 'hail_damage_per_turn'
    stagePenalty?: { stat: string; stages: number }  // speed -1
  }
  // Custom text rule
  customRule?: string               // freeform rule text for GM reference
}
```

### PTU Environment Presets (Built-in)

1. **Dark Cave** -- accuracy -2 per unilluminated meter; requires Darkvision/Blindsense or light source (Burst 2/3/4 depending on source size); Illuminate ability +1 burst radius
2. **Frozen Lake** -- weight class 5+ breaks ice; slow terrain; acrobatics check on injury; falling in water = hail damage + speed debuff
3. **Hazard Factory** -- interactive machinery elements (GM-defined); machinery damage zones; electric hazards

### Data Flow

1. GM creates encounter and optionally selects an environment preset (or creates a custom one)
2. Preset effects are stored on the Encounter record (new `environmentPreset` JSON field)
3. During combat, applicable effects are surfaced in the UI:
   - Accuracy penalty calculator shows darkness penalty when applicable
   - Weight class warnings appear when spawning/moving large Pokemon on ice
   - Hazard zones are highlighted on the VTT grid using existing terrain types
4. The GM can override or dismiss individual effects

### Implementation Notes

- Environment presets are stored as JSON on the Encounter model (similar to combatants)
- The preset selector is a new section in the encounter creation flow
- Built-in presets are defined as constants (like `RARITY_WEIGHTS`), not in the DB
- Custom presets can be saved to local storage or a new PresetLibrary model (stretch goal)
- Accuracy penalty integration requires hooking into the move execution flow (connect to `damageCalculation.ts` via a new `environmentModifiers` parameter)

### Relationship to Existing Terrain Store

The terrain store continues to handle spatial grid painting (movement costs, passability). Environment presets add a **rule layer on top** -- the dark cave preset does not change the terrain type of any grid cell, but it adds a global accuracy penalty rule that references the fog-of-war state. The frozen lake preset sets all terrain to `difficult` (slow) and adds weight-class checking, but the terrain painting itself remains under GM control.

---

## Dependencies

| Dependency | Design | Impact on This Design |
|---|---|---|
| ptu-rule-055 | XP calculation system | P1 depends on this -- the XP distribution endpoint and Pokemon XP allocation require the XP system from ptu-rule-055. P0 (density separation) is independent. |
| ptu-rule-060 | Level-budget encounter creation | P2 level-budget helper depends on this. The budget calculator would suggest spawn counts and level distributions based on party data. P0 and P1 are independent. |

### Recommended Sequencing

1. **P0 (this design)** -- can be implemented immediately, no dependencies
2. **ptu-rule-055** -- XP system design and implementation
3. **P1 (this design)** -- significance multiplier and XP calculation (uses ptu-rule-055's XP infrastructure)
4. **ptu-rule-060** -- level-budget system
5. **P2 (this design)** -- environmental modifiers and level-budget helper

---

## Testing Strategy

### P0 Tests

- **Unit:** `xpCalculation.ts` pure function tests (input/output, edge cases: 0 enemies, all trainers, significance at boundaries)
- **Unit:** `generate.post.ts` no longer reads densityMultiplier; spawn count must come from request body
- **Unit:** `DENSITY_SUGGESTIONS` constant has entries for all `DensityTier` values
- **Integration:** Generate with explicit count=6 produces exactly 6 Pokemon regardless of table density tier
- **Integration:** Generate with modification selected no longer scales spawn count (modification only affects species pool)
- **Regression:** Existing encounter tables with density tiers still load and display correctly

### P1 Tests

- **Unit:** `calculateEncounterXp()` -- base XP sums levels correctly, trainers count as 2x, significance multiplies, division rounds correctly
- **Unit:** `calculateEncounterXp()` edge cases -- 0 defeated enemies, 0 players (clamped to 1), significance 0.5
- **Integration:** PUT significance endpoint validates range, updates record, returns updated encounter
- **Integration:** GET xp endpoint returns correct breakdown for a completed encounter

### P2 Tests

- **Unit:** Environment preset constants have valid effect definitions
- **Integration:** Encounter with dark cave preset reports accuracy penalty for given distance
- **Integration:** Frozen lake preset triggers weight-class warning for large Pokemon

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking existing encounter generation workflows | HIGH | P0 makes `count` parameter have a default of 4 if not provided; existing API callers that omit `count` still work |
| densityMultiplier data loss | LOW | Column preserved in DB; only generation logic stops reading it; UI removes editor; data intact for future reference |
| P1 depends on unbuilt ptu-rule-055 | MEDIUM | XP calculation utility is self-contained; it can be built and tested before the full XP distribution system exists |
| P2 environmental modifiers are complex | LOW | Presets are optional; GM can ignore them entirely; existing terrain system untouched |

---

## File Change Summary

### P0 (Density Separation)

| File | Change |
|---|---|
| `app/types/habitat.ts` | Replace `DENSITY_RANGES` with `DENSITY_SUGGESTIONS`; update `MAX_SPAWN_COUNT` to 20; remove `densityMultiplier` from `TableModification` interface |
| `app/server/api/encounter-tables/[id]/generate.post.ts` | Remove density-to-count calculation; require `count` from request body (default 4); remove `densityMultiplier` from meta |
| `app/stores/encounterTables.ts` | Update `generateFromTable` signature and meta types |
| `app/components/habitat/GenerateEncounterModal.vue` | Replace density-derived spawn display with explicit count spinner; show density suggestion as hint |
| `app/components/encounter-table/ModificationCard.vue` | Remove densityMultiplier editor |
| `app/components/habitat/EncounterTableModal.vue` | Update density tier help text to describe it as informational |

### P1 (Significance + XP)

| File | Change |
|---|---|
| `app/utils/xpCalculation.ts` | **New** -- pure XP calculation utility |
| `app/types/encounter.ts` | Add `significanceMultiplier` to `Encounter`; enhance `defeatedEnemies` with `isTrainer` flag |
| `app/prisma/schema.prisma` | Add `significanceMultiplier Float @default(1.0)` to Encounter model |
| `app/server/api/encounters/[id]/significance.put.ts` | **New** -- update significance endpoint |
| `app/server/api/encounters/[id]/xp.get.ts` | **New** -- XP breakdown endpoint |
| `app/server/services/encounter.service.ts` | Add significance to serialization |
| `app/stores/encounter.ts` | Add `setSignificance` and `getXpBreakdown` actions |
| `app/components/encounter/SignificancePanel.vue` | **New** -- significance selector + XP breakdown display |

### P2 (Environmental Modifiers)

| File | Change |
|---|---|
| `app/types/encounter.ts` | Add `EnvironmentPreset` and `EnvironmentEffect` types |
| `app/constants/environmentPresets.ts` | **New** -- built-in PTU environment presets |
| `app/prisma/schema.prisma` | Add `environmentPreset String @default("{}")` to Encounter model |
| `app/components/encounter/EnvironmentSelector.vue` | **New** -- preset picker for encounter creation |
| `app/stores/encounter.ts` | Add environment preset management |
| `app/utils/damageCalculation.ts` | Add optional `environmentModifiers` parameter for accuracy penalties |

---

## Implementation Log

### P0 (Density Separation) -- 2026-02-20

| Commit | Description | Files |
|---|---|---|
| `a5434db` | Replace `DENSITY_RANGES` with `DENSITY_SUGGESTIONS` in habitat types; set `MAX_SPAWN_COUNT = 20`; remove `densityMultiplier` from `TableModification` interface | `app/types/habitat.ts` |
| `c2d3b4d` | Remove `calculateSpawnCount` function and `CalculateSpawnCountInput` type from encounter generation service | `app/server/services/encounter-generation.service.ts` |
| `1343265` | Use direct `count` parameter in generate endpoint; remove density-to-count calculation and `densityMultiplier` from response meta | `app/server/api/encounter-tables/[id]/generate.post.ts` |
| `c44853f` | Make `count` required in `generateFromTable`; remove `densityMultiplier` from meta types and modification method signatures | `app/stores/encounterTables.ts` |
| `04c4a72` | Replace density-derived spawn display with explicit count spinner; show density suggestion as hint | `app/components/habitat/GenerateEncounterModal.vue` |
| `dd41e1d` | Remove densityMultiplier editor and density presets from ModificationCard; remove `parentDensity` prop | `app/components/encounter-table/ModificationCard.vue` |
| `e98b8e9` | Update density display across all UI to informational only; replace `DENSITY_RANGES` with `DENSITY_SUGGESTIONS` in EncounterTableModal, TableEditor, useTableEditor, EncounterTableCard, TableCard | 5 files |
| `68be10d` | Remove `calculateSpawnCount` tests; add `DENSITY_SUGGESTIONS` constant tests and `MAX_SPAWN_COUNT` test; remove `densityMultiplier` from store test mocks | `app/tests/unit/services/encounterGeneration.test.ts`, `app/tests/unit/stores/encounterTables.test.ts` |

**Additional files changed beyond design spec plan:**
- `app/composables/useTableEditor.ts` -- replaced `getSpawnRange` with `getDensityDescription`; updated import from `DENSITY_RANGES` to `DENSITY_SUGGESTIONS`
- `app/components/encounter-table/TableEditor.vue` -- updated density display to show description; removed `parentDensity` prop pass to ModificationCard; updated density options to use suggestions
- `app/components/habitat/EncounterTableCard.vue` -- updated density label to show tier name instead of spawn range
- `app/components/encounter-table/TableCard.vue` -- updated density label to show tier name instead of spawn range

### P1 (Significance Multiplier + XP UI) -- 2026-02-21

| Commit | Description | Files |
|---|---|---|
| `ee1a0bd` | Add `significanceMultiplier Float @default(1.0)` to Encounter model | `app/prisma/schema.prisma` |
| `353f342` | Add `significanceMultiplier: number` to Encounter type interface | `app/types/encounter.ts` |
| `de4339e` | Include significanceMultiplier in encounter serialization and WebSocket sync | `app/server/services/encounter.service.ts` |
| `478b91e` | Add PUT `/api/encounters/:id/significance` endpoint (0.5-10 range validation) | `app/server/api/encounters/[id]/significance.put.ts` (new) |
| `ece9de3` | Add `setSignificance` action to encounter store | `app/stores/encounter.ts` |
| `0dcafb3` | Add SCSS partial for SignificancePanel | `app/assets/scss/components/_significance-panel.scss` (new) |
| `7c51539` | Add SignificancePanel component (preset selector, difficulty slider, XP breakdown, boss toggle) | `app/components/encounter/SignificancePanel.vue` (new) |
| `645e8e4` | Integrate SignificancePanel into GM encounter sidebar | `app/pages/gm/index.vue` |
| `9c1ddad` | Default XpDistributionModal to encounter's persisted significance | `app/components/encounter/XpDistributionModal.vue` |
| `391eeb4` | Include significanceMultiplier in encounter PUT (undo/redo path) | `app/server/api/encounters/[id].put.ts` |
| `34299b1` | Include significanceMultiplier and xpDistributed in encounter list endpoint | `app/server/api/encounters/index.get.ts` |

**Design vs actual:**
- `xp.get.ts` endpoint was not needed — `xp-calculate.post.ts` from ptu-rule-055 already provides the same functionality
- SignificancePanel calls the existing `xp-calculate.post.ts` endpoint for live XP preview
