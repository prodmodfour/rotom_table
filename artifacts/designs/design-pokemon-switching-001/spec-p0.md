# P0 Specification: Core Pokemon Switching (Full Switch as Standard Action)

P0 covers the fundamental switching workflow: a trainer spends a Standard Action to recall one Pokemon and release another, with 8m range validation on the VTT grid, proper initiative insertion, and encounter store integration.

---

## A. Switch Data Model

### Extended Types: `app/types/combat.ts`

Add `SwitchAction` interface to track switching activity per round:

```typescript
/**
 * Tracks a switching action performed during a combat round.
 * Used to enforce action economy and League restrictions.
 * Cleared at the start of each new round.
 */
export interface SwitchAction {
  /** Combatant ID of the trainer who performed the switch */
  trainerId: string
  /** Combatant ID of the recalled Pokemon (null if release-only) */
  recalledCombatantId: string | null
  /** Entity ID of the recalled Pokemon */
  recalledEntityId: string | null
  /** Combatant ID of the released Pokemon (null if recall-only) */
  releasedCombatantId: string | null
  /** Entity ID of the released Pokemon */
  releasedEntityId: string | null
  /** Type of switch action */
  actionType: 'full_switch' | 'fainted_switch' | 'recall_only' | 'release_only' | 'forced_switch'
  /** Action cost */
  actionCost: 'standard' | 'shift'
  /** Round number */
  round: number
  /** Whether forced by a move (Roar, etc.) */
  forced: boolean
}
```

### Extended Types: `app/types/encounter.ts`

Add `switchActions` field to the `Encounter` interface:

```typescript
export interface Encounter {
  // ... existing fields ...

  /** Per-round switch action log. Cleared at round start. */
  switchActions: SwitchAction[]
}
```

### Prisma Schema: `app/prisma/schema.prisma`

Add a JSON column to the Encounter model:

```prisma
model Encounter {
  // ... existing fields ...

  // Per-round Pokemon switch tracking (JSON array of SwitchAction)
  // Cleared at the start of each new round
  switchActions  String   @default("[]")
}
```

### Encounter Service: `app/server/services/encounter.service.ts`

Update `ParsedEncounter` and `buildEncounterResponse` to include `switchActions`:

```typescript
export interface ParsedEncounter {
  // ... existing fields ...
  switchActions: SwitchAction[]
}
```

In `buildEncounterResponse()`:
```typescript
switchActions: options?.switchActions ?? JSON.parse(record.switchActions || '[]')
```

---

## B. Full Switch API Endpoint

### New File: `app/server/api/encounters/[id]/switch.post.ts`

This is the core switching endpoint. It handles a full PTU switch: recall one Pokemon + release another as a single Standard Action.

**Request body:**

```typescript
interface SwitchRequestBody {
  /** Combatant ID of the trainer performing the switch */
  trainerId: string
  /** Combatant ID of the Pokemon being recalled */
  recallCombatantId: string
  /** Entity ID of the Pokemon being released (from DB, not yet a combatant) */
  releaseEntityId: string
  /** Fainted switch — uses Shift Action instead of Standard (P1, ignored in P0) */
  faintedSwitch?: boolean
  /** Forced by a move effect — exempts from League restriction (P1, ignored in P0) */
  forced?: boolean
  /** Override position for released Pokemon (default: recalled Pokemon's position) */
  releasePosition?: { x: number; y: number }
}
```

**Validation chain (in order):**

1. **Encounter exists and is active**
2. **Trainer combatant exists** — `trainerId` resolves to a combatant of type `'human'`
3. **Recalled Pokemon combatant exists** — `recallCombatantId` resolves to a combatant of type `'pokemon'`
4. **Recalled Pokemon belongs to trainer** — `recalledPokemon.entity.ownerId === trainer.entityId`
5. **Released Pokemon entity exists in DB** — load from `prisma.pokemon.findUnique({ where: { id: releaseEntityId } })`
6. **Released Pokemon belongs to trainer** — `releasedPokemonRecord.ownerId === trainer.entityId`
7. **Released Pokemon is not already in the encounter** — no combatant has `entityId === releaseEntityId`
8. **Released Pokemon is not fainted** — `releasedPokemonRecord.currentHp > 0`
9. **Range check** — trainer is within 8m of recalled Pokemon (see Section C)
10. **Action availability** — initiating combatant has Standard Action available (see below)

**Who spends the action?**

Per PTU p.229: "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts."

- If the switch is initiated on the **Trainer's turn** (current combatant is the trainer): mark `trainer.turnState.standardActionUsed = true`
- If the switch is initiated on the **Pokemon's turn** (current combatant is the recalled Pokemon): mark `recalledPokemon.turnState.standardActionUsed = true`. The Pokemon uses its own Standard Action to recall itself.

The endpoint validates that the initiating combatant (`trainerId` for trainer turn, or `recallCombatantId` for Pokemon turn) is either:
- The current turn's combatant, OR
- A combatant with a held action that has not yet been used

**Execution steps:**

```typescript
// 1. Record switch action
const switchAction: SwitchAction = {
  trainerId,
  recalledCombatantId: recallCombatantId,
  recalledEntityId: recalledPokemon.entityId,
  releasedCombatantId: null, // Set after building new combatant
  releasedEntityId: releaseEntityId,
  actionType: 'full_switch',
  actionCost: 'standard',
  round: encounter.currentRound,
  forced: false
}

// 2. Capture recalled Pokemon's grid position (for placement)
const recalledPosition = recalledPokemon.position

// 3. Remove recalled Pokemon from combatants and turn orders
//    (Reuse logic from [combatantId].delete.ts, extracted to switching.service.ts)
const { combatants, turnOrder, trainerTurnOrder, pokemonTurnOrder, currentTurnIndex }
  = removeCombatantFromEncounter(encounter, recallCombatantId)

// 4. Load released Pokemon from DB and build combatant
const releasedEntity = buildPokemonEntityFromRecord(releasedPokemonRecord)
const tokenSize = sizeToTokenSize(capabilities.size)
const newCombatant = buildCombatantFromEntity({
  entityType: 'pokemon',
  entityId: releaseEntityId,
  entity: releasedEntity,
  side: recalledPokemon.side,
  position: releasePosition ?? recalledPosition,
  tokenSize
})

// 5. Insert new combatant into combatants array
combatants.push(newCombatant)

// 6. Insert into turn order at correct initiative position
//    (See Section D)
const updatedOrders = insertIntoTurnOrder(
  newCombatant,
  combatants,
  turnOrder,
  trainerTurnOrder,
  pokemonTurnOrder,
  currentTurnIndex,
  encounter.battleType,
  encounter.currentPhase
)

// 7. Update switch action with new combatant ID
switchAction.releasedCombatantId = newCombatant.id

// 8. Mark action as used on initiating combatant
markActionUsed(initiatingCombatant, 'standard')

// 9. Add to switch actions log
const switchActions = [...existingSwitchActions, switchAction]

// 10. Persist to DB
await prisma.encounter.update({
  where: { id: encounterId },
  data: {
    combatants: JSON.stringify(combatants),
    turnOrder: JSON.stringify(updatedOrders.turnOrder),
    trainerTurnOrder: JSON.stringify(updatedOrders.trainerTurnOrder),
    pokemonTurnOrder: JSON.stringify(updatedOrders.pokemonTurnOrder),
    currentTurnIndex: updatedOrders.currentTurnIndex,
    switchActions: JSON.stringify(switchActions)
  }
})
```

**Response:**

```typescript
{
  success: true,
  data: {
    encounter: ParsedEncounter,
    switchDetails: {
      trainerName: string,
      recalledName: string,
      releasedName: string,
      actionCost: 'standard',
      rangeToRecalled: number,
      releasedInitiative: number,
      canActThisRound: boolean
    }
  }
}
```

---

## C. Range Validation (8m Recall Range)

### New Function in `app/server/services/switching.service.ts`

```typescript
import { ptuDiagonalDistance } from '~/utils/gridDistance'
import type { GridPosition } from '~/types'

const POKEBALL_RECALL_RANGE = 8

/**
 * Check if a trainer is within Poke Ball recall range (8m) of a Pokemon.
 *
 * PTU p.229: "A Trainer cannot Switch or Recall their Pokemon if their active
 * Pokemon is out of range of their Poke Ball's recall beam – 8 meters."
 *
 * PTU p.229: "During a League Battle, Trainers are generally considered to
 * always be in Switching range."
 *
 * @returns { inRange, distance }
 */
export function checkRecallRange(
  trainerPosition: GridPosition | undefined,
  pokemonPosition: GridPosition | undefined,
  isLeagueBattle: boolean
): { inRange: boolean; distance: number } {
  // League Battles: always in range
  if (isLeagueBattle) {
    return { inRange: true, distance: 0 }
  }

  // No positions (gridless play or pre-placement): assume in range
  if (!trainerPosition || !pokemonPosition) {
    return { inRange: true, distance: 0 }
  }

  // Calculate PTU diagonal distance
  const dx = pokemonPosition.x - trainerPosition.x
  const dy = pokemonPosition.y - trainerPosition.y
  const distance = ptuDiagonalDistance(dx, dy)

  return {
    inRange: distance <= POKEBALL_RECALL_RANGE,
    distance
  }
}
```

**Where the range check fires in the switch endpoint:**

```typescript
// In switch.post.ts validation chain (step 9):
const trainerCombatant = findCombatant(combatants, body.trainerId)
const recalledCombatant = findCombatant(combatants, body.recallCombatantId)
const isLeague = encounter.battleType === 'trainer'

const rangeResult = checkRecallRange(
  trainerCombatant.position,
  recalledCombatant.position,
  isLeague
)

if (!rangeResult.inRange) {
  throw createError({
    statusCode: 400,
    message: `Pokemon is out of recall range (${rangeResult.distance}m, max 8m)`
  })
}
```

---

## D. Initiative Slot Handling

### New Function in `app/server/services/switching.service.ts`

When a new Pokemon enters combat mid-round, it must be inserted into the turn order at the correct initiative position among **unacted** combatants only.

```typescript
import { sortByInitiativeWithRollOff } from '~/server/services/encounter.service'
import type { Combatant } from '~/types'

export interface TurnOrderInsertResult {
  turnOrder: string[]
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  currentTurnIndex: number
}

/**
 * Insert a new combatant into the turn order at the correct initiative position.
 *
 * Rules:
 * - Only inserted among UNACTED combatants (after currentTurnIndex)
 * - Position determined by initiative value (high-to-low for full contact and pokemon phase)
 * - Ties broken by initiativeRollOff (rolled during insertion)
 * - In League mode, inserted into pokemonTurnOrder only (not trainerTurnOrder)
 *
 * @param newCombatant - The newly released Pokemon combatant
 * @param allCombatants - All combatants including the new one
 * @param currentTurnOrder - Current active turn order
 * @param trainerTurnOrder - Trainer-specific turn order (League)
 * @param pokemonTurnOrder - Pokemon-specific turn order (League)
 * @param currentTurnIndex - Current position in the active turn order
 * @param battleType - 'trainer' or 'full_contact'
 * @param currentPhase - Current combat phase
 */
export function insertIntoTurnOrder(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  currentTurnOrder: string[],
  trainerTurnOrder: string[],
  pokemonTurnOrder: string[],
  currentTurnIndex: number,
  battleType: string,
  currentPhase: string
): TurnOrderInsertResult {
  if (battleType === 'trainer') {
    return insertIntoLeagueTurnOrder(
      newCombatant, allCombatants, currentTurnOrder,
      trainerTurnOrder, pokemonTurnOrder, currentTurnIndex, currentPhase
    )
  }

  return insertIntoFullContactTurnOrder(
    newCombatant, allCombatants, currentTurnOrder, currentTurnIndex
  )
}

/**
 * Insert into full contact turn order (single list, high-to-low initiative).
 */
function insertIntoFullContactTurnOrder(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  turnOrder: string[],
  currentTurnIndex: number
): TurnOrderInsertResult {
  // Split into acted (frozen) and unacted (sortable)
  const actedSlots = turnOrder.slice(0, currentTurnIndex + 1)
  const unactedIds = turnOrder.slice(currentTurnIndex + 1)

  // Add the new combatant to unacted, then re-sort by initiative
  const unactedWithNew = [...unactedIds, newCombatant.id]
  const unactedCombatants = unactedWithNew
    .map(id => allCombatants.find(c => c.id === id))
    .filter((c): c is Combatant => c !== undefined)

  const sorted = sortByInitiativeWithRollOff(unactedCombatants, true)
  const newTurnOrder = [...actedSlots, ...sorted.map(c => c.id)]

  return {
    turnOrder: newTurnOrder,
    trainerTurnOrder: [],
    pokemonTurnOrder: [],
    currentTurnIndex
  }
}

/**
 * Insert into League Battle turn order.
 * New Pokemon goes into pokemonTurnOrder only.
 * If pokemon phase is active, also insert into current turnOrder.
 */
function insertIntoLeagueTurnOrder(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  currentTurnOrder: string[],
  trainerTurnOrder: string[],
  pokemonTurnOrder: string[],
  currentTurnIndex: number,
  currentPhase: string
): TurnOrderInsertResult {
  // Always insert into pokemonTurnOrder (stored order for future rounds)
  const updatedPokemonOrder = insertSortedDescending(
    newCombatant, allCombatants, pokemonTurnOrder
  )

  let updatedTurnOrder = currentTurnOrder
  let updatedTurnIndex = currentTurnIndex

  if (currentPhase === 'pokemon') {
    // Pokemon phase active: insert into current turn order among unacted
    const actedSlots = currentTurnOrder.slice(0, currentTurnIndex + 1)
    const unactedIds = currentTurnOrder.slice(currentTurnIndex + 1)
    const unactedWithNew = [...unactedIds, newCombatant.id]
    const unactedCombatants = unactedWithNew
      .map(id => allCombatants.find(c => c.id === id))
      .filter((c): c is Combatant => c !== undefined)
    const sorted = sortByInitiativeWithRollOff(unactedCombatants, true)
    updatedTurnOrder = [...actedSlots, ...sorted.map(c => c.id)]
    updatedTurnIndex = currentTurnIndex
  }
  // If trainer phase: don't modify current turn order yet.
  // The Pokemon will appear when pokemon phase starts (turnOrder = pokemonTurnOrder).

  return {
    turnOrder: updatedTurnOrder,
    trainerTurnOrder, // Unchanged — new combatant is a Pokemon
    pokemonTurnOrder: updatedPokemonOrder,
    currentTurnIndex: updatedTurnIndex
  }
}

/**
 * Insert a combatant ID into a list sorted by descending initiative.
 * Used for the stored pokemonTurnOrder (high-to-low).
 */
function insertSortedDescending(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  order: string[]
): string[] {
  const result = [...order]
  const newInit = newCombatant.initiative

  // Find insertion point: first position where existing init < new init
  let insertIdx = result.length
  for (let i = 0; i < result.length; i++) {
    const existing = allCombatants.find(c => c.id === result[i])
    if (existing && existing.initiative < newInit) {
      insertIdx = i
      break
    }
    // Tie: insert after existing (existing was first, keeps priority)
    if (existing && existing.initiative === newInit) {
      insertIdx = i + 1
    }
  }

  result.splice(insertIdx, 0, newCombatant.id)
  return result
}
```

---

## E. Encounter Store Actions

### Updated Store: `app/stores/encounter.ts`

Add a `switchPokemon` action to the encounter store:

```typescript
// In the actions block of useEncounterStore:

/** Perform a full Pokemon switch (recall one, release another) */
async switchPokemon(
  trainerId: string,
  recallCombatantId: string,
  releaseEntityId: string,
  options?: {
    faintedSwitch?: boolean
    forced?: boolean
    releasePosition?: { x: number; y: number }
  }
) {
  if (!this.encounter) return

  try {
    const response = await $fetch<{
      data: {
        encounter: Encounter
        switchDetails: {
          trainerName: string
          recalledName: string
          releasedName: string
          actionCost: 'standard' | 'shift'
          rangeToRecalled: number
          releasedInitiative: number
          canActThisRound: boolean
        }
      }
    }>(`/api/encounters/${this.encounter.id}/switch`, {
      method: 'POST',
      body: {
        trainerId,
        recallCombatantId,
        releaseEntityId,
        faintedSwitch: options?.faintedSwitch ?? false,
        forced: options?.forced ?? false,
        releasePosition: options?.releasePosition
      }
    })
    this.encounter = response.data.encounter
    return response.data
  } catch (e: any) {
    this.error = e.message || 'Failed to switch Pokemon'
    throw e
  }
}
```

### Updated Store Getter

Add a getter to find a trainer's available Pokemon for switching:

```typescript
// In the getters block:

/** Get Pokemon owned by a trainer that are NOT currently in the encounter */
trainerBenchPokemon: (state) => (trainerEntityId: string): string[] => {
  if (!state.encounter) return []
  const activePokemonEntityIds = new Set(
    state.encounter.combatants
      .filter(c => c.type === 'pokemon')
      .map(c => c.entityId)
  )
  // Returns entity IDs of bench Pokemon. UI fetches details separately.
  return [] // Populated by composable that queries trainer's Pokemon from API
}
```

Note: The actual bench Pokemon list requires a separate API call to fetch the trainer's full Pokemon roster, then filtering out those already in the encounter. This is handled by the `useSwitching` composable (Section F).

---

## F. Basic GM UI for Switching

### New Composable: `app/composables/useSwitching.ts`

```typescript
/**
 * Composable for Pokemon switching workflow.
 * Provides validation, bench Pokemon loading, and switch execution.
 */
export function useSwitching() {
  const encounterStore = useEncounterStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get a trainer's bench Pokemon (owned, not in encounter, not fainted).
   * Fetches from API, filters out currently active combatants.
   */
  async function getBenchPokemon(trainerEntityId: string): Promise<Pokemon[]> {
    const response = await $fetch<{ data: Pokemon[] }>(
      `/api/characters/${trainerEntityId}/pokemon`
    )
    const allPokemon = response.data

    // Filter: not in encounter, not fainted, in library
    const activePokemonIds = new Set(
      encounterStore.encounter?.combatants
        .filter(c => c.type === 'pokemon')
        .map(c => c.entityId) ?? []
    )

    return allPokemon.filter(p =>
      !activePokemonIds.has(p.id) &&
      p.currentHp > 0 &&
      p.isInLibrary
    )
  }

  /**
   * Check if a trainer can switch their Pokemon (has Standard Action,
   * Pokemon is in range, etc.).
   */
  function canSwitch(trainerId: string, pokemonCombatantId: string): {
    allowed: boolean
    reason?: string
  } {
    const encounter = encounterStore.encounter
    if (!encounter) return { allowed: false, reason: 'No active encounter' }

    const trainer = encounter.combatants.find(c => c.id === trainerId)
    if (!trainer) return { allowed: false, reason: 'Trainer not found' }

    const pokemon = encounter.combatants.find(c => c.id === pokemonCombatantId)
    if (!pokemon) return { allowed: false, reason: 'Pokemon not found' }

    // Check if this is the correct turn
    const currentId = encounter.turnOrder[encounter.currentTurnIndex]
    const isTrainerTurn = currentId === trainerId
    const isPokemonTurn = currentId === pokemonCombatantId

    if (!isTrainerTurn && !isPokemonTurn) {
      return { allowed: false, reason: 'Not this combatant\'s turn' }
    }

    // Check Standard Action availability on the initiating combatant
    const initiator = isTrainerTurn ? trainer : pokemon
    if (initiator.turnState.standardActionUsed) {
      return { allowed: false, reason: 'Standard Action already used' }
    }

    return { allowed: true }
  }

  /**
   * Execute a full switch.
   */
  async function executeSwitch(
    trainerId: string,
    recallCombatantId: string,
    releaseEntityId: string,
    options?: { faintedSwitch?: boolean; forced?: boolean }
  ) {
    loading.value = true
    error.value = null
    try {
      const result = await encounterStore.switchPokemon(
        trainerId,
        recallCombatantId,
        releaseEntityId,
        options
      )
      return result
    } catch (e: any) {
      error.value = e.message || 'Switch failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getBenchPokemon,
    canSwitch,
    executeSwitch
  }
}
```

### New Component: `app/components/encounter/SwitchPokemonModal.vue`

A modal triggered from the encounter combat UI when the GM clicks "Switch Pokemon" on a trainer or Pokemon's turn.

**Component behavior:**
1. Opens with the active trainer and their current Pokemon pre-selected
2. Loads bench Pokemon via `useSwitching().getBenchPokemon()`
3. Displays bench Pokemon as selectable cards (species, level, HP, sprite)
4. Shows recall range indicator if VTT grid is active
5. Validates action availability and shows errors
6. Confirm button calls `useSwitching().executeSwitch()`
7. Closes on success, updates encounter state

**Props:**
```typescript
interface SwitchPokemonModalProps {
  trainerId: string
  pokemonCombatantId: string
  visible: boolean
}
```

**Emits:** `@close`, `@switched`

The component uses Phosphor Icons for the switch action button (e.g., `PhArrowsClockwise`). No emojis.

### Integration Point: Encounter Turn Panel

The existing encounter turn panel (where the GM manages the current combatant's actions) needs a "Switch Pokemon" button that:
- Appears when the current combatant is a trainer OR a Pokemon owned by a trainer
- Is disabled when the Standard Action is already used
- Opens `SwitchPokemonModal` with the correct trainer/Pokemon IDs

---

## Switching Service: `app/server/services/switching.service.ts`

New service file that centralizes switching logic. Contains:

1. `checkRecallRange()` — 8m range validation (Section C)
2. `insertIntoTurnOrder()` — initiative insertion (Section D)
3. `removeCombatantFromEncounter()` — extracted from `[combatantId].delete.ts`
4. `markActionUsed()` — mark Standard or Shift action on a combatant
5. `buildSwitchAction()` — create SwitchAction record
6. `validateSwitch()` — full validation chain (ownership, range, actions, duplicates)

### Extracted Function: `removeCombatantFromEncounter`

Currently, the remove-combatant logic lives inline in `[combatantId].delete.ts`. Extract it to the switching service so both the delete endpoint and the switch endpoint can use it:

```typescript
export interface RemovalResult {
  combatants: Combatant[]
  turnOrder: string[]
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  currentTurnIndex: number
}

/**
 * Remove a combatant from the encounter's arrays and turn orders.
 * Returns new arrays (does not mutate inputs except the parsed combatants
 * array, which is freshly parsed from JSON).
 */
export function removeCombatantFromEncounter(
  combatants: Combatant[],
  turnOrder: string[],
  trainerTurnOrder: string[],
  pokemonTurnOrder: string[],
  currentTurnIndex: number,
  combatantId: string
): RemovalResult {
  // Remove from combatants
  const updatedCombatants = combatants.filter(c => c.id !== combatantId)

  // Remove from all turn orders
  const updatedTurnOrder = turnOrder.filter(id => id !== combatantId)
  const updatedTrainerOrder = trainerTurnOrder.filter(id => id !== combatantId)
  const updatedPokemonOrder = pokemonTurnOrder.filter(id => id !== combatantId)

  // Adjust current turn index
  // If the removed combatant was before or at the current index, shift back
  const removedIdx = turnOrder.indexOf(combatantId)
  let adjustedIndex = currentTurnIndex
  if (removedIdx !== -1 && removedIdx < currentTurnIndex) {
    adjustedIndex = Math.max(0, currentTurnIndex - 1)
  }
  if (adjustedIndex >= updatedTurnOrder.length) {
    adjustedIndex = Math.max(0, updatedTurnOrder.length - 1)
  }

  return {
    combatants: updatedCombatants,
    turnOrder: updatedTurnOrder,
    trainerTurnOrder: updatedTrainerOrder,
    pokemonTurnOrder: updatedPokemonOrder,
    currentTurnIndex: adjustedIndex
  }
}
```

### `markActionUsed`

```typescript
/**
 * Mark an action type as used on a combatant.
 * Mutates the combatant's turnState (acceptable because combatants
 * are freshly parsed from JSON in the endpoint handler).
 */
export function markActionUsed(
  combatant: Combatant,
  actionType: 'standard' | 'shift'
): void {
  if (actionType === 'standard') {
    combatant.turnState.standardActionUsed = true
  } else {
    combatant.turnState.shiftActionUsed = true
  }
}
```

---

## Clear `switchActions` on New Round

In `app/server/api/encounters/[id]/next-turn.post.ts`, add `switchActions` clearing alongside `declarations` clearing:

```typescript
// In the resetCombatantsForNewRound call sites:
if (clearDeclarations) {
  updateData.declarations = JSON.stringify([])
  updateData.switchActions = JSON.stringify([])  // NEW
}
```

Also clear on encounter start in `start.post.ts`:

```typescript
await prisma.encounter.update({
  where: { id },
  data: {
    // ... existing fields ...
    switchActions: JSON.stringify([])  // NEW
  }
})
```

---

## WebSocket Broadcast

After a successful switch, broadcast a `pokemon_switched` event to all connected clients:

```typescript
// In switch.post.ts, after DB save:
broadcastToEncounter(encounterId, {
  type: 'pokemon_switched',
  data: {
    encounterId,
    trainerId: body.trainerId,
    trainerName: getEntityName(trainerCombatant),
    recalledName: getEntityName(recalledCombatant),
    releasedName: getEntityName(newCombatant),
    releasedCombatantId: newCombatant.id,
    actionCost: 'standard'
  }
})
```

The `updateFromWebSocket` handler in the encounter store already handles full encounter state updates (combatant additions/removals), so the broadcast also includes the full encounter state for sync.
