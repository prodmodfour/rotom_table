# P0: Source Tracking Data Model + Source-Aware Faint Clearing

## Scope

P0 establishes the source tracking infrastructure and the primary motivating behavior: source-dependent faint clearing for Other conditions (decree-047). This is the minimal viable implementation.

---

## Section A: ConditionSourceType and ConditionInstance Types

### A.1: Add ConditionSourceType to combat.ts

**File:** `app/types/combat.ts`

Add after the existing `StageSource` interface:

```typescript
/**
 * Classification of what applied a condition.
 * Per decree-047: source determines whether Other conditions clear on faint.
 */
export type ConditionSourceType =
  | 'move'        // Applied by a move effect (e.g., Thunder Wave -> Paralysis)
  | 'ability'     // Applied by an ability (e.g., Effect Spore -> Poisoned)
  | 'terrain'     // Applied by terrain (e.g., terrain-based Stuck)
  | 'weather'     // Applied by weather effect
  | 'item'        // Applied by an item
  | 'environment' // Applied by environment preset effect
  | 'manual'      // GM manually applied
  | 'system'      // Applied by system automation (breather penalties, etc.)
  | 'unknown'     // Source not recorded (pre-existing conditions on combat entry)

/**
 * An applied condition with source metadata (decree-047).
 * Lives on Combatant.conditionInstances[] (combat-scoped).
 */
export interface ConditionInstance {
  /** The status condition name */
  condition: StatusCondition
  /** What type of game element applied this condition */
  sourceType: ConditionSourceType
  /** Human-readable description of the source */
  sourceLabel: string
  /** Combat round when this condition was applied */
  appliedRound?: number
}
```

### A.2: Add conditionInstances to Combatant

**File:** `app/types/encounter.ts`

Add to the `Combatant` interface, after `stageSources`:

```typescript
// Source-tracked condition instances (decree-047)
// Combat-scoped: populated on combat entry, consumed by clearing logic.
// Kept in sync with entity.statusConditions (the flat string array).
conditionInstances?: ConditionInstance[]
```

Add `ConditionInstance` to the imports from `~/types/combat`.

---

## Section B: Source-to-Clearing Rules Module

### B.1: Create conditionSourceRules.ts

**File:** `app/constants/conditionSourceRules.ts` (NEW)

```typescript
/**
 * Source-dependent clearing rules for condition instances (decree-047).
 *
 * For Persistent and Volatile conditions, clearing behavior is always
 * determined by the static per-condition flags (they clear on faint per RAW).
 *
 * For Other conditions, the source type can override the static flags.
 * Per decree-047: move-inflicted Other conditions clear on faint,
 * terrain-based Other conditions do not.
 */
import { getConditionDef } from '~/constants/statusConditions'
import type { StatusCondition, ConditionSourceType, ConditionInstance } from '~/types'

export interface ConditionClearingOverrides {
  clearsOnFaint: boolean
}

/**
 * Source-type to clearing-behavior override map.
 * Only consulted for 'other' category conditions.
 * An empty object means "use the static condition def flag."
 */
export const SOURCE_CLEARING_RULES: Record<ConditionSourceType, Partial<ConditionClearingOverrides>> = {
  'move':        { clearsOnFaint: true },   // Move effect dissipates on faint
  'ability':     { clearsOnFaint: true },    // Ability effect typically dissipates
  'terrain':     { clearsOnFaint: false },   // Terrain persists independently
  'weather':     { clearsOnFaint: false },   // Weather persists independently
  'item':        { clearsOnFaint: true },    // Item effects are combat-contextual
  'environment': { clearsOnFaint: false },   // Environment preset persists
  'manual':      { clearsOnFaint: false },   // GM-applied: conservative, GM controls removal
  'system':      { clearsOnFaint: false },   // System-applied: defer to static flags
  'unknown':     {}                          // No override: use static condition def
}

/**
 * Determine whether a specific condition instance should be cleared on faint.
 *
 * Logic:
 * 1. Persistent/Volatile: always use static clearsOnFaint flag (true per RAW).
 * 2. Other + known source: check SOURCE_CLEARING_RULES for override.
 * 3. Other + unknown/no source: use static flag (false per decree-047).
 */
export function shouldClearOnFaint(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Persistent and Volatile always clear on faint per PTU p.248
  if (def.category !== 'other') {
    return def.clearsOnFaint
  }

  // Other condition: check source-based override
  if (instance?.sourceType) {
    const sourceRule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (sourceRule && sourceRule.clearsOnFaint !== undefined) {
      return sourceRule.clearsOnFaint
    }
  }

  // Fallback: static condition def flag (clearsOnFaint: false for Other, decree-047)
  return def.clearsOnFaint
}

/**
 * Build a default ConditionInstance for a condition with no known source.
 * Used when seeding conditionInstances from pre-existing statusConditions.
 */
export function buildUnknownSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'unknown',
    sourceLabel: 'Unknown source'
  }
}

/**
 * Build a ConditionInstance for a GM-applied condition.
 */
export function buildManualSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'manual',
    sourceLabel: 'GM applied'
  }
}
```

---

## Section C: Combatant Service Updates

### C.1: Update updateStatusConditions() signature

**File:** `app/server/services/combatant.service.ts`

Add an optional `source` parameter to `updateStatusConditions()`:

```typescript
import type { ConditionSourceType, ConditionInstance } from '~/types'
import { buildManualSourceInstance, buildUnknownSourceInstance } from '~/constants/conditionSourceRules'

/**
 * Source metadata for condition application.
 * If omitted, defaults to 'manual' source.
 */
export interface ConditionSource {
  type: ConditionSourceType
  label: string
}

export function updateStatusConditions(
  combatant: Combatant,
  addStatuses: StatusCondition[],
  removeStatuses: StatusCondition[],
  source?: ConditionSource  // NEW optional parameter
): StatusChangeResult & { stageChanges?: StageChangeResult } {
  // ... existing logic for entity.statusConditions unchanged ...

  // After adding to entity.statusConditions, also update conditionInstances
  if (!combatant.conditionInstances) {
    combatant.conditionInstances = []
  }

  // Add instances for newly added conditions
  for (const status of actuallyAdded) {
    const instance: ConditionInstance = source
      ? { condition: status, sourceType: source.type, sourceLabel: source.label }
      : buildManualSourceInstance(status)
    combatant.conditionInstances = [
      ...combatant.conditionInstances,
      instance
    ]
  }

  // Remove instances for removed conditions
  for (const status of actuallyRemoved) {
    combatant.conditionInstances = combatant.conditionInstances.filter(
      i => i.condition !== status
    )
  }

  // ... rest of existing logic (CS effects, etc.) unchanged ...
}
```

**Key constraint:** The `source` parameter is optional. All existing callers continue to work without modification. They default to 'manual' source.

### C.2: Update applyFaintStatus() for source-aware clearing

**File:** `app/server/services/combatant.service.ts`

Replace the current `applyFaintStatus()` implementation:

```typescript
import { shouldClearOnFaint } from '~/constants/conditionSourceRules'

/**
 * Apply Fainted status to a combatant, clearing conditions based on
 * both static flags and source-dependent rules (decree-047).
 *
 * For Persistent/Volatile: always clears on faint (PTU p.248).
 * For Other: consults the condition instance's source type (decree-047).
 *   - Move/ability/item sourced: clears (effect dissipates)
 *   - Terrain/weather/environment/manual: persists (source still active)
 *   - Unknown: uses static flag (clearsOnFaint: false, safe default)
 *
 * Also reverses CS effects for cleared conditions (decree-005).
 */
export function applyFaintStatus(combatant: Combatant): void {
  const entity = combatant.entity
  const currentConditions: StatusCondition[] = entity.statusConditions || []
  const instances = combatant.conditionInstances || []

  // Determine which conditions to clear
  const conditionsToKeep: StatusCondition[] = []
  const conditionsToRemove: StatusCondition[] = []

  for (const condition of currentConditions) {
    if (condition === 'Fainted') continue // Don't double-add

    // Find the matching instance for source lookup
    const instance = instances.find(i => i.condition === condition)
    if (shouldClearOnFaint(condition, instance)) {
      conditionsToRemove.push(condition)
    } else {
      conditionsToKeep.push(condition)
    }
  }

  // Reverse CS effects for cleared conditions (decree-005)
  for (const condition of conditionsToRemove) {
    reverseStatusCsEffects(combatant, condition)
  }

  // Update entity.statusConditions
  combatant.entity = {
    ...combatant.entity,
    statusConditions: ['Fainted', ...conditionsToKeep]
  }

  // Update conditionInstances: remove cleared, add Fainted
  combatant.conditionInstances = [
    { condition: 'Fainted', sourceType: 'system', sourceLabel: 'Fainted from damage' },
    ...instances.filter(i => !conditionsToRemove.includes(i.condition) && i.condition !== 'Fainted')
  ]
}
```

### C.3: Seed conditionInstances in buildCombatantFromEntity()

**File:** `app/server/services/combatant.service.ts`

In `buildCombatantFromEntity()`, after constructing the combatant, seed `conditionInstances` from entity's existing statusConditions:

```typescript
import { buildUnknownSourceInstance } from '~/constants/conditionSourceRules'

// In buildCombatantFromEntity(), after creating the combatant object:

// Seed conditionInstances from pre-existing entity conditions (decree-047)
// Pre-existing conditions get 'unknown' source (safe default: no clearing override)
const existingConditions: StatusCondition[] = entity.statusConditions || []
combatant.conditionInstances = existingConditions.map(c => buildUnknownSourceInstance(c))
```

This line should go after the `const combatant: Combatant = { ... }` block and before the `reapplyActiveStatusCsEffects(combatant)` call.

---

## Section D: Status Endpoint Update

### D.1: Accept source in status.post.ts

**File:** `app/server/api/encounters/[id]/status.post.ts`

Add source extraction from request body and pass through:

```typescript
// After existing validation, before calling updateStatusConditions:

// Extract optional source metadata (decree-047)
const conditionSource = body.source
  ? { type: body.source.type, label: body.source.label }
  : undefined

// Pass source to service
const statusResult = updateStatusConditions(combatant, addStatuses, removeStatuses, conditionSource)
```

The `ConditionSource` type is imported from `combatant.service.ts`.

Validation: `source.type` must be one of the valid `ConditionSourceType` values. `source.label` must be a non-empty string. Both are optional at the API level (the whole `source` object is optional).

---

## Section E: Faint Path Verification

All faint paths call `applyFaintStatus()` which is updated in C.2. No changes needed to the callers themselves:

| File | Faint Call | Change Needed |
|------|-----------|--------------|
| `damage.post.ts` L82-84 | `applyFaintStatus(combatant)` | None — uses updated function |
| `damage.post.ts` L161-163 | `applyDamageToEntity()` -> `applyFaintStatus()` | None — chain calls updated function |
| `move.post.ts` L127 | `applyFaintStatus(target)` | None |
| `next-turn.post.ts` L135 | `applyFaintStatus(currentCombatant)` | None |
| `next-turn.post.ts` L570 | `applyFaintStatus(newCurrent)` | None |
| `aoo-resolve.post.ts` L181 | `applyFaintStatus(trigger)` | None |
| `turn-helpers.ts` L350 | `applyFaintStatus(combatant)` | None |

All paths benefit from the source-aware clearing in the updated `applyFaintStatus()` without code changes. The source information lives on the combatant's `conditionInstances` array, which `applyFaintStatus()` reads.

---

## Section F: Encounter Serialization Compatibility

### F.1: conditionInstances in combatants JSON

The Encounter model stores combatants as a JSON string. The `conditionInstances` field is simply a new optional property on each combatant object in that JSON. No schema migration needed.

**Existing encounters** (before this change) have combatants without `conditionInstances`. When loaded, the field is `undefined`. All code paths handle this with `combatant.conditionInstances || []`.

### F.2: Entity DB sync unchanged

`syncEntityToDatabase()` and `syncDamageToDatabase()` sync `entity.statusConditions` (the flat array) to the Pokemon/HumanCharacter DB rows. This continues to work because `entity.statusConditions` is always kept in sync with the enriched `conditionInstances`.

---

## Section G: FAINT_CLEARED_CONDITIONS Array Update

### G.1: Keep FAINT_CLEARED_CONDITIONS for non-Other conditions

**File:** `app/constants/statusConditions.ts`

The existing `FAINT_CLEARED_CONDITIONS` array (derived from `clearsOnFaint` flags) remains valid for Persistent and Volatile conditions. It is no longer the sole authority for faint clearing — `applyFaintStatus()` now uses `shouldClearOnFaint()` which consults both the static flags and source rules.

However, `FAINT_CLEARED_CONDITIONS` should NOT be removed. It is still useful as a quick-check for "conditions that always clear on faint regardless of source" (i.e., Persistent + Volatile). It may be used by UI code or other contexts outside of the faint handler.

**Update the comment** on `FAINT_CLEARED_CONDITIONS` to clarify its scope:

```typescript
/**
 * Conditions that ALWAYS clear on faint (Persistent + Volatile).
 * Per decree-047: Other conditions are NOT in this list. Their faint-clearing
 * behavior is source-dependent and handled by shouldClearOnFaint() at runtime.
 * This array remains accurate for Persistent and Volatile conditions.
 */
export const FAINT_CLEARED_CONDITIONS: StatusCondition[] =
  ALL_CONDITION_DEFS.filter(d => d.clearsOnFaint).map(d => d.name)
```

---

## Implementation Order

1. **A.1 + A.2:** Add types (ConditionSourceType, ConditionInstance, Combatant field) — commit
2. **B.1:** Create conditionSourceRules.ts (SOURCE_CLEARING_RULES, shouldClearOnFaint, helpers) — commit
3. **C.3:** Seed conditionInstances in buildCombatantFromEntity() — commit
4. **C.1:** Update updateStatusConditions() with source parameter and conditionInstances sync — commit
5. **C.2:** Update applyFaintStatus() to use shouldClearOnFaint() — commit
6. **D.1:** Update status.post.ts to accept source in request body — commit
7. **G.1:** Update FAINT_CLEARED_CONDITIONS comment — commit

Each step is independently committable and testable. Step 5 is the critical behavioral change (source-aware faint clearing). Steps 1-4 are pure infrastructure with no behavior change.
