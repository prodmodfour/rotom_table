# Testing Strategy

## Unit Tests (P0 — Tick Damage)

### `app/tests/unit/services/status-automation.test.ts`

#### calculateTickDamage()
- Returns floor(maxHp / 10) for normal values (e.g., maxHp 70 -> 7)
- Returns 1 for very low maxHp (e.g., maxHp 5 -> 1)
- Returns 1 for maxHp < 10 (minimum 1)
- Returns correct value for large maxHp (e.g., maxHp 150 -> 15)

#### calculateBadlyPoisonedDamage()
- Round 1: returns 5
- Round 2: returns 10
- Round 3: returns 20
- Round 4: returns 40
- Round 5: returns 80
- Round 0 (edge): returns 5 (treated as round 1 via max(0, round-1))

#### getTickDamageEntries()
- Burned combatant: returns 1 entry with 1 tick damage
- Poisoned combatant: returns 1 entry with 1 tick damage
- Badly Poisoned combatant round 1: returns 1 entry with 5 damage
- Badly Poisoned combatant round 3: returns 1 entry with 20 damage
- Burned + Poisoned combatant: returns 2 entries (both apply)
- Burned + Badly Poisoned: returns 2 entries (Burn tick + BP escalation)
- Poisoned + Badly Poisoned: returns only Badly Poisoned entry (BP supersedes P)
- Cursed + standardActionTaken=true: returns 1 entry with 2 ticks
- Cursed + standardActionTaken=false: returns 0 entries
- Fainted combatant (HP=0): returns 0 entries regardless of statuses
- No tick conditions: returns empty array
- Burned + Cursed + standardActionTaken=true: returns 2 entries

### `app/tests/unit/api/next-turn-tick-damage.test.ts`

#### Tick damage integration in next-turn
- Burned combatant loses 1 tick HP after next-turn
- Poisoned combatant loses 1 tick HP after next-turn
- Badly Poisoned combatant loses escalating damage after next-turn
- Badly Poisoned escalation counter increments each turn
- Cursed combatant loses 2 ticks when Standard Action was used
- Cursed combatant loses 0 when no Standard Action was used
- Tick damage synced to database (HP, injuries, status)
- Tick damage added to moveLog
- Tick damage included in API response (`tickDamage` field)
- Multiple tick sources stack (Burn + Poison = 2 ticks)
- Tick damage can cause injuries (crosses HP marker)
- Tick damage can cause faint (reaches 0 HP)
- Faint from tick damage clears all Persistent/Volatile conditions
- Second tick source skipped after first causes faint
- No tick damage during League Battle declaration phase
- Tick damage fires during League Battle resolution phase
- Temporary HP absorbs tick damage first

### `app/tests/unit/types/combatant-badly-poisoned.test.ts`

- Combatant builder initializes badlyPoisonedRound to 0
- Adding Badly Poisoned sets badlyPoisonedRound to 1
- Removing Badly Poisoned resets badlyPoisonedRound to 0
- badlyPoisonedRound persists in combatants JSON serialization

---

## Unit Tests (P1 — Save Checks)

### `app/tests/unit/services/save-checks.test.ts`

#### evaluateSaveCheck() — Frozen
- Roll >= 16: cured
- Roll < 16: cannot act
- Fire-type Pokemon: DC lowered to 11
- Sunny weather: +4 bonus (effective DC 12)
- Hail weather: -2 penalty (effective DC 18)
- Fire-type + Sunny: effective DC 7
- Fire-type + Hail: effective DC 13
- Neutral weather (Rain, None): no modifier

#### evaluateSaveCheck() — Paralysis
- Roll >= 5: can act
- Roll < 5: cannot take Standard/Shift/Swift actions
- Roll exactly 5: passes
- Roll exactly 4: fails

#### evaluateSaveCheck() — Sleep
- Roll >= 16: cured (wakes up)
- Roll < 16: cannot act (stays asleep)

#### evaluateSaveCheck() — Confused
- Roll 1-8: self-hit with DB 6 Struggle damage
- Roll 9-15: can act normally
- Roll 16-20: cured of confusion
- Roll exactly 8: self-hit (boundary)
- Roll exactly 9: act normally (boundary)
- Roll exactly 15: act normally (boundary)
- Roll exactly 16: cured (boundary)

#### evaluateSaveCheck() — Infatuated
- Roll 1-10: restricted (can't target infatuator)
- Roll 11-18: unrestricted
- Roll 19-20: cured

#### evaluateSaveCheck() — Enraged
- Roll >= 15: cured
- Roll < 15: must use damaging move

#### calculateConfusedSelfHit()
- Uses combatant's own Attack vs own Defense
- Applies combat stages to both Attack and Defense
- Base DB 6 set damage from chart
- Applies 0.5x multiplier (resisted 1 step)
- Minimum 1 damage
- Works for Pokemon entities
- Works for Human entities

#### getPendingSaveChecks()
- Returns Paralyzed/Confused/Infatuated for turn_start timing
- Returns Frozen/Asleep/Enraged for turn_end timing
- Returns empty array when no matching conditions
- Returns multiple conditions when combatant has several

### `app/tests/unit/api/save-check.test.ts`

#### POST /api/encounters/:id/save-check endpoint
- Returns save check result with roll, dc, passed, effect
- Cured effect removes condition from combatant
- Cannot_act effect updates combatant turnState
- Self_hit effect applies damage to combatant
- Self_hit damage can cause injuries
- Self_hit damage can cause faint
- Rejects combatant without the specified condition
- Rejects condition with no save check mechanic (e.g., Stuck)
- Bad Sleep: 2 ticks damage on each Sleep save check (pass or fail)
- Bad Sleep damage applied before Sleep cure if save passes
- Encounter state updated and returned

### `app/tests/unit/api/next-turn-end-saves.test.ts`

#### End-of-turn save checks in next-turn
- Frozen combatant gets auto-save at turn end
- Frozen save pass: condition removed
- Frozen save fail: condition persists
- Sleep save at turn end
- Sleep save pass: Sleep and Bad Sleep both removed
- Sleep save fail: stays asleep
- Bad Sleep: 2 ticks HP loss on each Sleep save (pass or fail)
- Enraged save at turn end
- End-of-turn saves included in API response
- End-of-turn saves logged to moveLog
- Multiple end-of-turn saves processed (Frozen + Enraged)

### `app/tests/unit/stores/encounter-save-check.test.ts`

- rollSaveCheck action calls correct API endpoint
- rollSaveCheck returns SaveCheckResult
- rollSaveCheck updates encounter state
- rollSaveCheck throws on API error

---

## Unit Tests (P2 — Auto-Cure)

### `app/tests/unit/auto-cure/fire-thaw.test.ts`

- Frozen target hit by Fire move: Frozen cured
- Frozen target hit by Fighting move: Frozen cured
- Frozen target hit by Rock move: Frozen cured
- Frozen target hit by Steel move: Frozen cured
- Frozen target hit by Water move: Frozen NOT cured
- Non-frozen target hit by Fire move: no effect
- Frozen target that faints from Fire move: faint-clear handles it (no double-remove)
- Fire thaw works for ally attacks (same side)

### `app/tests/unit/auto-cure/wake-on-damage.test.ts`

- Sleeping target hit by attack: wakes up (Sleep removed)
- Sleeping target with Bad Sleep: both Sleep and Bad Sleep removed
- Sleeping target receives tick damage: does NOT wake up
- Sleeping target that faints from attack: faint-clear handles it
- Non-sleeping target hit by attack: no Sleep cure
- Wake on damage from multi-target move: only sleeping targets wake

### `app/tests/unit/auto-cure/bad-sleep-cascade.test.ts`

- Removing Sleep also removes Bad Sleep (via updateStatusConditions)
- Removing Bad Sleep alone does NOT remove Sleep
- Adding Sleep does not require Bad Sleep
- Bad Sleep cannot be applied without Sleep

### `app/tests/unit/constants/status-automation-constants.test.ts`

- FROZEN_THAW_TYPES contains Fire, Fighting, Rock, Steel
- WEATHER_SAVE_MODIFIERS contains Sunny +4 for Frozen
- WEATHER_SAVE_MODIFIERS contains Hail -2 for Frozen
- STATUS_INTERACTION_ABILITIES includes Guts, Marvel Scale, Shed Skin
- TICK_DAMAGE_CONDITIONS contains Burned, Poisoned, Badly Poisoned, Cursed

### `app/tests/unit/composables/useStatusAbilityWarning.test.ts`

- Returns warning for Pokemon with Guts when Burned
- Returns warning for Pokemon with Marvel Scale when any Persistent
- Returns empty for Pokemon without relevant abilities
- Returns empty for non-Pokemon combatants
- Returns multiple warnings if Pokemon has multiple relevant abilities

---

## Integration Tests

### Full Status Automation Round Flow
1. Create encounter, add combatant with Burn
2. Start encounter, take first turn
3. Click Next Turn
4. Verify combatant lost 1 tick HP (from Burn tick)
5. Verify moveLog has Burn Tick entry
6. Verify API response includes tickDamage

### Badly Poisoned Escalation Flow
1. Add Badly Poisoned to combatant
2. Process 3 turns
3. Verify damage: 5, 10, 20
4. Cure Badly Poisoned
5. Re-apply Badly Poisoned
6. Verify escalation resets to 5

### Save Check Flow
1. Add Paralysis to combatant
2. Call save-check endpoint
3. Verify d20 roll returned
4. If failed: verify turnState shows all actions prevented
5. If passed: verify combatant can act normally

### Confused Self-Hit Flow
1. Add Confused to combatant
2. Call save-check with mocked low roll (1-8)
3. Verify self-hit damage applied
4. Verify HP reduced by DB 6 Struggle damage * 0.5x
5. Verify moveLog entry for self-hit

### Fire Thaw Flow
1. Add Frozen to combatant
2. Apply Fire-type move damage to combatant
3. Verify Frozen is auto-cured
4. Verify moveLog entry for auto-cure

### Wake on Damage Flow
1. Add Sleep to combatant
2. Apply attack damage to combatant
3. Verify Sleep is auto-cured
4. Apply Burn tick damage to another sleeping combatant
5. Verify Sleep is NOT cured (passive source)

---

## Manual Testing Checklist

### P0 — Tick Damage
- [ ] Burn a Pokemon, advance turn — verify HP drops by 1 tick
- [ ] Poison a Pokemon, advance turn — verify HP drops by 1 tick
- [ ] Badly Poison a Pokemon, advance 3 turns — verify escalating damage (5, 10, 20)
- [ ] Curse a Pokemon that uses a Standard Action — verify 2 ticks damage
- [ ] Curse a Pokemon that was prevented from Standard Action — verify NO tick damage
- [ ] Burn + Poison on same target — verify both ticks apply
- [ ] Tick damage causes faint — verify conditions cleared
- [ ] Tick damage crosses HP marker — verify injury gained
- [ ] Move log shows tick damage entries
- [ ] Group View receives tick damage events via WebSocket

### P1 — Save Checks
- [ ] Paralyzed Pokemon: roll save at turn start — DC 5
- [ ] Paralysis save fail: action buttons disabled
- [ ] Paralysis save pass: Pokemon can act normally
- [ ] Confused Pokemon: roll save at turn start
- [ ] Confusion roll 1-8: self-hit applied, turn ends
- [ ] Confusion roll 9-15: Pokemon acts normally
- [ ] Confusion roll 16+: Confusion cured
- [ ] Frozen Pokemon: save auto-rolls at turn end — DC 16
- [ ] Frozen Fire-type: save DC 11
- [ ] Frozen save in Sunny: +4 bonus visible
- [ ] Frozen save in Hail: -2 penalty visible
- [ ] Sleeping Pokemon: save auto-rolls at turn end — DC 16
- [ ] Sleep + Bad Sleep: 2 ticks damage on save check
- [ ] Sleep save pass: both Sleep and Bad Sleep cured
- [ ] Infatuated Pokemon: roll save at turn start
- [ ] Enraged Pokemon: save auto-rolls at turn end — DC 15
- [ ] SaveCheckBanner visible when combatant has pending checks
- [ ] SaveCheckResult shows roll, DC, and outcome

### P2 — Auto-Cure
- [ ] Hit Frozen Pokemon with Fire move — Frozen auto-cured
- [ ] Hit Frozen Pokemon with Fighting/Rock/Steel — Frozen auto-cured
- [ ] Hit Frozen Pokemon with Water move — Frozen NOT cured
- [ ] Hit Sleeping Pokemon with attack — Sleep auto-cured
- [ ] Sleeping Pokemon takes Burn tick — Sleep NOT cured
- [ ] Bad Sleep auto-removed when Sleep is cured
- [ ] Ability warning shown when applying Burn to Guts Pokemon
- [ ] Ability warning shown when applying any Persistent to Marvel Scale Pokemon

---

## Test Infrastructure Notes

### Mocking dice rolls
The `rollDie()` function from `diceRoller.ts` must be mockable for deterministic save check tests. In tests, use `vi.mock('~/utils/diceRoller')` to control the d20 result.

### Test combatant factory
Create a test helper that builds a minimal Combatant with configurable status conditions, HP, types, and abilities. Reusable across all test files in this feature.

```typescript
// app/tests/helpers/combatant-factory.ts
export function createTestCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'test-combatant-1',
    type: 'pokemon',
    entityId: 'test-entity-1',
    side: 'players',
    initiative: 10,
    initiativeBonus: 0,
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    },
    injuries: { count: 0, sources: [] },
    stageSources: [],
    badlyPoisonedRound: 0,
    physicalEvasion: 2,
    specialEvasion: 2,
    speedEvasion: 2,
    tokenSize: 1,
    entity: {
      id: 'test-entity-1',
      species: 'Pikachu',
      nickname: null,
      level: 20,
      types: ['Electric'],
      currentHp: 50,
      maxHp: 50,
      temporaryHp: 0,
      injuries: 0,
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
      },
      currentStats: {
        hp: 50, attack: 15, defense: 10,
        specialAttack: 20, specialDefense: 10, speed: 25
      },
      baseStats: {
        hp: 7, attack: 11, defense: 6,
        specialAttack: 10, specialDefense: 6, speed: 18
      },
      abilities: [{ name: 'Static', description: '' }],
      moves: [],
      // ... other required fields with defaults
    } as unknown as Pokemon,
    ...overrides
  }
}
```
