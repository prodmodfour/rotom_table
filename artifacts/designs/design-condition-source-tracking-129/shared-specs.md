# Shared Specifications

## Existing Code Analysis

### What Already Works

| Feature | Implementation | Files |
|---------|---------------|-------|
| Status condition tracking | `StatusCondition[]` on entity, add/remove via API | `status.post.ts`, `combatant.service.ts` |
| Per-condition behavior flags (decree-038) | `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint` | `statusConditions.ts` |
| Faint condition clearing | `applyFaintStatus()` uses `FAINT_CLEARED_CONDITIONS` | `combatant.service.ts` |
| CS source tracking (decree-005) | `StageSource[]` on Combatant for Burn/Paralysis/Poison CS | `combatant.service.ts` |
| Type immunity enforcement (decree-012) | Server-side rejection with GM override | `status.post.ts` |
| Other conditions faint default (decree-047) | `clearsOnFaint: false` for Stuck/Slowed/Trapped/Tripped/Vulnerable | `statusConditions.ts` |

### What Needs to Change

| Gap | Description | Primary File |
|-----|-------------|-------------|
| Source metadata | No record of what applied a condition | New type + `combatant.service.ts` |
| Source-aware faint clearing | `applyFaintStatus()` only checks static flags | `combatant.service.ts` |
| Condition application paths | 5+ code paths create conditions without source | `status.post.ts`, `breather.post.ts`, `next-turn.post.ts`, `healing-item.service.ts`, manual |
| Combatant storage | No `conditionInstances` field on Combatant | `encounter.ts` |
| Source-to-clearing rules | No mapping from source type to clearing behavior | New constants file |

### Condition Application Paths (audit)

All code paths that add or remove status conditions:

| Path | File | How Conditions Are Applied |
|------|------|---------------------------|
| **GM direct apply** | `status.post.ts` | `updateStatusConditions(combatant, addStatuses, removeStatuses)` |
| **Faint auto-clear** | `combatant.service.ts` `applyFaintStatus()` | Filters by `FAINT_CLEARED_CONDITIONS`, adds `'Fainted'` |
| **Damage faint** | `damage.post.ts` | Calls `applyFaintStatus()` or adds `'Dead'` directly |
| **Move faint** | `move.post.ts` | Calls `applyFaintStatus()` after move damage |
| **Tick damage faint** | `next-turn.post.ts` | Calls `applyFaintStatus()` after tick damage |
| **AoO faint** | `aoo-resolve.post.ts` | Calls `applyFaintStatus()` after AoO damage |
| **Heavily injured faint** | `damage.post.ts` | Calls `applyFaintStatus()` when penalty reduces HP to 0 |
| **Breather conditions** | `breather.post.ts` | Adds Tripped/Vulnerable as `tempConditions` (separate path) |
| **Healing item cure** | `healing-item.service.ts` | `updateStatusConditions(target, [], conditionsToCure)` |
| **Recall clearing** | `switching.service.ts` `applyRecallSideEffects()` | Filters by `RECALL_CLEARED_CONDITIONS` on DB record |
| **Encounter end** | `end.post.ts` | Filters by `ENCOUNTER_END_CLEARED_CONDITIONS` |
| **Death** | `damage.post.ts` | Adds `'Dead'` directly to statusConditions |
| **Revive** | `healing-item.service.ts` | Removes `'Fainted'` |
| **Pokemon Center** | `pokemon-center.post.ts` | Sets `statusConditions` to `[]` |

---

## Data Models

### ConditionSourceType (discriminated union tag)

```typescript
/**
 * Classification of what applied a condition.
 * Used to look up clearing behavior in SOURCE_CLEARING_RULES.
 *
 * Per decree-047: source determines whether Other conditions clear on faint.
 */
export type ConditionSourceType =
  | 'move'        // Applied by a move effect (e.g., Thunder Wave -> Paralysis)
  | 'ability'     // Applied by an ability (e.g., Effect Spore -> Poisoned)
  | 'terrain'     // Applied by terrain (e.g., Grassy Terrain -> Stuck)
  | 'weather'     // Applied by weather effect
  | 'item'        // Applied by an item
  | 'environment' // Applied by environment preset effect
  | 'manual'      // GM manually applied (no specific game source)
  | 'system'      // Applied by system automation (faint, breather penalties)
  | 'unknown'     // Source not recorded (backward compat for pre-existing conditions)
```

### ConditionInstance

```typescript
/**
 * An applied condition with source metadata.
 * Lives on Combatant.conditionInstances[] (combat-scoped).
 *
 * Per decree-047: source determines clearing behavior for Other conditions.
 * Per decree-038: condition behaviors are per-condition, but for Other
 * conditions, per-instance source can override the static flags.
 */
export interface ConditionInstance {
  /** The status condition name */
  condition: StatusCondition
  /** What type of game element applied this condition */
  sourceType: ConditionSourceType
  /** Human-readable description of the source (e.g., "Thunder Wave", "Effect Spore", "Lava terrain") */
  sourceLabel: string
  /** Combat round when this condition was applied (for duration tracking, future use) */
  appliedRound?: number
}
```

### Combatant Extension

```typescript
// Added to Combatant interface in encounter.ts

/**
 * Source-tracked condition instances (decree-047).
 * Combat-scoped: populated when combatant enters encounter,
 * consumed by clearing logic during combat.
 * Kept in sync with entity.statusConditions (the flat string array).
 */
conditionInstances?: ConditionInstance[]
```

### Source Clearing Rules

```typescript
/**
 * Per-source clearing behavior overrides for Other category conditions.
 *
 * For Persistent/Volatile conditions, clearing is always per the static
 * condition def flags (they clear on faint regardless of source).
 *
 * For Other conditions, the source type determines whether the condition
 * clears on faint, since the static default is clearsOnFaint: false (decree-047).
 *
 * A source type not listed here falls back to the static condition def flags.
 */
export const SOURCE_CLEARING_RULES: Record<ConditionSourceType, Partial<ConditionClearingOverrides>> = {
  'move':        { clearsOnFaint: true },   // Move effect gone when target faints
  'ability':     { clearsOnFaint: true },    // Ability effect typically gone on faint
  'terrain':     { clearsOnFaint: false },   // Terrain persists — condition returns on revive
  'weather':     { clearsOnFaint: false },   // Weather persists
  'item':        { clearsOnFaint: true },    // Item effect typically combat-scoped
  'environment': { clearsOnFaint: false },   // Environment preset persists
  'manual':      { clearsOnFaint: false },   // GM-applied: conservative default, GM removes manually
  'system':      { clearsOnFaint: false },   // System-applied (breather Tripped/Vulnerable): keep static flag
  'unknown':     {}                          // No override — use static condition def flags
}

export interface ConditionClearingOverrides {
  clearsOnFaint: boolean
  // Future extensions:
  // clearsOnRecall: boolean
  // clearsOnEncounterEnd: boolean
}
```

### Faint Clearing Decision Function

```typescript
/**
 * Determine whether a specific condition instance should be cleared on faint.
 *
 * Logic:
 * 1. Look up the condition's static definition (decree-038 behavior flags).
 * 2. If the condition's category is NOT 'other', use the static clearsOnFaint flag.
 *    (Persistent/Volatile always clear on faint per PTU p.248.)
 * 3. If the condition IS 'other' and has a source, check SOURCE_CLEARING_RULES.
 *    If the source has a clearsOnFaint override, use it.
 * 4. Otherwise, fall back to the static condition def flag (clearsOnFaint: false for Other).
 */
export function shouldClearOnFaint(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Persistent and Volatile: always use static flag (they clear on faint per RAW)
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

  // Fallback: static condition def flag (clearsOnFaint: false for Other per decree-047)
  return def.clearsOnFaint
}
```

---

## API Contract Changes

### POST `/api/encounters/:id/status` (modified)

**New optional field in request body:**

```typescript
{
  combatantId: string
  add?: StatusCondition[]
  remove?: StatusCondition[]
  override?: boolean
  // NEW: optional source metadata for added conditions
  source?: {
    type: ConditionSourceType   // e.g., 'move', 'ability', 'manual'
    label: string               // e.g., 'Thunder Wave', 'Effect Spore'
  }
}
```

**Behavior:**
- If `source` is provided, added conditions get that source in conditionInstances
- If `source` is omitted, added conditions get `{ type: 'manual', label: 'GM applied' }`
- Removed conditions are removed from both `entity.statusConditions` and `combatant.conditionInstances`

### POST `/api/encounters/:id/status` response (unchanged)

The response `statusChange.current` remains `StatusCondition[]` for backward compatibility. A new optional field exposes source-enriched data:

```typescript
{
  success: true
  data: Encounter
  statusChange: {
    combatantId: string
    added: StatusCondition[]
    removed: StatusCondition[]
    current: StatusCondition[]
    // NEW: source-enriched view (P1, optional)
    instances?: ConditionInstance[]
  }
}
```

---

## Sync Strategy

### Condition application flow

```
1. API receives request to add condition (e.g., status.post.ts)
2. Create ConditionInstance with source metadata
3. Add to combatant.conditionInstances[]
4. Also add condition name to entity.statusConditions[] (backward compat)
5. Persist: encounter combatants JSON includes conditionInstances
6. Persist: entity DB row gets flat statusConditions via syncEntityToDatabase()
```

### Condition removal flow

```
1. API receives request to remove condition
2. Remove from combatant.conditionInstances[] (by condition name)
3. Also remove from entity.statusConditions[]
4. Persist both
```

### Faint clearing flow (source-aware)

```
1. Combatant HP reaches 0
2. applyFaintStatus() is called
3. For each condition on the combatant:
   a. Look up the ConditionInstance in conditionInstances[]
   b. Call shouldClearOnFaint(condition, instance)
   c. If true: add to clear list
   d. If false: keep
4. Clear the conditions in the clear list
5. Add 'Fainted' condition
6. Reverse CS effects for cleared conditions (decree-005)
7. Update both entity.statusConditions and combatant.conditionInstances
```

### Combat entry seeding

```
1. buildCombatantFromEntity() creates a new Combatant
2. Read entity.statusConditions (from DB record)
3. Seed conditionInstances with source='unknown' for each pre-existing condition
4. These 'unknown'-sourced conditions use static flag fallback (clearsOnFaint: false for Other)
```

---

## Files Changed Summary (All Tiers)

### P0 (Source tracking data model + faint clearing)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/constants/conditionSourceRules.ts` | ConditionSourceType, SOURCE_CLEARING_RULES, shouldClearOnFaint(), ConditionClearingOverrides |
| **EDIT** | `app/types/combat.ts` | Add ConditionInstance interface |
| **EDIT** | `app/types/encounter.ts` | Add conditionInstances? to Combatant |
| **EDIT** | `app/server/services/combatant.service.ts` | Update applyFaintStatus() for source-aware clearing; update updateStatusConditions() to accept source; add addConditionInstance/removeConditionInstance helpers; seed conditionInstances in buildCombatantFromEntity() |
| **EDIT** | `app/server/api/encounters/[id]/status.post.ts` | Accept optional source in request body, pass to service |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` | Pass source through faint path (no change if using applyFaintStatus) |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | No direct change needed (calls applyFaintStatus) |
| **EDIT** | `app/server/api/encounters/[id]/move.post.ts` | No direct change needed (calls applyFaintStatus) |
| **EDIT** | `app/server/api/encounters/[id]/aoo-resolve.post.ts` | No direct change needed (calls applyFaintStatus) |
| **EDIT** | `app/constants/statusConditions.ts` | Re-export ConditionSourceType for convenience |

### P1 (UI + extended source-based clearing)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/server/api/encounters/[id]/end.post.ts` | Source-based encounter-end clearing for Other conditions |
| **EDIT** | `app/server/services/switching.service.ts` | Source-based recall clearing for Other conditions |
| **EDIT** | `app/server/api/encounters/[id]/breather.post.ts` | Source-based breather clearing for Other conditions |
| **EDIT** | UI components (encounter status display) | Show source label next to Other conditions |
| **EDIT** | `app/stores/encounter.ts` | Pass source metadata through store actions |
| **EDIT** | `app/constants/conditionSourceRules.ts` | Add clearsOnRecall, clearsOnEncounterEnd overrides to rules |

---

## Backward Compatibility Strategy

### Reading conditions

All existing code that reads `entity.statusConditions` as `StatusCondition[]` continues to work unchanged. The flat array is always kept in sync with the enriched `conditionInstances`.

### Writing conditions

Code that adds/removes conditions via `updateStatusConditions()` continues to work. The `source` parameter is optional with a default of `{ type: 'manual', label: 'GM applied' }`.

### Serialization

`conditionInstances` is stored in the encounter's combatants JSON (which is already a denormalized blob). No schema migration needed for the Encounter model. The Pokemon/HumanCharacter DB rows continue to store flat `statusConditions` JSON arrays.

### Gradual adoption

- P0 adds the infrastructure and makes faint clearing source-aware
- P1 extends to other clearing events and UI
- Condition application paths can be updated incrementally to provide source metadata
- Paths that don't provide source default to 'manual' (safe default)
