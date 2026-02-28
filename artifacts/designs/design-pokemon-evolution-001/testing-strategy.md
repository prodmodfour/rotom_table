# Testing Strategy: Pokemon Evolution System

## Testing Philosophy

Follow the project's established pattern (captureRate.ts, damageCalculation.ts): pure utility functions get thorough unit tests. Service functions that touch the DB are tested via API endpoint tests with mocked Prisma. UI components get composable-level tests.

## P0 Tests

### 1. Seed Parser -- Evolution Trigger Extraction

**File:** `app/tests/unit/seed-evolution-parser.test.ts`

Tests the trigger parsing logic extracted from seed.ts into a testable function.

```
describe('parseEvolutionTriggers')
  it('parses level-only evolution (Charmander -> Charmeleon Minimum 15)')
  it('parses stone evolution (Eevee -> Vaporeon Water Stone)')
  it('parses held-item evolution (Scyther -> Scizor Holding Metal Coat Minimum 30)')
  it('parses stone + level evolution (Pikachu -> Raichu Thunderstone Minimum 20)')
  it('parses branching evolution (Eevee -> 7 evolutions)')
  it('returns empty array for final stage species (Charizard)')
  it('handles single-stage species with no evolution')
  it('handles three-stage chain (Charmander -> Charmeleon -> Charizard)')
  it('identifies correct toSpecies from next-stage lines')
  it('handles Mega evolution entries (skips them -- not evolution triggers)')
```

### 2. Evolution Eligibility Check

**File:** `app/tests/unit/utils/evolutionCheck.test.ts`

```
describe('checkEvolutionEligibility')
  describe('level-based triggers')
    it('returns available when level >= minimumLevel')
    it('returns ineligible when level < minimumLevel')
    it('returns correct reason message for level requirement')

  describe('stone-based triggers')
    it('returns available for stone evolution (no level check needed)')
    it('returns available with note that stone is needed')

  describe('held-item triggers')
    it('returns available when heldItem matches required item')
    it('returns ineligible when heldItem does not match')
    it('returns ineligible when heldItem is null')
    it('returns correct reason message for item requirement')

  describe('combined triggers')
    it('checks both level AND held item for Holding X Minimum N triggers')
    it('checks both level AND stone for Stone Minimum N triggers')

  describe('branching evolutions')
    it('returns multiple available evolutions for Eevee with all stones')
    it('filters to only level-eligible branches')

  describe('edge cases')
    it('returns empty available array when no triggers exist')
    it('handles null heldItem gracefully')
    it('handles level 1 Pokemon')
    it('handles level 100 Pokemon')
```

### 3. Stat Point Extraction

**File:** `app/tests/unit/services/evolution-stats.test.ts`

```
describe('extractStatPoints')
  it('extracts correct stat points from nature-adjusted base and current stats')
  it('handles HP extraction using PTU formula (maxHp = level + hpStat*3 + 10)')
  it('returns zero stat points for fresh level-1 Pokemon (11 points = level + 10)')
  it('handles high-level Pokemon with many distributed points')
  it('sum of extracted points equals level + 10')
```

### 4. Stat Recalculation

**File:** `app/tests/unit/services/evolution-recalc.test.ts`

```
describe('recalculateStats')
  it('applies nature to new base stats correctly')
  it('applies nature HP modifier (+1/-1) correctly')
  it('applies nature non-HP modifier (+2/-2) correctly')
  it('neutral nature does not modify base stats')
  it('stat minimum is 1 after nature application')
  it('adds stat points to nature-adjusted base')
  it('calculates maxHp using PTU formula')
  it('validates stat point total equals level + 10')
  it('rejects stat point total that does not match')
  it('validates Base Relations Rule')
  it('allows equal base stats to have any point distribution')
  it('detects Base Relations violation')
  it('skipBaseRelations flag bypasses validation')

describe('validateBaseRelations')
  it('passes when all relations maintained')
  it('passes when equal base stats are in any order')
  it('fails when higher base stat has lower final value')
  it('returns specific violation message with stat names and values')
  it('handles all six stats')
  it('handles nature-modified base stats (not raw base)')
```

### 5. Evolution Execution (Service)

**File:** `app/tests/unit/services/evolution-service.test.ts`

Mock Prisma for DB interactions.

```
describe('performEvolution')
  it('changes species name to target species')
  it('updates type1 and type2 from new species')
  it('writes nature-adjusted base stats for new species')
  it('writes calculated stats (base + redistributed points)')
  it('writes new maxHp from PTU formula')
  it('adjusts currentHp proportionally to new maxHp')
  it('preserves currentHp = 1 when Pokemon was at 1 HP (not 0)')
  it('rejects evolution when target is not in triggers')
  it('rejects evolution when level requirement not met')
  it('rejects evolution when held item does not match')
  it('rejects invalid stat point total')
  it('rejects Base Relations violation (without skip flag)')
  it('allows Base Relations violation with skip flag')
  it('returns changes diff object')
```

### 6. Evolution Check Endpoint

**File:** `app/tests/unit/api/pokemon-evolution-check.test.ts`

```
describe('POST /api/pokemon/:id/evolution-check')
  it('returns available evolutions for eligible Pokemon')
  it('returns ineligible evolutions with reasons')
  it('returns 404 for non-existent Pokemon')
  it('returns empty results for fully evolved Pokemon')
  it('handles Pokemon with no species data gracefully')
```

### 7. Evolution Endpoint

**File:** `app/tests/unit/api/pokemon-evolve.test.ts`

```
describe('POST /api/pokemon/:id/evolve')
  it('returns updated Pokemon with new species data')
  it('returns 400 for invalid stat point total')
  it('returns 400 for Base Relations violation')
  it('returns 400 for invalid target species')
  it('returns 404 for non-existent Pokemon')
  it('returns success response with changes diff')
```

## P1 Tests

### 8. Ability Remapping

**File:** `app/tests/unit/services/evolution-abilities.test.ts`

```
describe('remapAbilities')
  describe('positional mapping')
    it('maps Basic Ability 1 to new Basic Ability 1')
    it('maps Basic Ability 2 to new Basic Ability 2')
    it('maps Advanced Ability 1 to new Advanced Ability 1')
    it('maps Advanced Ability 2 to new Advanced Ability 2')
    it('maps High Ability to new High Ability')

  describe('non-species abilities')
    it('preserves ability not in old species list')
    it('preserves multiple non-species abilities')

  describe('edge cases')
    it('handles Pokemon with only one ability (freshly caught)')
    it('handles Pokemon with all three ability slots filled')
    it('handles species with different number of basic abilities')
    it('returns needs-resolution when index exceeds new list length')
    it('handles empty ability lists gracefully')

  describe('real-world examples')
    it('Charmander(Blaze) -> Charmeleon(Blaze): Basic1 -> Basic1')
    it('Charmander(Rattled) -> Charmeleon(Intimidate): Basic2 -> Basic2')
    it('Eevee(Run Away) -> Espeon(Synchronize): Basic1 -> Basic1')
```

### 9. Evolution Move Learning

**File:** `app/tests/unit/utils/evolutionMoves.test.ts`

```
describe('getEvolutionMoves')
  it('returns moves from new learnset below min evolution level')
  it('excludes moves that old species could also learn')
  it('excludes moves the Pokemon already knows')
  it('returns empty array when no new moves are available')
  it('handles stone evolution with no minimum level (uses current level)')
  it('correctly counts available move slots')
  it('reports 6 as max moves')

  describe('real-world examples')
    it('Charmeleon evolving at level 16: no new exclusive moves below 15')
    it('identifies moves unique to evolved form learnset')

  describe('edge cases')
    it('handles empty old learnset')
    it('handles empty new learnset')
    it('handles Pokemon with 6 moves (0 slots available)')
    it('handles Pokemon with 0 moves (6 slots available)')
```

### 10. Capability/Skill Update

**File:** `app/tests/unit/services/evolution-capabilities.test.ts`

```
describe('capability update on evolution')
  it('updates overland movement speed')
  it('updates swim speed')
  it('updates sky speed (e.g., Charmeleon -> Charizard gains Sky)')
  it('updates power value')
  it('updates jump values')
  it('updates weight class')
  it('updates size class')
  it('updates other capabilities list')
  it('updates skills to new species values')
```

## P2 Tests

### 11. Evolution Prevention

**File:** `app/tests/unit/utils/evolutionPrevention.test.ts`

```
describe('evolution prevention')
  it('Everstone blocks all evolutions')
  it('Eviolite blocks all evolutions')
  it('returns specific prevention reason for Everstone')
  it('returns specific prevention reason for Eviolite')
  it('non-prevention items do not block evolution')
  it('null heldItem does not block evolution')
```

### 12. Gender-Specific Triggers

**File:** (extend `evolutionCheck.test.ts`)

```
describe('gender-specific triggers')
  it('Male-only evolution available for Male Pokemon')
  it('Male-only evolution ineligible for Female Pokemon')
  it('Female-only evolution available for Female Pokemon')
  it('Female-only evolution ineligible for Male Pokemon')
  it('Gender-neutral trigger available for any gender')
  it('Genderless Pokemon can use gender-neutral triggers')
```

### 13. Move-Specific Triggers

**File:** (extend `evolutionCheck.test.ts`)

```
describe('move-specific triggers')
  it('evolution available when Pokemon knows required move')
  it('evolution ineligible when Pokemon does not know required move')
  it('returns reason message with required move name')
```

### 14. Post-Evolution Undo

**File:** `app/tests/unit/composables/useEvolutionUndo.test.ts`

```
describe('useEvolutionUndo')
  it('records evolution snapshot')
  it('canUndo returns true for recorded Pokemon')
  it('canUndo returns false for unrecorded Pokemon')
  it('undoEvolution calls API with snapshot')
  it('clearUndo removes snapshot from stack')
  it('multiple Pokemon can have independent undo snapshots')
```

## Test Data

### Reference Species for Tests

| Species | Stage | Max | Trigger | Notes |
|---------|-------|-----|---------|-------|
| Charmander | 1 | 3 | -> Charmeleon Min 15 | Simple level evolution |
| Charmeleon | 2 | 3 | -> Charizard Min 30 | Second level evolution |
| Charizard | 3 | 3 | (none) | Fully evolved |
| Eevee | 1 | 2 | -> 7 branches (stones) | Branching stone evolution |
| Pikachu | 2 | 3 | -> Raichu Thunderstone Min 20 | Stone + level combo |
| Scizor | 2 | 2 | (none, evolved via Holding Metal Coat Min 30) | Held item result |
| Scyther | 1 | 2 | -> Scizor Holding Metal Coat Min 30 | Held item trigger |
| Machop | 1 | 3 | -> Machoke Min 20 | 3-stage level only |
| Rattata | 1 | 2 | -> Raticate Min 20 | Simple 2-stage |
| Chansey | 1 | 2 | -> Blissey Min 40 | Late evolution |

### Test Stat Data

For stat recalculation tests, use Charmander -> Charmeleon:

```
Charmander base: HP 4, ATK 5, DEF 4, SPATK 6, SPDEF 5, SPD 7
Charmeleon base: HP 6, ATK 6, DEF 6, SPATK 8, SPDEF 7, SPD 8
```

With Adamant nature (ATK +2, SPATK -2):
```
Charmander adjusted: HP 4, ATK 7, DEF 4, SPATK 4, SPDEF 5, SPD 7
Charmeleon adjusted: HP 6, ATK 8, DEF 6, SPATK 6, SPDEF 7, SPD 8
```

At Level 15, total stat points = 25.

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| `evolutionCheck.ts` | 95%+ | Core eligibility logic, many edge cases |
| `evolution.service.ts` | 90%+ | Critical business logic with DB writes |
| Seed parser (evolution) | 85%+ | Data correctness for all 994 species |
| `evolutionMoves` utility | 90%+ | Move learning has tricky edge cases |
| `remapAbilities` | 90%+ | Positional mapping with edge cases |
| Components (modal) | 70%+ | UI logic via composable tests |
| Endpoints | 80%+ | Input validation + happy path |
