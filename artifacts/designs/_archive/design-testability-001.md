---
design_id: design-testability-001
gap_report: rules-review-test-integrity-001
category: FEATURE_GAP
scope: PARTIAL
domain: combat
scenario_id: (17+ combat spec files — all damage-formula tests are tautological)
loop_id: combat
status: implemented
affected_files:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/move.post.ts
new_files:
  - app/utils/damageCalculation.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
---

# Design: Server-Side Combat Calculations for Testability

## Summary

Add a pure-function damage calculation utility (`damageCalculation.ts`) and a REST endpoint (`POST /api/encounters/:id/calculate-damage`) that computes the full PTU 9-step damage formula server-side. This converts 17+ tautological test files into genuine end-to-end tests by giving the server the ability to compute damage, STAB, type effectiveness, stage multipliers, evasion, and critical hits — rather than echoing client-sent numbers.

The capture rate system (`captureRate.ts` + `POST /api/capture/rate`) is the proven architectural pattern: a pure utility with typed input/output and a full breakdown, consumed by a thin API endpoint.

---

## Priority Map

| # | Mechanic | Current Status | Server Gap | Priority |
|---|----------|---------------|------------|----------|
| A | Damage formula (9-step) | TESTED_TAUTOLOGICAL | No compute endpoint | **P0** |
| B | STAB (+2 DB) | TESTED_TAUTOLOGICAL | No server code | P0 (part of A) |
| C | Type effectiveness | TESTED_TAUTOLOGICAL | No server type chart | P0 (part of A) |
| D | Stage multiplier → stat | NOT_TESTED (multiplier→damage) | Storage only, no multiplication | P0 (part of A) |
| E | Critical hit damage | NOT_TESTED | Client-only | P0 (part of A) |
| F | Evasion recalculation | TESTED_TAUTOLOGICAL | Static after creation | **P1** |
| G | HP marker injuries | NOT_TESTED | Server clamps HP >= 0 | **P2** |

Items A–E are delivered together as a single endpoint. F and G are independent enhancements.

---

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

## B. Evasion Recalculation During Combat (P1)

### Problem

Evasion is computed once at combatant creation (`pokemon-generator.service.ts:301-303`) using `floor(calculatedStat / 5)`. During combat, if defense stages change, the evasion doesn't update. PTU rules explicitly state evasion should reflect stage-modified stats:

> "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score." (07-combat.md:644-647)

### Solution

Add evasion calculation to `damageCalculation.ts` and expose it through the calculate-damage endpoint's breakdown.

#### New Functions in `damageCalculation.ts`

```typescript
/**
 * Calculate dynamic evasion from stage-modified stat.
 * PTU 07-combat.md:594-615, 644-647
 * Evasion = min(6, floor(stageModifiedStat / 5))
 */
export function calculateEvasion(baseStat: number, combatStage: number = 0): number {
  const modifiedStat = applyStageModifier(baseStat, combatStage)
  return Math.min(6, Math.floor(modifiedStat / 5))
}

/**
 * Calculate accuracy threshold for a move.
 * PTU 07-combat.md:749-755
 * Threshold = max(1, moveAC + min(9, evasion) - attackerAccuracyStage)
 * Nat 1 = always miss, Nat 20 = always hit.
 */
export function calculateAccuracyThreshold(
  moveAC: number,
  attackerAccuracyStage: number,
  defenderEvasion: number
): number {
  const effectiveEvasion = Math.min(9, defenderEvasion)
  return Math.max(1, moveAC + effectiveEvasion - attackerAccuracyStage)
}
```

#### Extended Calculate-Damage Response

Add an `accuracy` section to the `DamageCalcResult`:

```typescript
export interface AccuracyCalcResult {
  moveAC: number
  attackerAccuracyStage: number
  // Defender's chosen evasion (best of physical/special for the move's damage class)
  physicalEvasion: number      // dynamic: floor(stageModified defense / 5), cap 6
  specialEvasion: number       // dynamic: floor(stageModified spDef / 5), cap 6
  speedEvasion: number         // dynamic: floor(stageModified speed / 5), cap 6
  applicableEvasion: number    // physical or special based on move's damage class
  effectiveEvasion: number     // min(9, applicableEvasion)
  accuracyThreshold: number    // the d20 roll needed to hit
}
```

The endpoint computes dynamic evasion using the target's current stats and stage modifiers, rather than reading the static `physicalEvasion`/`specialEvasion`/`speedEvasion` fields on the combatant.

### Test Impact

Tests can assert:
- A target with Defense 15 and +0 CS has Physical Evasion 3
- The same target at +3 Defense CS (stat becomes `floor(15 * 1.6) = 24`) has Physical Evasion 4
- The +9 evasion cap is enforced
- Accuracy thresholds are correctly computed from dynamic evasion

---

## C. HP Marker Injury Detection (P2)

### Problem

`combatant.service.ts:calculateDamage()` only detects **massive damage** injuries (single hit >= 50% maxHP). PTU also awards injuries when HP crosses the 50%, 0%, -50%, -100% markers. The server clamps HP to `Math.max(0, ...)`, making negative HP markers unreachable.

### Solution

Extend `combatant.service.ts:calculateDamage()` to detect HP marker crossings. This is a modification to an existing function, not a new endpoint.

#### Changes to `combatant.service.ts`

1. **Remove the HP >= 0 clamp** (line 46) — allow `newHp` to go negative for marker tracking. Introduce a separate `displayHp` field clamped to 0 for UI purposes, or track `effectiveHp` (negative) alongside `currentHp` (clamped). The display field is the simpler approach.

2. **Add HP marker crossing detection:**

```typescript
/**
 * Count HP markers crossed between previousHp and newHp.
 * Markers: 50%, 0%, -50%, -100%, -150%, ...
 * PTU 07-combat.md:1837-1856
 * Uses REAL maxHp (not injury-reduced maxHp) per PTU rules.
 */
export function countMarkersCrossed(
  previousHp: number,
  newHp: number,
  realMaxHp: number
): { count: number; markers: number[] } {
  const markers: number[] = []
  // Generate marker thresholds: 50%, 0%, -50%, -100%, ...
  const fiftyPercent = Math.floor(realMaxHp * 0.5)
  // Start from 50% marker, go down in 50% steps
  let threshold = fiftyPercent
  while (threshold >= newHp) {
    if (previousHp > threshold && newHp <= threshold) {
      markers.push(threshold)
    }
    threshold -= fiftyPercent
    // Safety: don't loop forever if maxHp is 0 or 1
    if (fiftyPercent === 0 || markers.length > 20) break
  }
  return { count: markers.length, markers }
}
```

3. **Integrate into `calculateDamage()`:**

```typescript
// Existing: massive damage check
const massiveDamageInjury = hpDamage >= maxHp / 2 ? 1 : 0

// New: marker crossing check
const { count: markerInjuries, markers } = countMarkersCrossed(currentHp, newHp, maxHp)

// Total injuries from this hit
const totalNewInjuries = massiveDamageInjury + markerInjuries
```

4. **Extend `DamageResult` type:**

```typescript
export interface DamageResult {
  // ... existing fields ...
  injuryGained: boolean          // any injury from this hit
  massiveDamageInjury: boolean   // injury from >= 50% maxHP single hit
  markerInjuries: number         // injuries from crossing HP markers
  markersCrossed: number[]       // which HP thresholds were crossed
  totalNewInjuries: number       // massiveDamage + markers
  newInjuries: number            // previous injuries + totalNewInjuries
}
```

### Negative HP Considerations

PTU allows HP to go negative. The app currently clamps to 0. Two approaches:

**Option A (recommended): Track effective HP separately.**
Add `effectiveHp` to the combatant entity that can go negative. Keep `currentHp` clamped to 0 for UI display. This avoids cascading UI changes while enabling correct injury tracking.

**Option B: Allow negative currentHp.**
Remove the clamp entirely. All UI code that displays HP would need to handle negative values. Higher risk of unexpected visual glitches.

The Developer and Senior Reviewer should decide which approach to take.

### Test Impact

Tests can verify:
- A single hit from full HP to 0 HP gains 2 injuries (massive damage + crossing 50% marker + crossing 0% marker, minus 1 if not massive)
- The example from the rulebook: full HP to -150% = 6 injuries (1 massive + 5 markers)
- Healing past a marker and taking damage past it again awards another injury

---

## Existing Patterns to Follow

- **`app/utils/captureRate.ts`** — the gold standard for server-side PTU computation. Same file structure: typed input, typed result with breakdown, pure functions, zero side effects.
- **`app/server/api/capture/rate.post.ts`** — thin endpoint that extracts parameters from DB records and calls the pure utility. Same pattern for `calculate-damage.post.ts`.
- **`app/server/services/combatant.service.ts`** — existing damage application logic. The HP marker enhancement extends `calculateDamage()` in this file.
- **`app/composables/useCombat.ts:242-261`** — source for the 18-type effectiveness chart.
- **`app/composables/useCombat.ts:96-125`** — source for the DB → set damage chart.
- **`app/composables/useCombat.ts:11-25`** — source for the stage multiplier table.

---

## PTU Rule Questions

1. **Evasion + Speed Evasion stacking:** PTU says "you may only add ONE of the three evasions to any one accuracy check" (07-combat.md:636). The calculate-damage endpoint reports all three evasions but the test/client must choose which to apply. Should the endpoint accept a `chosenEvasionType` parameter, or always report the best applicable evasion for the move's damage class?

2. **Damage Reduction sources:** The current design accepts an optional `damageReduction` parameter. PTU Damage Reduction comes from abilities, items, and effects. Should the endpoint auto-detect DR from the target's abilities, or accept it as an explicit parameter? Explicit is simpler and avoids parsing ability effects.

3. **Five-Strike / Double-Strike (step 2):** Some moves hit multiple times with modified DB. Should this be handled by the endpoint (accepting a `strikeCount` parameter), or should the client call the endpoint once per strike? One-call-per-strike is simpler and matches PTU's "each hit is a separate damage instance" rule.

## Questions for Senior Reviewer

1. **Shared utility location:** `app/utils/damageCalculation.ts` is importable by both server and client. The existing `captureRate.ts` is in the same location. Is this the right place, or should server-only computation live under `app/server/utils/`?

2. **Type chart duplication:** The 18-type chart will exist in both `damageCalculation.ts` (for server) and `useCombat.ts` (for client). Should the client composable be refactored to import from the shared utility in this phase, or defer to a separate refactoring ticket?

3. **Negative HP (Option A vs B):** For HP marker injuries, Option A (separate `effectiveHp` field) is less disruptive but adds a field to the combatant schema. Option B (allow negative `currentHp`) is cleaner but touches UI code. Which approach aligns better with the app's architecture?

4. **Move execution integration:** Should `move.post.ts` be updated to use `calculateDamage()` internally (making the server authoritative for damage), or keep it as a separate read-only calculation endpoint? The read-only approach is lower risk and achieves the testability goal.

---

## Implementation Notes

### Suggested Implementation Order

1. **`app/utils/damageCalculation.ts`** — pure functions, unit-testable immediately
2. **`app/server/api/encounters/[id]/calculate-damage.post.ts`** — thin endpoint
3. **Unit tests for `damageCalculation.ts`** — verify each formula step against PTU rules
4. **E2E tests using the endpoint** — convert tautological tests to call the server
5. **Evasion functions** — add to `damageCalculation.ts`, extend endpoint response
6. **HP marker detection** — modify `combatant.service.ts`, extend `DamageResult`

### What NOT To Change (Yet)

- `damage.post.ts` — continues accepting pre-computed damage (existing workflow unbroken)
- `move.post.ts` — continues accepting client-sent `targetDamages` (existing workflow unbroken)
- `useMoveCalculation.ts` — client composable unchanged (still drives the UI)
- `useCombat.ts` — client composable unchanged (still has the type chart and stage table)
- Prisma schema — no model changes needed for P0 or P1

The eventual goal is for `move.post.ts` to call `calculateDamage()` internally, making the server authoritative. But that is a separate design — this design focuses on testability.

## Implementation Log

### P0 — Damage Calculation Endpoint
- Commits: `5dc97c7` feat: add pure damage calculation utility, `e7aa6aa` feat: add calculate-damage API endpoint
- New files:
  - `app/utils/damageCalculation.ts` — pure functions: stage multipliers, DB chart, 18-type chart, STAB, calculateDamage() with typed breakdown
  - `app/server/api/encounters/[id]/calculate-damage.post.ts` — thin endpoint: loads encounter, extracts combatant stats by damage class, calls calculateDamage(), returns breakdown
- `app-surface.md` updated: yes — added Damage Calculation endpoint section

### P1 — Evasion Recalculation
- Commits: `01150bf` feat: add evasion and accuracy calculation functions, `2dd0d67` feat: add evasion/accuracy section to calculate-damage endpoint
- Modified files:
  - `app/utils/damageCalculation.ts` — added `calculateEvasion()`, `calculateAccuracyThreshold()`, `AccuracyCalcResult` interface
  - `app/server/api/encounters/[id]/calculate-damage.post.ts` — added `getEntityEvasionStats()` helper, computes dynamic evasion from stage-modified stats, returns `accuracy` section in response
- Evasion is now dynamically computed from `floor(stageModifiedStat / 5)` with +6 cap per stat, +9 cap total

### P2 — HP Marker Injury Detection
- Commits: `20253c3` feat: add HP marker injury detection to damage calculation, `2b1a69e` test: update injury expectations for HP marker crossings, `e3a424e` test: update wild encounter injury expectation for HP markers
- Modified files:
  - `app/server/services/combatant.service.ts` — added `countMarkersCrossed()`, extended `calculateDamage()` with unclamped HP for marker detection, extended `DamageResult` with `massiveDamageInjury`, `markerInjuries`, `markersCrossed`, `totalNewInjuries`
  - 11 combat test files — updated injury count expectations to account for HP marker crossings (massive damage from full HP now gives 2 injuries: massive + 50% marker)
- `newHp` stays clamped to 0 for storage; unclamped value used internally for marker detection
- Also fixed 3 pre-existing undefined variable bugs in test files (`expectedHp`/`expectedMachopHp`)
