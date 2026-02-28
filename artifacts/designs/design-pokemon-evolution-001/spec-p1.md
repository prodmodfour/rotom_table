# P1: Ability Remapping, Move Learning, Capability Updates

**Priority:** P1 (should ship)
**Scope:** Ability positional remapping, evolution move learning, capability/skill/size updates
**Matrix Rules:** R032, R033, R034
**Depends on:** P0 (evolution service, evolve endpoint)

## Overview

P1 completes the evolution side effects that P0 defers. After P0, species change and stat recalculation work but abilities, moves, capabilities, and skills remain from the old form. P1 adds the automatic remapping and learning flows per PTU rules, plus the GM-facing UI to resolve ambiguities (ability choice, move selection).

## 1. Ability Remapping (R032)

### 1.1 PTU Rule

> "Abilities change to match the Ability in the same spot in the Evolution's Ability List." (PTU Core p.202)

The ability list for each species in the pokedex is structured as:
- Basic Ability 1
- Basic Ability 2
- Advanced Ability 1
- Advanced Ability 2
- High Ability

Positional mapping means:
- Pokemon has old Basic Ability 1 -> gets new Basic Ability 1
- Pokemon has old Advanced Ability 1 -> gets new Advanced Ability 1
- Pokemon has old High Ability -> gets new High Ability

### 1.2 Design Decision: Positional vs GM Choice

**Positional mapping is deterministic.** The Pokemon's current ability name is matched against the old species' ability list to find its position, then the ability at the same position in the new species' list is used.

However, there is an edge case: **the old ability may not appear in the old species' list** (e.g., granted by a Feature or trainer class). In this case:
- Granted abilities (not from species list) are PRESERVED as-is
- Only species-native abilities are remapped

**Algorithm:**
1. Parse old species' `abilities` array from SpeciesData: `[Basic1, Basic2, Adv1, Adv2, High]`
2. Parse new species' `abilities` array from SpeciesData: `[Basic1, Basic2, Adv1, Adv2, High]`
3. For each of the Pokemon's current abilities:
   a. Find the ability name in the old species' list -> get index
   b. If found and index < new list length -> replace with new list[index]
   c. If found but index >= new list length -> flag for GM decision
   d. If not found in old list -> preserve (non-species ability)
4. Return the remapped abilities plus any requiring GM resolution

### 1.3 Implementation

#### Service Function: `remapAbilities()`

Add to `app/server/services/evolution.service.ts`:

```typescript
interface AbilityRemapResult {
  /** Automatically remapped abilities */
  remappedAbilities: Array<{ name: string; effect: string }>
  /** Abilities that need GM decision (index mismatch or ambiguity) */
  needsResolution: Array<{
    oldAbility: string
    reason: string
    options: Array<{ name: string; effect: string }>
  }>
  /** Non-species abilities preserved from before evolution */
  preservedAbilities: Array<{ name: string; effect: string }>
}

function remapAbilities(
  currentAbilities: Array<{ name: string; effect: string }>,
  oldSpeciesAbilities: string[],   // Full list: [B1, B2, A1, A2, H]
  newSpeciesAbilities: string[],   // Full list: [B1, B2, A1, A2, H]
  numOldBasic: number,             // How many are Basic in old species
  numNewBasic: number              // How many are Basic in new species
): AbilityRemapResult
```

#### Ability Effect Lookup

When remapping, the effect text must be fetched from `AbilityData`:

```typescript
async function lookupAbilityEffect(abilityName: string): Promise<string> {
  const ability = await prisma.abilityData.findUnique({ where: { name: abilityName } })
  return ability?.effect ?? ''
}
```

### 1.4 UI: Ability Resolution Panel

If any abilities need GM resolution, the evolution confirmation modal (from P0) is extended with an "Ability Resolution" step:

- Shows each ability that needs a decision
- Lists the available options from the new species
- GM selects one option per unresolved ability
- Default pre-selects the positionally-mapped option when available

Component: Integrated into `EvolutionConfirmModal.vue` as a step/section.

### 1.5 Integration with Evolution Endpoint

The `POST /api/pokemon/:id/evolve` request body is extended:

```typescript
{
  targetSpecies: string,
  statPoints: Stats,
  // P1 addition:
  abilities?: Array<{ name: string; effect: string }>,  // Override if GM resolved manually
  skipBaseRelations?: boolean
}
```

If `abilities` is not provided, the service auto-remaps using positional mapping. If provided, the service uses the GM's explicit selection.

The evolution service writes the final abilities to the Pokemon record:

```typescript
// In performEvolution():
const abilityResult = remapAbilities(
  currentAbilities,
  JSON.parse(currentSpecies.abilities),
  JSON.parse(targetSpecies.abilities),
  currentSpecies.numBasicAbilities,
  targetSpecies.numBasicAbilities
)

const finalAbilities = input.abilities ?? [
  ...abilityResult.remappedAbilities,
  ...abilityResult.preservedAbilities
]

// Write to DB
await prisma.pokemon.update({
  where: { id: input.pokemonId },
  data: {
    // ...P0 fields...
    abilities: JSON.stringify(finalAbilities)
  }
})
```

## 2. Move Learning on Evolution (R033)

### 2.1 PTU Rule

> "When Pokemon Evolve, they can immediately learn any Moves that their new form learns at a Level lower than their minimum Level for Evolution but that their previous form could not learn." (PTU Core p.202)

Key constraints:
- Only moves from the new form's **Level Up Move List** (not TM/Tutor)
- Only moves at levels **below the evolution's minimum level**
- Only moves that the **old form could NOT learn** (not in old learnset)
- Pokemon can only know 6 moves total (existing PTU limit)
- These moves are **offered**, not forced -- the player chooses

### 2.2 Implementation

#### Utility Function: `getEvolutionMoves()`

Add to `app/utils/evolutionCheck.ts`:

```typescript
/**
 * Get moves that become available upon evolution.
 * PTU p.202: moves from new form's learnset at levels below
 * the evolution's minimum level that the old form couldn't learn.
 *
 * Pure function -- no DB access.
 */
export function getEvolutionMoves(input: {
  oldLearnset: LearnsetEntry[],        // Old species' level-up moves
  newLearnset: LearnsetEntry[],        // New species' level-up moves
  evolutionMinLevel: number | null,    // From the trigger
  currentMoves: string[]               // Names of moves the Pokemon currently knows
}): EvolutionMoveResult

interface EvolutionMoveResult {
  /** Moves available to learn immediately */
  availableMoves: Array<{
    name: string
    level: number  // The level at which the new form learns it
  }>
  /** Current move count (for slot limit checking) */
  currentMoveCount: number
  /** Maximum moves allowed */
  maxMoves: number  // 6
  /** Slots available for new moves */
  slotsAvailable: number
}
```

**Algorithm:**
1. Get all moves from `newLearnset` where `level < evolutionMinLevel` (or `level <= currentLevel` if `evolutionMinLevel` is null -- stone evolutions)
2. Get all move names from `oldLearnset` (any level)
3. Filter: keep only moves from step 1 that are NOT in step 2
4. Further filter: exclude moves the Pokemon already knows (`currentMoves`)
5. Return as available moves

**Edge case -- stone evolutions with no minimum level:**
For stone-based evolutions (e.g., Eevee -> Vaporeon), there is no minimum level. In this case, all moves from the new form's learnset at or below the Pokemon's current level that weren't in the old form's learnset are offered.

### 2.3 UI: Move Selection Panel

Extend the evolution confirmation modal with a "New Moves" step:

- Lists available evolution moves with full details (type, damage class, effect)
- Shows current move list (6 slots)
- If slots are available, player can add moves
- If all 6 slots are full, player must choose which existing move to replace
- "Skip" option to decline all new moves
- Move details fetched from `MoveData` table

Component: Integrated into `EvolutionConfirmModal.vue` as a step/section after stat redistribution.

### 2.4 Integration with Evolution Endpoint

The `POST /api/pokemon/:id/evolve` request body is extended:

```typescript
{
  targetSpecies: string,
  statPoints: Stats,
  abilities?: Array<{ name: string; effect: string }>,
  // P1 addition:
  moves?: Array<MoveDetail>,  // Full move list after learning/replacing
  skipBaseRelations?: boolean
}
```

If `moves` is not provided, the Pokemon keeps its current moves unchanged. If provided, the service validates:
- Max 6 moves total
- All moves are valid (exist in MoveData or new form's learnset)

## 3. Capability and Skill Updates (R034)

### 3.1 PTU Rule

> "Finally, check the Pokemon's Skills and Capabilities and update them for its Evolved form." (PTU Core p.202)

This is a direct replacement -- the new species' capabilities and skills wholesale replace the old ones.

### 3.2 Implementation

This is straightforward: during evolution, read the new species' SpeciesData and overwrite the Pokemon's capabilities and skills.

#### In `performEvolution()`:

```typescript
// Capabilities: directly from new species
const newCapabilities = {
  overland: targetSpecies.overland,
  swim: targetSpecies.swim,
  sky: targetSpecies.sky,
  burrow: targetSpecies.burrow,
  levitate: targetSpecies.levitate,
  teleport: targetSpecies.teleport,
  power: targetSpecies.power,
  jump: { high: targetSpecies.jumpHigh, long: targetSpecies.jumpLong },
  weightClass: targetSpecies.weightClass,
  size: targetSpecies.size,
  otherCapabilities: JSON.parse(targetSpecies.capabilities || '[]')
}

// Skills: directly from new species
const newSkills = JSON.parse(targetSpecies.skills || '{}')

// Size: from new species
const newSize = targetSpecies.size

await prisma.pokemon.update({
  where: { id: input.pokemonId },
  data: {
    // ...P0 + ability/move fields...
    capabilities: JSON.stringify(newCapabilities),
    skills: JSON.stringify(newSkills),
    // Egg groups don't change on evolution (same family)
  }
})
```

### 3.3 Size Change Implications

Size affects:
- VTT token size (Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4)
- Movement and occupied space in combat

If the Pokemon is in an active encounter when evolved:
1. The combatant's token size must be updated in the encounter's combatants JSON
2. The `sizeToTokenSize()` function from `grid-placement.service.ts` handles the mapping

This is handled by broadcasting a `combatant_updated` WebSocket event (see section 4).

## 4. WebSocket Sync

### 4.1 Evolution Broadcast

When evolution completes, broadcast to all connected clients:

```typescript
// Event: pokemon_evolved
{
  type: 'pokemon_evolved',
  data: {
    pokemonId: string,
    previousSpecies: string,
    newSpecies: string,
    ownerId: string | null,   // For targeting the right player view
    changes: EvolutionChanges // Full diff for UI update
  }
}
```

### 4.2 Encounter Combatant Update

If the evolved Pokemon is a combatant in an active encounter:
1. Find the encounter containing this Pokemon (by entityId)
2. Update the combatant's entity data in the encounter's JSON
3. Broadcast `combatant_updated` to all clients in that encounter room

This ensures the Group View and Player View see the evolved Pokemon immediately.

## 5. Evolution Confirmation Modal (Complete P1 Version)

### 5.1 Multi-Step Flow

The `EvolutionConfirmModal.vue` becomes a multi-step modal:

**Step 1: Confirmation**
- "Evolve <Charmander> into <Charmeleon>?"
- Side-by-side comparison: types, base stats, size
- "Next" / "Cancel" buttons

**Step 2: Stat Redistribution** (from P0)
- Current stat point allocation displayed
- Editable stat point inputs
- Total must equal Level + 10
- Base Relations validation
- "Next" / "Back" buttons

**Step 3: Ability Resolution** (P1)
- Auto-remapped abilities shown
- Any needing GM resolution shown with dropdown selectors
- "Next" / "Back" buttons

**Step 4: Move Learning** (P1)
- Available evolution moves listed
- Current moves shown (6 slots)
- Add/replace interface
- "Evolve" / "Back" buttons

**Step 5: Summary**
- All changes displayed
- "Confirm Evolution" / "Back" buttons

### 5.2 Props and Events

```typescript
defineProps<{
  pokemonId: string
  currentSpecies: string
  targetSpecies: string
  trigger: EvolutionTrigger
}>()

defineEmits<{
  (e: 'evolved', result: EvolutionResult): void
  (e: 'cancelled'): void
}>()
```

## 6. Implementation Order

1. **Ability remapping utility** -- `remapAbilities()` function
2. **Evolution moves utility** -- `getEvolutionMoves()` function
3. **Extend evolution service** -- Add ability, move, capability, skill updates to `performEvolution()`
4. **Extend evolve endpoint** -- Accept abilities/moves in request body
5. **WebSocket events** -- `pokemon_evolved` broadcast
6. **Encounter combatant update** -- Sync evolved Pokemon in active encounters
7. **Multi-step modal** -- Extend `EvolutionConfirmModal.vue` with steps 3-5
8. **Ability resolution UI** -- Dropdown selectors for ambiguous abilities
9. **Move learning UI** -- Add/replace interface

## 7. Acceptance Criteria

- [ ] Abilities auto-remap positionally (Basic1 -> Basic1, etc.)
- [ ] Non-species abilities (from Features) are preserved during evolution
- [ ] GM can manually resolve ambiguous ability mappings
- [ ] Evolution moves are correctly identified (new form's learnset, below min level, not in old learnset)
- [ ] Move selection UI respects 6-move limit
- [ ] Capabilities update to new species values (movement, power, jump, size, weight class)
- [ ] Skills update to new species values
- [ ] Size change reflected in VTT token if Pokemon is in active encounter
- [ ] `pokemon_evolved` WebSocket event broadcasts to all connected clients
- [ ] Encounter combatant data updates when an in-encounter Pokemon evolves
- [ ] Multi-step evolution modal flows correctly through all steps
- [ ] "Back" button works at every step without losing data
