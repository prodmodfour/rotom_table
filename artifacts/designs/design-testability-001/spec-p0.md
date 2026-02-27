# P0 Specification

## A. Damage Calculation Endpoint (P0)

### GM User Flow

No new GM-facing UI. This endpoint is consumed by tests and (optionally, in a future phase) by the move execution UI to replace client-side damage computation.

1. Test sends `POST /api/encounters/:id/calculate-damage` with attacker, target, move, and flags
2. Server loads encounter, looks up combatant data, computes the full PTU damage formula
3. Server returns a typed breakdown: effective DB, set damage, attack stat, defense stat, stage multipliers, STAB, type effectiveness, final damage
4. Test asserts the breakdown values against PTU rule derivations

### Data Model Changes

None. All data needed for the calculation already exists in the combatant JSON blob:
- `entity.types: string[]` — attacker types (for STAB)
- `entity.currentStats` — attack, defense, spAtk, spDef
- `entity.moves[]` — move type, damageClass, damageBase, ac
- `stageModifiers` — per-stat combat stages (-6 to +6)
- Target `entity.types` — for type effectiveness

### New File: `app/utils/damageCalculation.ts`

Pure functions, zero DB access, full breakdown output. Follows `captureRate.ts` pattern.

#### Constants

```typescript
// Stage multiplier table (PTU 07-combat.md:701-728)
// Positive: +20% per stage. Negative: -10% per stage.
export const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.4, [-5]: 0.5, [-4]: 0.6, [-3]: 0.7, [-2]: 0.8, [-1]: 0.9,
  [0]: 1.0, [1]: 1.2, [2]: 1.4, [3]: 1.6, [4]: 1.8, [5]: 2.0, [6]: 2.2
}

// DB chart — set damage average values (PTU 07-combat.md:921-985)
export const DAMAGE_BASE_CHART: Record<number, { min: number; avg: number; max: number }> = {
  1:  { min: 2,  avg: 5,   max: 7   },
  2:  { min: 4,  avg: 7,   max: 9   },
  3:  { min: 6,  avg: 9,   max: 11  },
  4:  { min: 7,  avg: 11,  max: 14  },
  5:  { min: 9,  avg: 13,  max: 16  },
  6:  { min: 10, avg: 15,  max: 20  },
  7:  { min: 12, avg: 17,  max: 22  },
  8:  { min: 12, avg: 19,  max: 26  },
  9:  { min: 12, avg: 21,  max: 30  },
  10: { min: 13, avg: 24,  max: 34  },
  11: { min: 13, avg: 27,  max: 40  },
  12: { min: 13, avg: 30,  max: 46  },
  13: { min: 14, avg: 35,  max: 50  },
  14: { min: 19, avg: 40,  max: 55  },
  15: { min: 24, avg: 45,  max: 60  },
  16: { min: 25, avg: 50,  max: 70  },
  17: { min: 30, avg: 60,  max: 85  },
  18: { min: 31, avg: 65,  max: 97  },
  19: { min: 36, avg: 70,  max: 102 },
  20: { min: 41, avg: 75,  max: 107 },
  21: { min: 46, avg: 80,  max: 112 },
  22: { min: 51, avg: 85,  max: 117 },
  23: { min: 56, avg: 90,  max: 122 },
  24: { min: 61, avg: 95,  max: 127 },
  25: { min: 66, avg: 100, max: 132 },
  26: { min: 72, avg: 110, max: 149 },
  27: { min: 78, avg: 120, max: 166 },
  28: { min: 88, avg: 130, max: 176 },
}

// Full 18-type effectiveness chart (PTU 07-combat.md:780-787)
// Super Effective = 1.5 (NOT 2.0 like video games)
export const TYPE_CHART: Record<string, Record<string, number>> = {
  // ... full 18x18 chart (copy from useCombat.ts:242-261)
}
```

#### Input / Output Types

```typescript
export interface DamageCalcInput {
  // Attacker
  attackerTypes: string[]
  attackStat: number           // base attack or spAtk (pre-stage)
  attackStage: number          // combat stage for relevant attack stat
  // Move
  moveType: string
  moveDamageBase: number
  moveDamageClass: 'Physical' | 'Special'
  // Target
  targetTypes: string[]
  defenseStat: number          // base defense or spDef (pre-stage)
  defenseStage: number         // combat stage for relevant defense stat
  // Flags
  isCritical?: boolean
  damageReduction?: number     // from Damage Reduction abilities/items
}

export interface DamageCalcResult {
  finalDamage: number
  breakdown: {
    // Step 1-3: Damage Base
    rawDB: number              // move's base DB
    stabApplied: boolean       // did STAB fire?
    effectiveDB: number        // rawDB + 2 if STAB
    // Step 4-5: Set damage from chart
    setDamage: number          // chart lookup for effectiveDB
    criticalApplied: boolean
    critDamageBonus: number    // extra set damage from crit (0 if no crit)
    baseDamage: number         // setDamage + critDamageBonus
    // Step 6: Attack stat
    rawAttackStat: number
    attackStageMultiplier: number
    effectiveAttack: number    // floor(rawAttack * stageMultiplier)
    subtotalBeforeDefense: number  // baseDamage + effectiveAttack
    // Step 7: Defense stat
    rawDefenseStat: number
    defenseStageMultiplier: number
    effectiveDefense: number   // floor(rawDefense * stageMultiplier)
    damageReduction: number
    afterDefense: number       // max(1, subtotal - effectiveDefense - DR)
    // Step 8: Type effectiveness
    typeEffectiveness: number  // multiplier (0, 0.25, 0.5, 1.0, 1.5, 2.0, etc.)
    typeEffectivenessLabel: string  // "Super Effective", "Neutral", etc.
    afterEffectiveness: number // floor(afterDefense * effectiveness)
    // Final
    minimumApplied: boolean    // did the min-1 rule kick in?
  }
}
```

#### Core Functions

```typescript
/** Apply combat stage multiplier to a base stat. PTU 07-combat.md:670-675 */
export function applyStageModifier(baseStat: number, stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage))
  return Math.floor(baseStat * STAGE_MULTIPLIERS[clamped])
}

/** Check if attacker gets STAB. PTU 07-combat.md:790-793 */
export function hasSTAB(moveType: string, attackerTypes: string[]): boolean {
  return attackerTypes.includes(moveType)
}

/** Get set damage for a Damage Base value. */
export function getSetDamage(db: number): number {
  const clamped = Math.max(1, Math.min(28, db))
  return DAMAGE_BASE_CHART[clamped].avg
}

/** Compute type effectiveness multiplier. PTU uses 1.5 for SE, not 2.0. */
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1.0
  for (const defType of defenderTypes) {
    const chart = TYPE_CHART[moveType]
    if (chart && chart[defType] !== undefined) {
      multiplier *= chart[defType]
    }
  }
  return multiplier
}

/** Label for a type effectiveness multiplier. */
export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier === 0) return 'Immune'
  if (multiplier <= 0.25) return 'Doubly Resisted'
  if (multiplier < 1) return 'Resisted'
  if (multiplier === 1) return 'Neutral'
  if (multiplier <= 1.5) return 'Super Effective'
  if (multiplier <= 2) return 'Doubly Super Effective'
  return 'Triply Super Effective'
}

/**
 * Full PTU 9-step damage formula.
 * PTU 07-combat.md:834-847
 */
export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  // Steps 1-3: Damage Base + STAB
  const rawDB = input.moveDamageBase
  const stabApplied = hasSTAB(input.moveType, input.attackerTypes)
  const effectiveDB = rawDB + (stabApplied ? 2 : 0)

  // Steps 4-5: Set damage from chart + critical
  const setDamage = getSetDamage(effectiveDB)
  const criticalApplied = input.isCritical ?? false
  const critDamageBonus = criticalApplied ? getSetDamage(effectiveDB) : 0
  const baseDamage = setDamage + critDamageBonus

  // Step 6: Add attack stat (stage-modified)
  const attackStageMultiplier = STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, input.attackStage))]
  const effectiveAttack = applyStageModifier(input.attackStat, input.attackStage)
  const subtotalBeforeDefense = baseDamage + effectiveAttack

  // Step 7: Subtract defense stat (stage-modified) + damage reduction
  const defenseStageMultiplier = STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, input.defenseStage))]
  const effectiveDefense = applyStageModifier(input.defenseStat, input.defenseStage)
  const dr = input.damageReduction ?? 0
  const afterDefense = Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)

  // Step 8: Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(input.moveType, input.targetTypes)
  const effectivenessLabel = getEffectivenessLabel(typeEffectiveness)
  let afterEffectiveness = Math.floor(afterDefense * typeEffectiveness)

  // Minimum 1 damage (unless immune)
  let minimumApplied = false
  if (typeEffectiveness === 0) {
    afterEffectiveness = 0
  } else if (afterEffectiveness < 1) {
    afterEffectiveness = 1
    minimumApplied = true
  }

  return {
    finalDamage: afterEffectiveness,
    breakdown: {
      rawDB, stabApplied, effectiveDB,
      setDamage, criticalApplied, critDamageBonus, baseDamage,
      rawAttackStat: input.attackStat, attackStageMultiplier, effectiveAttack, subtotalBeforeDefense,
      rawDefenseStat: input.defenseStat, defenseStageMultiplier, effectiveDefense,
      damageReduction: dr, afterDefense,
      typeEffectiveness, typeEffectivenessLabel: effectivenessLabel, afterEffectiveness,
      minimumApplied,
    }
  }
}
```

### New File: `app/server/api/encounters/[id]/calculate-damage.post.ts`

Thin endpoint that loads encounter data, extracts parameters from combatant blobs, and calls the pure utility.

```typescript
// Request body
interface CalculateDamageRequest {
  attackerId: string     // combatant ID
  targetId: string       // combatant ID
  moveName: string       // name of move in attacker's move list
  isCritical?: boolean
}

// Response: { success: true, data: DamageCalcResult }
```

**Endpoint logic:**
1. `loadEncounter(id)` — load encounter + combatant JSON
2. Find attacker combatant by `attackerId`
3. Find target combatant by `targetId`
4. Find move in `attacker.entity.moves[]` by `moveName`
5. Determine damage class: Physical → attack/defense; Special → spAtk/spDef
6. Extract parameters from combatant data:
   - `attackerTypes` = `attacker.entity.types`
   - `attackStat` = `attacker.entity.currentStats.attack` (or `.specialAttack`)
   - `attackStage` = `attacker.entity.stageModifiers.attack` (or `.specialAttack`)
   - `targetTypes` = `target.entity.types`
   - `defenseStat` = `target.entity.currentStats.defense` (or `.specialDefense`)
   - `defenseStage` = `target.entity.stageModifiers.defense` (or `.specialDefense`)
   - `moveType` = `move.type`
   - `moveDamageBase` = `move.damageBase`
   - `moveDamageClass` = `move.damageClass`
   - `isCritical` = `body.isCritical ?? false`
7. Call `calculateDamage(input)` from `damageCalculation.ts`
8. Return the full `DamageCalcResult`

**Validation:**
- Encounter must exist
- Both combatants must exist in the encounter
- Move must exist in attacker's move list
- Move must be a damaging move (has a `damageBase > 0`)

### Type Chart Source

Copy the 18-type chart from `useCombat.ts:242-261` into `damageCalculation.ts`. The client composable can later be refactored to import from the shared utility, but that refactor is not part of this design — the goal is testability, not DRY consolidation.

### Test Impact

With this endpoint, combat test files can:
1. Set up an encounter with known combatants (species with deterministic stats via `overrideStats`)
2. Call `POST /api/encounters/:id/calculate-damage` with attacker, target, and move
3. Assert the server-computed breakdown matches PTU formula derivations
4. The 17 tautological damage tests become genuine server-side calculations

---

