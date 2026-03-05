# Testing Strategy

## Unit Tests (P0 -- Source Tracking Infrastructure + Faint Clearing)

### `app/tests/unit/constants/conditionSourceRules.test.ts`

#### shouldClearOnFaint()

**Persistent/Volatile conditions (always clear regardless of source):**
- Burned with 'move' source: returns true
- Burned with 'terrain' source: returns true (source irrelevant for persistent)
- Burned with 'unknown' source: returns true
- Burned with no instance: returns true
- Paralyzed with 'ability' source: returns true
- Asleep with 'move' source: returns true
- Confused with 'manual' source: returns true

**Other conditions with source overrides:**
- Stuck with 'move' source: returns true (move effect dissipates)
- Stuck with 'ability' source: returns true
- Stuck with 'item' source: returns true
- Stuck with 'terrain' source: returns false (terrain persists)
- Stuck with 'weather' source: returns false
- Stuck with 'environment' source: returns false
- Stuck with 'manual' source: returns false (GM controls removal)
- Stuck with 'system' source: returns false
- Stuck with 'unknown' source: returns false (safe default)
- Stuck with no instance: returns false (static flag fallback)
- Slowed with 'move' source: returns true
- Slowed with 'terrain' source: returns false
- Trapped with 'move' source: returns true
- Trapped with 'environment' source: returns false
- Tripped with 'move' source: returns true
- Tripped with 'manual' source: returns false
- Vulnerable with 'ability' source: returns true
- Vulnerable with 'unknown' source: returns false

**Fainted/Dead (never clear on faint):**
- Fainted with any source: returns false (static clearsOnFaint: false)
- Dead with any source: returns false

#### SOURCE_CLEARING_RULES constant
- Has entries for all ConditionSourceType values
- 'move' has clearsOnFaint: true
- 'terrain' has clearsOnFaint: false
- 'unknown' has empty overrides
- Every source type key is a valid ConditionSourceType

#### buildUnknownSourceInstance()
- Returns ConditionInstance with sourceType 'unknown'
- Returns instance with matching condition name
- Returns instance with non-empty sourceLabel

#### buildManualSourceInstance()
- Returns ConditionInstance with sourceType 'manual'
- Returns instance with matching condition name

---

### `app/tests/unit/services/combatant-source-tracking.test.ts`

#### updateStatusConditions() with source parameter

**Adding conditions with source:**
- Add Stuck with move source: conditionInstances includes entry with sourceType 'move'
- Add Burned with ability source: conditionInstances includes entry with sourceType 'ability'
- Add condition without source: defaults to 'manual' in conditionInstances
- Add multiple conditions with same source: each gets separate instance
- Adding duplicate condition: original source preserved, no new instance

**Removing conditions:**
- Remove Stuck: removed from both statusConditions and conditionInstances
- Remove condition that has no instance: no error (defensive)
- Remove then re-add with different source: new source recorded

**conditionInstances sync with statusConditions:**
- After add: conditionInstances.length matches new conditions added
- After remove: conditionInstances.length matches conditions removed
- conditionInstances condition names always match statusConditions names

#### applyFaintStatus() with source-aware clearing

**Persistent/Volatile conditions cleared:**
- Burned Pokemon faints: Burned cleared (regardless of conditionInstances)
- Paralyzed + Stuck(move) Pokemon faints: Paralyzed cleared, Stuck cleared (move source)
- Asleep + Slowed(terrain) Pokemon faints: Asleep cleared, Slowed kept (terrain source)

**Other conditions with various sources:**
- Stuck(move) on faint: cleared
- Stuck(terrain) on faint: persists
- Stuck(unknown) on faint: persists (safe default)
- Vulnerable(ability) on faint: cleared
- Slowed(environment) on faint: persists
- Trapped(move) on faint: cleared
- Tripped(manual) on faint: persists

**CS effects on source-aware faint:**
- Burned + Stuck(move): both cleared, Burn CS effect reversed, Fainted added
- Poisoned + Slowed(terrain): Poisoned cleared (CS reversed), Slowed kept, Fainted added

**conditionInstances after faint:**
- Cleared conditions removed from conditionInstances
- Surviving conditions remain in conditionInstances
- 'Fainted' added to conditionInstances with 'system' source

**Edge case: no conditionInstances (backward compat):**
- Combatant with no conditionInstances field: falls back to static flags
- All Persistent/Volatile cleared, all Other kept (safe default)

#### buildCombatantFromEntity() conditionInstances seeding

- Pokemon with no conditions: conditionInstances is empty array
- Pokemon with Burned: conditionInstances has 1 entry with 'unknown' source
- Pokemon with Burned + Stuck: conditionInstances has 2 entries, both 'unknown'
- conditionInstances conditions match entity.statusConditions
- Each seeded instance has sourceLabel 'Unknown source'

---

### `app/tests/unit/types/condition-instance.test.ts`

#### ConditionInstance type shape
- Interface includes condition, sourceType, sourceLabel, appliedRound fields
- sourceType is a valid ConditionSourceType value
- condition is a valid StatusCondition value

#### Combatant with conditionInstances
- conditionInstances is optional on Combatant (backward compat)
- conditionInstances can hold multiple entries
- conditionInstances survives JSON round-trip (serialization)

---

## Unit Tests (P1 -- Extended Clearing + UI)

### `app/tests/unit/constants/conditionSourceRules-recall.test.ts`

#### shouldClearOnRecall()
- Confused (volatile) with 'move' source: returns true (static flag)
- Confused (volatile) with 'terrain' source: returns true (volatile always clears)
- Stuck with 'move' source: returns true (move override)
- Stuck with 'terrain' source: returns false (terrain override)
- Stuck with 'unknown' source: returns true (static flag clearsOnRecall: true)
- Trapped with any source: returns false (static clearsOnRecall: false per PTU)
- Burned (persistent) with any source: returns false (persistent never clears on recall)

#### shouldClearOnEncounterEnd()
- Stuck with 'move' source: returns true
- Stuck with 'environment' source: returns false (environment may persist beyond encounter)
- Stuck with 'terrain' source: returns true (terrain is encounter-scoped)
- Burned with 'move' source: returns false (persistent never clears on encounter end)

### `app/tests/unit/services/recall-source-tracking.test.ts`

#### applyRecallSideEffects() with conditionInstances
- Recall Pokemon with Stuck(move): Stuck cleared from DB
- Recall Pokemon with Stuck(terrain): Stuck persists in DB
- Recall Pokemon with Confused + Stuck(move): both cleared (Confused by flag, Stuck by source)
- Recall Pokemon with no conditionInstances: uses static flags (backward compat)

### `app/tests/unit/api/encounter-end-source-tracking.test.ts`

#### clearEncounterEndConditions() with instances
- Confused + Stuck(move): both cleared
- Stuck(environment): Stuck persists
- Multiple Other conditions with mixed sources: correct subset cleared

### `app/tests/unit/utils/format-condition-display.test.ts`

#### formatConditionDisplay()
- Burned (persistent): returns "Burned" (no source shown)
- Stuck with move source: returns "Stuck (Thunder Wave)"
- Stuck with manual source: returns "Stuck" (no source for GM-applied)
- Stuck with unknown source: returns "Stuck (source unknown)"
- Slowed with terrain source: returns "Slowed (Grassy Terrain)"
- Condition with no instances array: returns condition name only

---

## Integration Tests

### Source-Aware Faint Clearing Flow

1. Create encounter, add Pokemon with Stuck(move source) + Burned
2. Apply lethal damage -> Pokemon faints
3. Verify Burned cleared (persistent always clears)
4. Verify Stuck cleared (move source -> clearsOnFaint: true)
5. Verify Fainted added
6. Verify conditionInstances updated

### Source-Dependent Faint Persistence Flow

1. Create encounter, add Pokemon with Stuck(terrain source)
2. Apply lethal damage -> Pokemon faints
3. Verify Stuck persists (terrain source -> clearsOnFaint: false)
4. Verify Fainted added alongside Stuck

### Pre-Existing Conditions Combat Entry Flow

1. Create Pokemon with Stuck in DB (no source metadata)
2. Add to encounter
3. Verify conditionInstances has Stuck with 'unknown' source
4. Apply lethal damage -> Pokemon faints
5. Verify Stuck persists (unknown source -> static flag false)

### Source Propagation via status.post.ts

1. Create encounter, add Pokemon
2. POST status with add=["Stuck"] and source={ type: "move", label: "Rock Tomb" }
3. Verify combatant.conditionInstances has Stuck with move source
4. Apply lethal damage -> Pokemon faints
5. Verify Stuck cleared (move source)

### Backward Compatibility Flow

1. Load existing encounter (combatants without conditionInstances field)
2. Apply faint to combatant
3. Verify no errors (conditionInstances || [] handles undefined)
4. Verify clearing uses static flags only

---

## Manual Testing Checklist

### P0 -- Source Tracking + Faint Clearing

- [ ] Apply Stuck via status endpoint with source={type:'move', label:'Rock Tomb'}
- [ ] Verify combatant JSON includes conditionInstances with move source
- [ ] Apply lethal damage -- verify Stuck is cleared on faint (move source)
- [ ] Apply Stuck via status endpoint with source={type:'terrain', label:'Lava'}
- [ ] Apply lethal damage -- verify Stuck persists through faint (terrain source)
- [ ] Apply Stuck via status endpoint with no source
- [ ] Apply lethal damage -- verify Stuck persists (manual default, clearsOnFaint: false)
- [ ] Add Pokemon with pre-existing Burned to encounter
- [ ] Faint -- verify Burned cleared (persistent always clears)
- [ ] Add Pokemon with pre-existing Stuck to encounter
- [ ] Faint -- verify Stuck persists (unknown source, safe default)
- [ ] Verify CS effects (Burn -2 Def) still properly reversed on faint
- [ ] Verify existing encounters without conditionInstances still work
- [ ] Verify move log entries unchanged
- [ ] Verify WebSocket events unchanged

### P1 -- Extended Clearing + UI

- [ ] GM view shows "(Rock Tomb)" next to move-sourced Stuck
- [ ] GM view shows "(source unknown)" for pre-existing conditions
- [ ] GM-applied conditions show no source annotation
- [ ] Recall Pokemon with move-sourced Stuck: Stuck cleared
- [ ] Recall Pokemon with terrain-sourced Stuck: Stuck persists
- [ ] End encounter with move-sourced conditions: cleared
- [ ] End encounter with environment-sourced conditions: persist
- [ ] Revive fainted Pokemon: Fainted removed from conditionInstances
- [ ] Death condition added to conditionInstances with system source

---

## Test Infrastructure Notes

### Mocking condition instances

Test helpers should support creating combatants with pre-configured conditionInstances:

```typescript
// app/tests/helpers/condition-instance-factory.ts

import type { ConditionInstance, StatusCondition, ConditionSourceType } from '~/types'

export function createTestInstance(
  condition: StatusCondition,
  sourceType: ConditionSourceType = 'unknown',
  sourceLabel: string = 'Test source'
): ConditionInstance {
  return { condition, sourceType, sourceLabel }
}

/**
 * Create a test combatant with conditions and matching instances.
 * Keeps entity.statusConditions and conditionInstances in sync.
 */
export function withConditionInstances(
  combatant: Combatant,
  instances: ConditionInstance[]
): Combatant {
  return {
    ...combatant,
    conditionInstances: instances,
    entity: {
      ...combatant.entity,
      statusConditions: instances.map(i => i.condition)
    }
  }
}
```

### Testing shouldClearOnFaint() exhaustively

The test should cover every combination of:
- 3 condition categories (persistent, volatile, other)
- 9 source types
- Plus the "no instance" case

For persistent/volatile, all source types should return the same result (static flag).
For other, source type determines the result per SOURCE_CLEARING_RULES.

This matrix can be generated programmatically:

```typescript
const OTHER_CONDITIONS: StatusCondition[] = ['Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable']
const ALL_SOURCES: ConditionSourceType[] = [
  'move', 'ability', 'terrain', 'weather', 'item', 'environment', 'manual', 'system', 'unknown'
]

describe('shouldClearOnFaint matrix', () => {
  for (const condition of OTHER_CONDITIONS) {
    for (const source of ALL_SOURCES) {
      const expected = SOURCE_CLEARING_RULES[source].clearsOnFaint ?? false
      it(`${condition} + ${source} -> ${expected}`, () => {
        const instance = createTestInstance(condition, source)
        expect(shouldClearOnFaint(condition, instance)).toBe(expected)
      })
    }
  }
})
```
