# P0: Core Evolution Mechanics

**Priority:** P0 (must ship)
**Scope:** Evolution trigger storage, eligibility detection, species change endpoint, stat recalculation
**Matrix Rules:** R029, R031

## Overview

P0 delivers the foundational evolution pipeline: the data model for evolution triggers, the detection logic that identifies when a Pokemon CAN evolve, the stat recalculation engine, and the server endpoint that performs the evolution. After P0, the GM can evolve a Pokemon via API and the stat recalculation is PTU-correct. The UI is minimal -- a confirmation flow attached to the existing level-up notification.

## 1. Evolution Trigger Data Model

### 1.1 Schema Change

Add `evolutionTriggers` column to `SpeciesData`:

```prisma
model SpeciesData {
  // ... existing fields ...
  evolutionTriggers String @default("[]") // JSON array of EvolutionTrigger
}
```

### 1.2 Seed Parser Enhancement

Modify `app/prisma/seed.ts` to parse evolution trigger text during seeding.

Current parser extracts `evolutionStage` and `maxEvolutionStage` from lines like:
```
2 - Charmeleon Minimum 15
```

Enhancement: Also extract the trigger conditions.

**Parsing rules (regex-based):**

```
Line format: <stage> - <speciesName> [trigger text]
```

Trigger text patterns (ordered by specificity):
1. `Holding <Item> Minimum <N>` -> `{ requiredItem: Item, itemMustBeHeld: true, minimumLevel: N }`
2. `<StoneName> Minimum <N>` -> `{ requiredItem: StoneName, itemMustBeHeld: false, minimumLevel: N }`
3. `Minimum <N>` -> `{ requiredItem: null, itemMustBeHeld: false, minimumLevel: N }`
4. `<StoneName>` (no "Minimum") -> `{ requiredItem: StoneName, itemMustBeHeld: false, minimumLevel: null }`
5. (empty, stage 1) -> base stage, no trigger entry

Stone names to recognize: `Water Stone`, `Fire Stone`, `Thunderstone`, `Leaf Stone`, `Moon Stone`, `Sun Stone`, `Shiny Stone`, `Dusk Stone`, `Dawn Stone`, `Ice Stone`, `Oval Stone`, `Prism Scale`, `Deep Sea Tooth`, `Deep Sea Scale`, `King's Rock`, `Metal Coat`, `Electirizer`, `Magmarizer`, `Protector`, `Reaper Cloth`, `Razor Claw`, `Razor Fang`, `Dragon Scale`, `Up-Grade`, `Dubious Disc`, `Sachet`, `Whipped Dream`.

For each species, the seed stores triggers that describe what THIS species can evolve INTO. Only species at stage < maxStage get trigger entries. The trigger `toSpecies` is the species name from the next stage line.

**Algorithm:**
1. Parse the full evolution block for the family
2. For each species in the family, look at which species in the NEXT stage it can evolve into
3. For branching evolutions (e.g., Eevee), the base species gets multiple trigger entries
4. Store the triggers on the base species' SpeciesData record

### 1.3 SpeciesData Type Update

Update `app/types/species.ts`:

```typescript
export interface EvolutionTrigger {
  toSpecies: string
  targetStage: number
  minimumLevel: number | null
  requiredItem: string | null
  itemMustBeHeld: boolean
}

export interface SpeciesData {
  // ... existing fields ...
  maxEvolutionStage: number
  evolutionTriggers: string // JSON array of EvolutionTrigger
}
```

## 2. Evolution Eligibility Detection

### 2.1 Pure Utility: `app/utils/evolutionCheck.ts`

New file. Pure functions, no DB access.

```typescript
/**
 * Check which evolutions are available for a Pokemon.
 * Pure function -- does not query DB.
 */
export function checkEvolutionEligibility(input: {
  currentLevel: number
  heldItem: string | null
  evolutionTriggers: EvolutionTrigger[]
}): EvolutionEligibilityResult

interface EvolutionEligibilityResult {
  available: Array<{
    toSpecies: string
    trigger: EvolutionTrigger
  }>
  ineligible: Array<{
    toSpecies: string
    trigger: EvolutionTrigger
    reason: string // "Requires minimum level 30 (current: 14)" | "Requires Water Stone"
  }>
}
```

**Logic per trigger:**
1. If `minimumLevel` is set, check `currentLevel >= minimumLevel`
2. If `requiredItem` is set and `itemMustBeHeld` is true, check `heldItem === requiredItem`
3. If `requiredItem` is set and `itemMustBeHeld` is false, this is a stone -- mark as "requires <item>" (P0 does not enforce stone inventory; the GM confirms they have it)
4. A trigger is "available" if all level requirements are met. Item-based triggers (stones) are listed as available with a note that the item is needed -- the GM is the authority on whether the player has the stone.

### 2.2 Integration with Level-Up Check

Modify `app/utils/experienceCalculation.ts`:

The `calculateLevelUps()` function already accepts `evolutionLevels: number[]`. Currently this is never populated. After P0:

1. The XP distribution endpoint fetches `evolutionTriggers` from SpeciesData
2. Extracts `minimumLevel` values from triggers where `requiredItem` is null (level-only evolutions)
3. Passes those as `evolutionLevels` to `calculateLevelUps()`
4. The `canEvolve` flag on `LevelUpEvent` now correctly reflects level-based evolution eligibility

This makes the existing `LevelUpNotification.vue` display accurate "Evolution may be available at Level X!" messages without UI changes.

### 2.3 Server Endpoint: Check Evolution

`POST /api/pokemon/:id/evolution-check`

```typescript
// Input: (none -- uses Pokemon's current state)
// Output:
{
  success: true,
  data: {
    pokemonId: string,
    currentSpecies: string,
    currentLevel: number,
    heldItem: string | null,
    available: Array<{
      toSpecies: string,
      targetStage: number,
      minimumLevel: number | null,
      requiredItem: string | null,
      itemMustBeHeld: boolean
    }>,
    ineligible: Array<{
      toSpecies: string,
      reason: string
    }>
  }
}
```

Implementation:
1. Fetch Pokemon (species, level, heldItem)
2. Fetch SpeciesData for the Pokemon's current species (evolutionTriggers)
3. Call `checkEvolutionEligibility()`
4. Return result

## 3. Evolution Execution

### 3.1 Service: `app/server/services/evolution.service.ts`

New service file. Core business logic for performing evolution.

#### 3.1.1 `extractStatPoints()`

Extract the stat point allocation from a Pokemon's current state.

```typescript
function extractStatPoints(pokemon: {
  baseHp: number, baseAttack: number, baseDefense: number,
  baseSpAtk: number, baseSpDef: number, baseSpeed: number,
  currentAttack: number, currentDefense: number,
  currentSpAtk: number, currentSpDef: number, currentSpeed: number,
  maxHp: number, level: number
}): Stats {
  // baseHp/baseAttack/etc. in the DB are NATURE-ADJUSTED base stats
  // currentAttack/etc. are base + added points (calculated stats)
  // stat points allocated = calculated - nature-adjusted base
  //
  // For HP: maxHp = level + (hpStat * 3) + 10
  // So: hpStat = (maxHp - level - 10) / 3
  // And: hpStatPoints = hpStat - baseHp

  const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  return {
    hp: hpStat - pokemon.baseHp,
    attack: pokemon.currentAttack - pokemon.baseAttack,
    defense: pokemon.currentDefense - pokemon.baseDefense,
    specialAttack: pokemon.currentSpAtk - pokemon.baseSpAtk,
    specialDefense: pokemon.currentSpDef - pokemon.baseSpDef,
    speed: pokemon.currentSpeed - pokemon.baseSpeed
  }
}
```

#### 3.1.2 `recalculateStats()`

Recalculate stats for the new species.

```typescript
function recalculateStats(input: {
  newSpeciesBaseStats: Stats,       // Raw from SpeciesData
  nature: Nature,                    // Pokemon's existing nature
  level: number,                     // Current level
  statPoints: Stats                  // Redistributed stat points
}): StatRecalculationResult {
  // 1. Apply nature to new base stats
  const natureAdjusted = applyNatureToBaseStats(input.newSpeciesBaseStats, input.nature.name)

  // 2. Validate stat points total = level + 10
  const total = Object.values(input.statPoints).reduce((s, v) => s + v, 0)
  if (total !== input.level + 10) {
    return { valid: false, error: `Stat points must total ${input.level + 10}, got ${total}` }
  }

  // 3. Validate Base Relations Rule
  const violations = validateBaseRelations(natureAdjusted, input.statPoints)

  // 4. Calculate final stats
  const calculated = {
    hp: natureAdjusted.hp + input.statPoints.hp,
    attack: natureAdjusted.attack + input.statPoints.attack,
    defense: natureAdjusted.defense + input.statPoints.defense,
    specialAttack: natureAdjusted.specialAttack + input.statPoints.specialAttack,
    specialDefense: natureAdjusted.specialDefense + input.statPoints.specialDefense,
    speed: natureAdjusted.speed + input.statPoints.speed
  }

  // 5. Calculate max HP
  const maxHp = input.level + (calculated.hp * 3) + 10

  return {
    valid: true,
    natureAdjustedBase: natureAdjusted,
    calculatedStats: calculated,
    maxHp,
    violations
  }
}
```

#### 3.1.3 `validateBaseRelations()`

Enforce the PTU Base Relations Rule.

```typescript
/**
 * Validate that stat point allocation preserves Base Relations ordering.
 * PTU Core p.198: stats must maintain the same relative ordering as base stats.
 * Equal base stats are in the same tier and need not maintain order relative to each other.
 *
 * Returns array of violation messages. Empty array = valid.
 */
function validateBaseRelations(
  natureAdjustedBase: Stats,
  statPoints: Stats
): string[] {
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const violations: string[] = []

  for (const a of statKeys) {
    for (const b of statKeys) {
      if (a === b) continue
      // If base[a] > base[b], then final[a] must >= final[b]
      if (natureAdjustedBase[a] > natureAdjustedBase[b]) {
        const finalA = natureAdjustedBase[a] + statPoints[a]
        const finalB = natureAdjustedBase[b] + statPoints[b]
        if (finalA < finalB) {
          violations.push(
            `${a} (base ${natureAdjustedBase[a]}) must be >= ${b} (base ${natureAdjustedBase[b]}), ` +
            `but final ${a}=${finalA} < ${b}=${finalB}`
          )
        }
      }
    }
  }

  return violations
}
```

#### 3.1.4 `performEvolution()`

Main evolution function. Orchestrates all changes.

```typescript
async function performEvolution(input: {
  pokemonId: string,
  targetSpecies: string,
  statPoints: Stats,       // GM's redistributed stat points
  skipBaseRelations?: boolean  // Allow GM override for features that break relations
}): Promise<EvolutionResult> {
  // 1. Fetch the Pokemon
  const pokemon = await prisma.pokemon.findUnique({ where: { id: input.pokemonId } })
  if (!pokemon) throw new Error('Pokemon not found')

  // 2. Fetch the current species data (for evolution trigger validation)
  const currentSpecies = await prisma.speciesData.findUnique({ where: { name: pokemon.species } })
  if (!currentSpecies) throw new Error('Current species data not found')

  // 3. Validate evolution is possible (trigger check)
  const triggers: EvolutionTrigger[] = JSON.parse(currentSpecies.evolutionTriggers || '[]')
  const trigger = triggers.find(t => t.toSpecies === input.targetSpecies)
  if (!trigger) throw new Error(`${pokemon.species} cannot evolve into ${input.targetSpecies}`)

  // 4. Fetch the target species data
  const targetSpecies = await prisma.speciesData.findUnique({ where: { name: input.targetSpecies } })
  if (!targetSpecies) throw new Error('Target species data not found')

  // 5. Recalculate stats
  const nature: Nature = JSON.parse(pokemon.nature)
  const newBaseStats = {
    hp: targetSpecies.baseHp, attack: targetSpecies.baseAttack,
    defense: targetSpecies.baseDefense, specialAttack: targetSpecies.baseSpAtk,
    specialDefense: targetSpecies.baseSpDef, speed: targetSpecies.baseSpeed
  }
  const recalc = recalculateStats({
    newSpeciesBaseStats: newBaseStats,
    nature,
    level: pokemon.level,
    statPoints: input.statPoints
  })

  if (!recalc.valid) throw new Error(recalc.error)
  if (recalc.violations.length > 0 && !input.skipBaseRelations) {
    throw new Error(`Base Relations violated: ${recalc.violations.join('; ')}`)
  }

  // 6. Calculate current HP proportionally
  const oldMaxHp = pokemon.maxHp
  const oldCurrentHp = pokemon.currentHp
  const hpRatio = oldMaxHp > 0 ? oldCurrentHp / oldMaxHp : 1
  const newCurrentHp = Math.max(1, Math.round(hpRatio * recalc.maxHp))

  // 7. Write the update
  const updated = await prisma.pokemon.update({
    where: { id: input.pokemonId },
    data: {
      species: input.targetSpecies,
      type1: targetSpecies.type1,
      type2: targetSpecies.type2 || null,
      baseHp: recalc.natureAdjustedBase.hp,
      baseAttack: recalc.natureAdjustedBase.attack,
      baseDefense: recalc.natureAdjustedBase.defense,
      baseSpAtk: recalc.natureAdjustedBase.specialAttack,
      baseSpDef: recalc.natureAdjustedBase.specialDefense,
      baseSpeed: recalc.natureAdjustedBase.speed,
      currentAttack: recalc.calculatedStats.attack,
      currentDefense: recalc.calculatedStats.defense,
      currentSpAtk: recalc.calculatedStats.specialAttack,
      currentSpDef: recalc.calculatedStats.specialDefense,
      currentSpeed: recalc.calculatedStats.speed,
      maxHp: recalc.maxHp,
      currentHp: newCurrentHp,
      // P1 handles: abilities, moves, capabilities, skills
    }
  })

  return {
    success: true,
    pokemon: serializePokemon(updated),
    changes: { /* diff object for UI display */ }
  }
}
```

### 3.2 Server Endpoint: Evolve Pokemon

`POST /api/pokemon/:id/evolve`

```typescript
// Input:
{
  targetSpecies: string,       // Which species to evolve into
  statPoints: {                // Redistributed stat points
    hp: number,
    attack: number,
    defense: number,
    specialAttack: number,
    specialDefense: number,
    speed: number
  },
  skipBaseRelations?: boolean  // GM override
}

// Output:
{
  success: true,
  data: {
    pokemon: Pokemon,          // Full updated Pokemon
    changes: EvolutionChanges  // Diff for UI display
  }
}
```

Validation:
- Pokemon must exist
- Target species must be in the evolution triggers for the current species
- Stat points must total `level + 10`
- Base Relations must be satisfied (unless `skipBaseRelations`)
- If trigger has `minimumLevel`, Pokemon's level must meet it
- If trigger has `requiredItem` with `itemMustBeHeld`, Pokemon's `heldItem` must match

## 4. Minimal UI (P0)

### 4.1 Evolution Prompt in Level-Up Flow

Enhance the existing `LevelUpNotification.vue` evolution entries to be actionable:

When a `LevelUpEvent` has `canEvolve: true`:
- Show "Evolve into <species>?" with a button
- Clicking opens the evolution confirmation flow

### 4.2 Evolution Confirmation Modal

New component: `app/components/pokemon/EvolutionConfirmModal.vue`

Minimal P0 version:
1. Shows: "Evolve <Charmander> into <Charmeleon>?"
2. Displays stat comparison (old base vs new base)
3. Shows current stat point allocation
4. Allows stat point redistribution (total must equal Level + 10)
5. Base Relations validation (real-time feedback)
6. "Evolve" and "Cancel" buttons
7. On confirm: calls `POST /api/pokemon/:id/evolve`

The modal does NOT handle ability remapping, move learning, or capability updates in P0 -- those are handled in P1.

### 4.3 Manual Evolution Trigger

For non-level-based evolutions (stone, item), add an "Evolve" button in the Pokemon sheet actions. This button:
1. Calls `POST /api/pokemon/:id/evolution-check`
2. If evolutions are available, opens the confirmation modal
3. If none available, shows a message explaining why

## 5. Implementation Order

1. **Schema + Seed** -- Add `evolutionTriggers` column, enhance seed parser
2. **Evolution utility** -- `app/utils/evolutionCheck.ts` (pure functions)
3. **Evolution service** -- `app/server/services/evolution.service.ts`
4. **Check endpoint** -- `POST /api/pokemon/:id/evolution-check`
5. **Evolve endpoint** -- `POST /api/pokemon/:id/evolve`
6. **Level-up integration** -- Feed evolution levels into `calculateLevelUps()`
7. **Confirmation modal** -- `EvolutionConfirmModal.vue`
8. **Level-up notification hookup** -- Make evolution entries clickable

## 6. Acceptance Criteria

- [ ] `SpeciesData.evolutionTriggers` column exists and is populated by seed
- [ ] Level-based evolution triggers correctly parsed from all ~994 pokedex files
- [ ] Stone-based and held-item-based triggers correctly parsed
- [ ] `checkEvolutionEligibility()` returns correct results for level-only, stone, and held-item triggers
- [ ] `LevelUpEvent.canEvolve` is accurate for level-based evolutions
- [ ] `POST /api/pokemon/:id/evolve` changes species, types, base stats, calculated stats, maxHp, currentHp
- [ ] Stat recalculation uses new species base stats + existing nature + redistributed stat points
- [ ] Base Relations Rule is enforced (with GM override option)
- [ ] Current HP adjusts proportionally to new maxHp
- [ ] Evolution confirmation modal shows stat comparison and allows redistribution
- [ ] Manual "Evolve" button works for stone/item evolutions
