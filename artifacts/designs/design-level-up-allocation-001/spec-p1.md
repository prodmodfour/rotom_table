# P1: Ability Assignment + Move Learning UI

**Priority:** P1 (should ship)
**Scope:** Ability assignment at levels 20/40, move learning from learnset, integrated level-up workflow
**Matrix Rules:** R014, R015, R028
**Depends on:** P0 (stat allocation, base relations utility)

## Overview

P1 adds the remaining level-up actions: ability assignment at milestone levels and move learning when new moves are available in the learnset. After P1, the full level-up workflow is actionable -- the GM can allocate stats, pick new abilities, and learn new moves all from the level-up UI.

## 1. Ability Assignment (R014, R015)

### 1.1 PTU Rules

**Level 20:** Choose a 2nd ability from Basic or Advanced abilities.
**Level 40:** Choose a 3rd ability from any category (Basic, Advanced, or High).

The ability list in SpeciesData is structured as:
```
[Basic1, Basic2, ..., BasicN, Advanced1, Advanced2, ..., AdvancedM, High]
```
Where `numBasicAbilities` = N. The last entry is always the High Ability (when present).

### 1.2 Ability Pool Computation

New pure utility function in `app/utils/baseRelations.ts` or a new `app/utils/abilityAssignment.ts`:

```typescript
/**
 * Get the pool of abilities available for a given milestone.
 *
 * Level 20 (second ability): Basic + Advanced abilities
 * Level 40 (third ability): Basic + Advanced + High abilities
 *
 * Excludes abilities the Pokemon already has.
 */
export function getAbilityPool(input: {
  speciesAbilities: string[]   // Full list from SpeciesData
  numBasicAbilities: number    // Count of Basic abilities
  currentAbilities: string[]   // Names of abilities the Pokemon already has
  milestone: 'second' | 'third'
}): {
  available: Array<{
    name: string
    category: 'Basic' | 'Advanced' | 'High'
  }>
  alreadyHas: string[]
}
```

**Algorithm:**
1. Categorize each ability in the species list:
   - Index 0 to `numBasicAbilities - 1`: Basic
   - Index `numBasicAbilities` to `length - 2`: Advanced
   - Last index: High (only if `length > numBasicAbilities`)
2. For `'second'` milestone: include Basic + Advanced
3. For `'third'` milestone: include Basic + Advanced + High
4. Exclude abilities the Pokemon already has (by name)

**Edge cases:**
- Species with only 1 ability: no pool available (degenerate case)
- Pokemon already has the ability from another source (Feature): still excluded
- Species with no Advanced abilities: Level 20 pool = Basic only
- Species with no High ability: Level 40 pool = Basic + Advanced only

### 1.3 Server Endpoint: `POST /api/pokemon/:id/assign-ability`

New endpoint at `app/server/api/pokemon/[id]/assign-ability.post.ts`.

```typescript
/**
 * POST /api/pokemon/:id/assign-ability
 *
 * Assign a new ability to a Pokemon at a Level 20 or Level 40 milestone.
 *
 * Body: {
 *   abilityName: string,     // Name of the ability to assign
 *   milestone: 'second' | 'third'  // Which milestone
 * }
 *
 * Validation:
 * 1. Pokemon must exist
 * 2. Pokemon's level must be >= 20 (for second) or >= 40 (for third)
 * 3. Pokemon must not already have the target number of abilities
 *    (second: must have exactly 1, third: must have exactly 2)
 * 4. Ability must be in the valid pool for the milestone
 * 5. Ability must exist in AbilityData (to fetch effect text)
 */
```

**Implementation:**

```typescript
// Fetch Pokemon
const pokemon = await prisma.pokemon.findUnique({ where: { id } })
const currentAbilities = JSON.parse(pokemon.abilities) as Array<{ name: string; effect: string }>

// Validate milestone eligibility
if (body.milestone === 'second') {
  if (pokemon.level < 20) throw createError({ statusCode: 400, message: 'Pokemon must be Level 20+ for second ability' })
  if (currentAbilities.length >= 2) throw createError({ statusCode: 400, message: 'Pokemon already has 2+ abilities' })
} else if (body.milestone === 'third') {
  if (pokemon.level < 40) throw createError({ statusCode: 400, message: 'Pokemon must be Level 40+ for third ability' })
  if (currentAbilities.length >= 3) throw createError({ statusCode: 400, message: 'Pokemon already has 3+ abilities' })
}

// Fetch species data for ability pool
const speciesData = await prisma.speciesData.findUnique({ where: { name: pokemon.species } })
const speciesAbilities = JSON.parse(speciesData.abilities) as string[]

// Compute valid pool
const pool = getAbilityPool({
  speciesAbilities,
  numBasicAbilities: speciesData.numBasicAbilities,
  currentAbilities: currentAbilities.map(a => a.name),
  milestone: body.milestone
})

// Validate chosen ability is in pool
if (!pool.available.some(a => a.name === body.abilityName)) {
  throw createError({
    statusCode: 400,
    message: `${body.abilityName} is not available for ${body.milestone} ability assignment`
  })
}

// Fetch ability effect from AbilityData
const abilityData = await prisma.abilityData.findUnique({ where: { name: body.abilityName } })
const newAbility = {
  name: body.abilityName,
  effect: abilityData?.effect ?? ''
}

// Append to abilities array (immutable)
const updatedAbilities = [...currentAbilities, newAbility]

// Update Pokemon
await prisma.pokemon.update({
  where: { id },
  data: { abilities: JSON.stringify(updatedAbilities) }
})
```

### 1.4 Component: `AbilityAssignmentPanel.vue`

New component at `app/components/pokemon/AbilityAssignmentPanel.vue`.

**UI Layout:**

```
+----------------------------------------------------------+
| Ability Assignment (Level 20: Second Ability)             |
+----------------------------------------------------------+
| Current Ability: Blaze                                    |
|                                                           |
| Choose from Basic/Advanced abilities:                     |
|                                                           |
| ( ) Solar Power [Advanced]                                |
|     "When Sunny, +2 SpAtk, lose 1/8 HP per turn"        |
|                                                           |
| ( ) Flame Body [Basic]                                    |
|     "Contact moves have 30% chance to Burn"              |
|                                                           |
| [Cancel] [Assign Ability]                                 |
+----------------------------------------------------------+
```

**Props and Events:**

```typescript
defineProps<{
  pokemon: Pokemon
  milestone: 'second' | 'third'
  speciesAbilities: string[]
  numBasicAbilities: number
}>()

defineEmits<{
  (e: 'assigned', ability: { name: string; effect: string }): void
  (e: 'cancelled'): void
}>()
```

**Behavior:**
1. On mount, fetch the ability pool using `getAbilityPool()`
2. For each available ability, fetch full details from `GET /api/abilities/:name` (or use a batch fetch)
3. Display as radio button list with ability name, category tag, and effect text
4. "Assign Ability" button calls `POST /api/pokemon/:id/assign-ability`
5. On success, emit `assigned` with the new ability
6. The parent component refreshes the Pokemon data

### 1.5 Ability Detail Fetching

To display ability effects in the picker, we need ability data. Two approaches:

**Option A: Fetch from AbilityData table** (recommended)
- Create `GET /api/abilities/batch` endpoint that accepts `names: string[]` and returns `AbilityData[]`
- The component fetches all pool abilities in one call

**Option B: Inline from SpeciesData**
- SpeciesData only stores ability names, not effects
- Would need a join or additional queries

**Recommendation: Option A.** Create a simple batch lookup endpoint for ability details.

#### New Endpoint: `POST /api/abilities/batch`

```typescript
/**
 * POST /api/abilities/batch
 *
 * Fetch multiple ability details by name.
 * Body: { names: string[] }
 * Returns: { success: true, data: AbilityData[] }
 */
const body = await readBody(event)
const abilities = await prisma.abilityData.findMany({
  where: { name: { in: body.names } }
})
return { success: true, data: abilities }
```

## 2. Move Learning (R028)

### 2.1 PTU Rules

At each level, check the species' learnset. If a move is available at the Pokemon's new level:
- The Pokemon MAY learn it (optional, GM/player choice)
- Maximum 6 moves total
- If at 6 moves, must replace an existing move

### 2.2 Server Endpoint: `POST /api/pokemon/:id/learn-move`

New endpoint at `app/server/api/pokemon/[id]/learn-move.post.ts`.

```typescript
/**
 * POST /api/pokemon/:id/learn-move
 *
 * Add a move to a Pokemon's active move set.
 *
 * Body: {
 *   moveName: string,           // Name of the move to learn
 *   replaceIndex: number | null // Index (0-5) of move to replace, null to add to empty slot
 * }
 *
 * Validation:
 * 1. Pokemon must exist
 * 2. Move must exist in MoveData
 * 3. Pokemon must not already know this move
 * 4. If replaceIndex is null, Pokemon must have fewer than 6 moves
 * 5. If replaceIndex is set, it must be a valid index (0 to currentMoves.length - 1)
 */
```

**Implementation:**

```typescript
// Fetch Pokemon
const pokemon = await prisma.pokemon.findUnique({ where: { id } })
const currentMoves = JSON.parse(pokemon.moves)

// Validate not already known
if (currentMoves.some((m: any) => m.name === body.moveName)) {
  throw createError({ statusCode: 400, message: `Pokemon already knows ${body.moveName}` })
}

// Fetch move data
const moveData = await prisma.moveData.findUnique({ where: { name: body.moveName } })
if (!moveData) {
  throw createError({ statusCode: 404, message: `Move ${body.moveName} not found` })
}

const newMove = {
  name: moveData.name,
  type: moveData.type,
  damageClass: moveData.damageClass,
  frequency: moveData.frequency,
  ac: moveData.ac,
  damageBase: moveData.damageBase,
  range: moveData.range,
  effect: moveData.effect
}

let updatedMoves
if (body.replaceIndex !== null && body.replaceIndex !== undefined) {
  // Replace existing move
  if (body.replaceIndex < 0 || body.replaceIndex >= currentMoves.length) {
    throw createError({ statusCode: 400, message: 'Invalid move index' })
  }
  updatedMoves = currentMoves.map((m: any, i: number) =>
    i === body.replaceIndex ? newMove : m
  )
} else {
  // Add to empty slot
  if (currentMoves.length >= 6) {
    throw createError({ statusCode: 400, message: 'Pokemon already has 6 moves. Specify replaceIndex.' })
  }
  updatedMoves = [...currentMoves, newMove]
}

// Update Pokemon
await prisma.pokemon.update({
  where: { id },
  data: { moves: JSON.stringify(updatedMoves) }
})
```

### 2.3 Component: `MoveLearningPanel.vue`

New component at `app/components/pokemon/MoveLearningPanel.vue`.

**UI Layout:**

```
+----------------------------------------------------------+
| New Moves Available                                       |
+----------------------------------------------------------+
| Current Moves (4/6):                                      |
| 1. Scratch     [Normal]  Physical  At-Will  DB 4         |
| 2. Ember       [Fire]    Special   At-Will  DB 4         |
| 3. Growl       [Normal]  Status    At-Will               |
| 4. Metal Claw  [Steel]   Physical  EOT      DB 5         |
| 5. (empty)                                                |
| 6. (empty)                                                |
+----------------------------------------------------------+
| Available at Level 17:                                    |
|                                                           |
| Dragon Rage   [Dragon]  Special  Scene  DB --             |
| "Always deals 40 damage"                                  |
| [Add to Slot 5]                                           |
|                                                           |
| Fire Fang     [Fire]    Physical  EOT   DB 7              |
| "10% Burn, 10% Flinch"                                    |
| [Add to Slot 5]                                           |
+----------------------------------------------------------+
| [Skip - Learn No Moves]                                   |
+----------------------------------------------------------+
```

**Props and Events:**

```typescript
defineProps<{
  pokemon: Pokemon
  /** Move names available from learnset at the current level */
  availableMoves: string[]
}>()

defineEmits<{
  (e: 'learned', move: { name: string }): void
  (e: 'skipped'): void
}>()
```

**Behavior:**
1. Display current moves with their types and details
2. Show available new moves with full details (fetched from MoveData)
3. If slots are available (< 6 moves), show "Add to Slot N" button
4. If at 6 moves, show a dropdown or radio selection to choose which move to replace
5. "Learn Move" calls `POST /api/pokemon/:id/learn-move`
6. After learning, refresh the move list and show remaining available moves
7. "Skip" button dismisses without learning any moves

### 2.4 Move Detail Fetching

Use existing `GET /api/moves/:name` or create a batch endpoint similar to abilities:

#### New Endpoint: `POST /api/moves/batch`

```typescript
/**
 * POST /api/moves/batch
 *
 * Fetch multiple move details by name.
 * Body: { names: string[] }
 * Returns: { success: true, data: MoveData[] }
 */
const body = await readBody(event)
const moves = await prisma.moveData.findMany({
  where: { name: { in: body.names } }
})
return { success: true, data: moves }
```

## 3. Integrated Level-Up Workflow

### 3.1 Flow After XP Distribution

When a Pokemon levels up after XP distribution:

1. `LevelUpNotification.vue` shows the level-up summary
2. For each leveled Pokemon, show action buttons:
   - "Allocate Stats" (always, if stat points are unallocated)
   - "Assign Ability" (if Level 20 or 40 milestone was crossed AND ability count is eligible)
   - "Learn Moves" (if new moves are available from learnset)
3. Each button either opens a modal or navigates to the Pokemon sheet

### 3.2 Flow in Pokemon Sheet

When editing a Pokemon's level in the sheet:

1. `PokemonLevelUpPanel.vue` shows what happens at each level
2. Below the info, action sections appear:
   - `StatAllocationPanel` (from P0) for stat points
   - `AbilityAssignmentPanel` for ability milestones
   - `MoveLearningPanel` for new moves
3. Each section can be completed independently in any order

### 3.3 Composable Extension: `useLevelUpAllocation()`

Extend the P0 composable to include ability and move state:

```typescript
// Add to useLevelUpAllocation():

/** Check if an ability milestone is pending */
const pendingAbilityMilestone = computed((): 'second' | 'third' | null => {
  if (!pokemonRef.value) return null
  const abilities = pokemonRef.value.abilities || []
  if (pokemonRef.value.level >= 40 && abilities.length < 3) return 'third'
  if (pokemonRef.value.level >= 20 && abilities.length < 2) return 'second'
  return null
})

/** Check if there are new moves available from learnset */
const pendingNewMoves = ref<string[]>([])

/** Fetch learnset moves for the current level */
async function checkNewMoves() {
  if (!pokemonRef.value) return
  const response = await $fetch(`/api/pokemon/${pokemonRef.value.id}/level-up-check`, {
    method: 'POST',
    body: { targetLevel: pokemonRef.value.level }
  })
  if (response.success) {
    pendingNewMoves.value = response.data.allNewMoves || []
  }
}

/** Whether the full level-up workflow has pending actions */
const hasPendingActions = computed(() => {
  return unallocatedPoints.value > 0 ||
         pendingAbilityMilestone.value !== null ||
         pendingNewMoves.value.length > 0
})
```

## 4. LevelUpNotification Enhancement

### 4.1 Action Buttons

Modify `LevelUpNotification.vue` to include action buttons per leveled Pokemon:

```vue
<!-- After the detail items for each entry -->
<div class="levelup-entry__actions">
  <NuxtLink
    :to="`/gm/pokemon/${entry.pokemonId}?edit=true`"
    class="btn btn--sm btn--primary"
  >
    <PhPencil :size="14" />
    Allocate Stats
  </NuxtLink>

  <button
    v-if="entry.abilityMilestones.length > 0"
    class="btn btn--sm btn--secondary"
    @click="$emit('assign-ability', entry.pokemonId, entry.abilityMilestones[0])"
  >
    <PhLightning :size="14" />
    Assign Ability
  </button>

  <button
    v-if="entry.allNewMoves.length > 0"
    class="btn btn--sm btn--secondary"
    @click="$emit('learn-move', entry.pokemonId, entry.allNewMoves)"
  >
    <PhSword :size="14" />
    Learn Moves
  </button>
</div>
```

### 4.2 New Events

```typescript
defineEmits<{
  (e: 'assign-ability', pokemonId: string, milestone: { level: number; type: string }): void
  (e: 'learn-move', pokemonId: string, moves: string[]): void
}>()
```

The parent component (`XpDistributionResults.vue`) handles these events by opening the appropriate panel/modal.

## 5. Implementation Order

1. **Ability pool utility** -- `getAbilityPool()` function
2. **Ability batch endpoint** -- `POST /api/abilities/batch`
3. **Assign ability endpoint** -- `POST /api/pokemon/:id/assign-ability`
4. **AbilityAssignmentPanel component** -- UI for ability selection
5. **Move batch endpoint** -- `POST /api/moves/batch`
6. **Learn move endpoint** -- `POST /api/pokemon/:id/learn-move`
7. **MoveLearningPanel component** -- UI for move selection
8. **Composable extension** -- Add ability/move state to `useLevelUpAllocation()`
9. **LevelUpNotification enhancement** -- Action buttons
10. **PokemonLevelUpPanel enhancement** -- Inline ability/move panels

## 6. Files Created/Modified

### New Files
- `app/utils/abilityAssignment.ts` -- Ability pool computation utility
- `app/server/api/pokemon/[id]/assign-ability.post.ts` -- Ability assignment endpoint
- `app/server/api/pokemon/[id]/learn-move.post.ts` -- Move learning endpoint
- `app/server/api/abilities/batch.post.ts` -- Batch ability lookup
- `app/server/api/moves/batch.post.ts` -- Batch move lookup
- `app/components/pokemon/AbilityAssignmentPanel.vue` -- Ability picker UI
- `app/components/pokemon/MoveLearningPanel.vue` -- Move learning UI

### Modified Files
- `app/composables/useLevelUpAllocation.ts` -- Add ability/move state
- `app/components/pokemon/PokemonLevelUpPanel.vue` -- Inline ability/move panels
- `app/components/encounter/LevelUpNotification.vue` -- Action buttons

## 7. Acceptance Criteria

### Ability Assignment (R014, R015)
- [ ] `getAbilityPool()` correctly categorizes abilities into Basic/Advanced/High
- [ ] Level 20 pool includes Basic + Advanced, excludes High
- [ ] Level 40 pool includes Basic + Advanced + High
- [ ] Already-held abilities are excluded from the pool
- [ ] `POST /api/pokemon/:id/assign-ability` validates level requirement
- [ ] `POST /api/pokemon/:id/assign-ability` validates ability count
- [ ] `POST /api/pokemon/:id/assign-ability` validates ability is in the correct pool
- [ ] `POST /api/pokemon/:id/assign-ability` fetches effect text from AbilityData
- [ ] `AbilityAssignmentPanel` displays pool with category labels and effect text
- [ ] Only available abilities are selectable
- [ ] Assignment persists to database and updates UI

### Move Learning (R028)
- [ ] `POST /api/pokemon/:id/learn-move` validates move exists in MoveData
- [ ] `POST /api/pokemon/:id/learn-move` prevents duplicate moves
- [ ] `POST /api/pokemon/:id/learn-move` enforces 6-move maximum
- [ ] `POST /api/pokemon/:id/learn-move` supports replace-by-index
- [ ] `MoveLearningPanel` displays current moves with type and details
- [ ] `MoveLearningPanel` displays available new moves with full info
- [ ] Move replacement UI works when at 6 moves
- [ ] "Skip" option allows declining all new moves
- [ ] Learning persists to database and updates UI

### Integrated Workflow
- [ ] `LevelUpNotification` shows action buttons for stat allocation, ability, and moves
- [ ] `PokemonLevelUpPanel` shows inline panels for ability and move actions
- [ ] Composable tracks pending actions across all three categories
- [ ] Each action can be completed independently in any order
