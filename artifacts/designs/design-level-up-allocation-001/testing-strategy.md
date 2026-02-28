# Testing Strategy: Pokemon Level-Up Allocation UI

## Testing Philosophy

Follow the project's established pattern (captureRate.ts, damageCalculation.ts): pure utility functions get thorough unit tests. Service/endpoint functions are tested via API tests with mocked Prisma. Composable state logic is tested in isolation.

## P0 Tests

### 1. Base Relations Validation

**File:** `app/tests/unit/utils/baseRelations.test.ts`

```
describe('buildStatTiers')
  it('groups equal base stats into the same tier')
  it('sorts tiers from highest to lowest base value')
  it('single tier when all stats are equal')
  it('six tiers when all stats are different')
  it('handles Charmander base stats: Speed(7) > SpAtk(6) > Atk/SpDef(5) > HP/Def(4)')
  it('handles Bulbasaur base stats with multiple ties')

describe('validateBaseRelations')
  describe('valid allocations')
    it('passes when all final stats maintain base ordering')
    it('passes when equal-base stats have different allocations')
    it('passes when higher-base stat has higher allocation')
    it('passes with zero stat points (fresh Pokemon)')
    it('passes with all points in one stat (if that stat is highest base)')
    it('passes with Charmander: Speed highest, gets most points')

  describe('invalid allocations')
    it('fails when lower-base stat exceeds higher-base stat final value')
    it('fails when HP (base 4) exceeds Speed (base 7) in final stats')
    it('returns specific violation message with stat names and values')
    it('detects multiple violations simultaneously')
    it('fails when Charmander Defense (base 4) final exceeds Attack (base 5) final')

  describe('nature-adjusted base stats (decree-035)')
    it('uses nature-adjusted stats, not raw species stats')
    it('Adamant nature (+Atk/-SpAtk) changes the valid ordering')
    it('Brave nature (+Atk/-Speed) may allow Attack > Speed allocation')
    it('neutral nature has no effect on ordering')

  describe('edge cases')
    it('handles all stats at base value 1 (minimum)')
    it('handles level 100 Pokemon (110 stat points)')
    it('handles single stat point allocation')

describe('getValidAllocationTargets')
  it('all stats valid when no points are allocated yet')
  it('restricts stats that would cause a violation')
  it('returns false for all stats when no points remain (unallocatedPoints = 0)')
  it('allows equal-tier stats to receive points freely')
  it('correctly identifies the one stat that would cause a violation')
  it('handles near-boundary: last point allocation where only one stat is valid')
```

### 2. Stat Point Extraction

**File:** `app/tests/unit/utils/baseRelations-extract.test.ts`

```
describe('extractStatPoints')
  it('extracts correct stat points from nature-adjusted base and current stats')
  it('handles HP extraction using PTU formula (maxHp = level + hpStat*3 + 10)')
  it('returns zero stat points for fresh Level 1 Pokemon (11 total)')
  it('handles Level 50 Pokemon with 60 stat points')
  it('sum of extracted points equals level + 10 for consistent data')
  it('handles inconsistent data gracefully (returns isConsistent: false)')
  it('all individual stat point values are >= 0')

  describe('HP formula edge cases')
    it('Level 1, baseHp 4, maxHp 22: hpStat = (22-1-10)/3 = 3.67 -> 4, points = 0')
    it('Level 10, baseHp 5, maxHp 35: hpStat = (35-10-10)/3 = 5, points = 0')
    it('Level 10, baseHp 5, maxHp 38: hpStat = (38-10-10)/3 = 6, points = 1')
    it('rounds correctly when maxHp is not perfectly divisible by 3')

  describe('real-world Pokemon')
    it('Level 5 Charmander with Adamant nature: base adjusted, 15 points')
    it('Level 20 Charmeleon with 30 distributed points')
```

### 3. Stat Allocation Endpoint

**File:** `app/tests/unit/api/pokemon-allocate-stats.test.ts`

Mock Prisma for DB interactions.

```
describe('POST /api/pokemon/:id/allocate-stats')
  describe('incremental mode (stat + points)')
    it('adds 1 point to a stat successfully')
    it('updates currentStat in database')
    it('updates maxHp when HP stat is allocated')
    it('preserves full HP state (currentHp follows maxHp)')
    it('does not change currentHp when Pokemon is damaged')

  describe('batch mode (statPoints object)')
    it('applies full allocation successfully')
    it('updates all current stats in database')
    it('calculates maxHp from new HP stat value')

  describe('validation')
    it('rejects allocation exceeding stat budget (level + 10)')
    it('rejects negative stat point values')
    it('rejects invalid stat key')
    it('rejects Base Relations violation')
    it('allows violation with skipBaseRelations flag')
    it('returns 404 for non-existent Pokemon')
    it('returns 400 for missing required fields')

  describe('response')
    it('returns updated Pokemon data')
    it('returns validation result')
    it('returns remaining unallocated points')
```

### 4. Composable: useLevelUpAllocation

**File:** `app/tests/unit/composables/useLevelUpAllocation.test.ts`

```
describe('useLevelUpAllocation')
  describe('stat extraction')
    it('extracts current allocation from Pokemon data')
    it('computes correct stat budget (level + 10)')
    it('computes correct unallocated points')
    it('handles null Pokemon gracefully')

  describe('allocation')
    it('allocatePoint increases pending allocation for the stat')
    it('allocatePoint does nothing if stat is not a valid target')
    it('allocatePoint does nothing if no points remaining')
    it('deallocatePoint decreases pending allocation')
    it('deallocatePoint does nothing if pending is already 0')
    it('resetAllocation clears all pending points')

  describe('validation')
    it('validation is valid when allocation respects Base Relations')
    it('validation shows violations when Base Relations broken')
    it('validTargets updates after each allocation')
    it('valid targets exclude stats that would violate ordering')

  describe('submission')
    it('submitAllocation calls the allocate-stats endpoint')
    it('submitAllocation resets state on success')
    it('submitAllocation preserves state on failure')
    it('isSaving is true during submission')
    it('error is populated on failure')

  describe('workflow')
    it('startAllocation initializes state')
    it('cancelAllocation resets everything')
    it('full workflow: start -> allocate -> submit')
```

## P1 Tests

### 5. Ability Pool Computation

**File:** `app/tests/unit/utils/abilityAssignment.test.ts`

```
describe('getAbilityPool')
  describe('category classification')
    it('classifies first N abilities as Basic (where N = numBasicAbilities)')
    it('classifies abilities after Basic and before last as Advanced')
    it('classifies last ability as High')
    it('handles species with 2 Basic, 2 Advanced, 1 High (standard)')
    it('handles species with 1 Basic ability only')
    it('handles species with no Advanced abilities')

  describe('second ability (Level 20)')
    it('includes Basic abilities in pool')
    it('includes Advanced abilities in pool')
    it('excludes High ability from pool')
    it('excludes currently-held ability')
    it('returns empty pool when Pokemon already has all Basic+Advanced')

  describe('third ability (Level 40)')
    it('includes Basic abilities in pool')
    it('includes Advanced abilities in pool')
    it('includes High ability in pool')
    it('excludes currently-held abilities')
    it('returns empty pool when Pokemon already has all abilities')

  describe('real-world examples')
    it('Charmander at Level 20: Blaze, Solar Power -> pool excludes Blaze')
    it('Venusaur at Level 40: includes Courage (High)')
    it('Eevee: Run Away, Adaptability -> pool for second includes Anticipation (Advanced)')

  describe('edge cases')
    it('species with 0 abilities returns empty pool')
    it('species with only 1 ability returns empty pool if already held')
    it('ability held from Feature (not in species list) does not affect pool')
```

### 6. Assign Ability Endpoint

**File:** `app/tests/unit/api/pokemon-assign-ability.test.ts`

```
describe('POST /api/pokemon/:id/assign-ability')
  describe('second ability (Level 20)')
    it('assigns ability from Basic pool')
    it('assigns ability from Advanced pool')
    it('rejects High ability')
    it('rejects if Pokemon level < 20')
    it('rejects if Pokemon already has 2+ abilities')
    it('fetches effect text from AbilityData')

  describe('third ability (Level 40)')
    it('assigns ability from any pool')
    it('assigns High ability')
    it('rejects if Pokemon level < 40')
    it('rejects if Pokemon already has 3+ abilities')

  describe('validation')
    it('rejects non-existent Pokemon')
    it('rejects ability not in valid pool')
    it('rejects duplicate ability (already held)')
    it('returns 400 for missing abilityName')
    it('returns 400 for invalid milestone value')

  describe('response')
    it('returns updated Pokemon with new ability appended')
    it('ability object includes name and effect')
```

### 7. Learn Move Endpoint

**File:** `app/tests/unit/api/pokemon-learn-move.test.ts`

```
describe('POST /api/pokemon/:id/learn-move')
  describe('adding to empty slot')
    it('adds move when Pokemon has < 6 moves')
    it('fetches full move data from MoveData table')
    it('move object includes type, damageClass, frequency, ac, damageBase, range, effect')
    it('rejects when Pokemon already has 6 moves and no replaceIndex')

  describe('replacing existing move')
    it('replaces move at specified index')
    it('preserves other moves in the array')
    it('rejects invalid replaceIndex (out of bounds)')
    it('rejects negative replaceIndex')

  describe('validation')
    it('rejects duplicate move (already known)')
    it('rejects non-existent move (not in MoveData)')
    it('rejects non-existent Pokemon')
    it('returns 400 for missing moveName')

  describe('response')
    it('returns updated Pokemon with new move list')
    it('move at replaced index is the new move')
    it('move count stays at 6 after replace')
    it('move count increases by 1 after add')
```

### 8. Batch Lookup Endpoints

**File:** `app/tests/unit/api/abilities-batch.test.ts`

```
describe('POST /api/abilities/batch')
  it('returns ability data for all requested names')
  it('handles names that do not exist (omits them)')
  it('returns empty array for empty names input')
  it('returns effect and trigger fields')
```

**File:** `app/tests/unit/api/moves-batch.test.ts`

```
describe('POST /api/moves/batch')
  it('returns move data for all requested names')
  it('handles names that do not exist')
  it('returns all move fields (type, ac, db, range, effect)')
```

## Test Data

### Reference Pokemon for Tests

| Pokemon | Level | Nature | Base Stats (adjusted) | Notes |
|---------|-------|--------|-----------------------|-------|
| Charmander | 5 | Adamant (+Atk/-SpAtk) | HP:4, Atk:7, Def:4, SpA:4, SpD:5, Spd:7 | 15 total stat points |
| Charmander | 5 | Neutral (Hardy) | HP:4, Atk:5, Def:4, SpA:6, SpD:5, Spd:7 | No nature modification |
| Charmeleon | 20 | Adamant | HP:6, Atk:8, Def:6, SpA:6, SpD:7, Spd:8 | Ability milestone |
| Venusaur | 40 | Modest (+SpA/-Atk) | HP:8, Atk:6, Def:8, SpA:12, SpD:10, Spd:8 | Third ability milestone |
| Pikachu | 10 | Timid (+Spd/-Atk) | HP:4, Atk:3, Def:3, SpA:5, SpD:4, Spd:11 | Fast, low bulk |

### Reference Base Stats for Validation Tests

**Charmander (neutral):**
- Tiers: Speed(7) > SpAtk(6) > Attack(5) = SpDef(5) > HP(4) = Defense(4)
- Valid allocation example (15 points): HP:2, Atk:3, Def:2, SpA:3, SpD:2, Spd:3 -> Finals: 6,8,6,9,7,10
- Invalid allocation: HP:5, Atk:1, Def:5, SpA:1, SpD:1, Spd:2 -> HP(9) > SpAtk(7) VIOLATION

**Charmander (Adamant +Atk/-SpAtk):**
- Adjusted base: HP:4, Atk:7, Def:4, SpA:4, SpD:5, Spd:7
- Tiers: Attack(7) = Speed(7) > SpDef(5) > HP(4) = Defense(4) = SpAtk(4)
- Now Attack is top tier (equal with Speed), SpAtk drops to bottom tier

### Reference Species Abilities for Tests

| Species | Abilities | Basic Count | Categories |
|---------|-----------|-------------|------------|
| Charmander | [Blaze, Solar Power, Flame Body, Defiant, Reckless] | 2 | B:Blaze,Solar Power A:Flame Body,Defiant H:Reckless |
| Venusaur | [Confidence, Photosynthesis, Chlorophyll, Aroma Veil, Courage] | 2 | B:Confidence,Photo A:Chlorophyll,Aroma Veil H:Courage |
| Eevee | [Run Away, Adaptability, Anticipation, Trace, Cute Charm] | 2 | B:Run Away,Adaptability A:Anticipation,Trace H:Cute Charm |

(Note: Actual ability lists may differ from these examples. Tests should use representative data matching the SpeciesData structure.)

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| `baseRelations.ts` | 95%+ | Core validation logic, many edge cases, shared with evolution |
| `abilityAssignment.ts` | 90%+ | Category classification must be correct |
| `allocate-stats` endpoint | 85%+ | Critical write path with validation |
| `assign-ability` endpoint | 85%+ | Milestone enforcement |
| `learn-move` endpoint | 85%+ | Move slot management |
| `useLevelUpAllocation` | 80%+ | State management logic |
| Components (panels) | 70%+ | Via composable-level tests |
| Batch endpoints | 80%+ | Simple but must handle missing data |

## Integration Testing Notes

1. **Stat allocation + HP interaction:** Test that allocating points to HP correctly updates both `maxHp` and conditionally updates `currentHp` (full HP state preservation).

2. **Base Relations + Nature interaction:** Test with multiple natures to verify decree-035 compliance. Key test: same allocation valid under one nature but invalid under another.

3. **Ability assignment + current abilities:** Test that the endpoint correctly appends to the abilities array without mutating existing entries.

4. **Move learning + 6-move limit:** Test the full flow: Pokemon with 5 moves learns a 6th, then tries to learn a 7th (must replace).

5. **Cross-feature: evolution + level-up:** Both use `validateBaseRelations()`. If evolution lands first, verify that the same validation function works correctly in both contexts. Write a shared test fixture that exercises both code paths.
