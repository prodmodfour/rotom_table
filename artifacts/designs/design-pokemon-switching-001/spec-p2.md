# P2 Specification: Polish — Immediate-Act, Separate Actions, Player View

P2 covers the remaining PTU switching mechanics: released Pokemon acting immediately when their initiative has passed, recall and release as individually tracked Shift Actions, player view switch requests, and detection of recall+release in the same round counting as a switch.

**Prerequisites:** P0 and P1 must be implemented first.

---

## K. Released Pokemon Immediate-Act Logic

### PTU Rule (p.229)

> "If a player has a Pokemon turn available, a Pokemon may act during the round it was released. If the Pokemon's Initiative Count has already passed, then this means they may act immediately."

This rule applies in **Full Contact** battles only. In League Battles, the switched-in Pokemon is restricted by the League rule (canBeCommanded = false for voluntary switches, Section G).

### Mechanics

When a Pokemon is released mid-round via a full switch (or standalone release in P2):

1. **Calculate the released Pokemon's initiative** (via `buildCombatantFromEntity`)
2. **Compare to current initiative position:**
   - If the Pokemon's initiative count is **still ahead** (higher than current combatant's initiative, and the Pokemon hasn't been inserted into an already-passed slot): the Pokemon will act in its normal initiative order later this round. No special handling needed — P0's `insertIntoTurnOrder` already places it correctly.
   - If the Pokemon's initiative count has **already passed** (its initiative is higher than the current combatant, but we're past that position in the turn order): the Pokemon may act **immediately** after the current combatant's turn resolves.

### Implementation

#### Detecting "Initiative Already Passed"

```typescript
/**
 * Check whether a newly released Pokemon's initiative has already passed
 * this round. If so, it can act immediately (Full Contact only).
 *
 * "Already passed" means: the new Pokemon's initiative is >= all remaining
 * unacted combatants' initiative values, AND the new Pokemon would have
 * acted earlier in the turn order if it had been present from the start.
 *
 * Simplified heuristic: if the new Pokemon's initiative is higher than the
 * current combatant's initiative, its turn has passed.
 */
export function hasInitiativeAlreadyPassed(
  newCombatant: Combatant,
  currentCombatant: Combatant | null
): boolean {
  if (!currentCombatant) return false
  return newCombatant.initiative > currentCombatant.initiative
}
```

#### Immediate Action Mechanism

When a released Pokemon can act immediately, it is given a special "immediate turn" after the current combatant finishes their turn. This is modeled by inserting the Pokemon as the **next combatant** in the turn order (immediately after `currentTurnIndex`):

```typescript
// In insertIntoFullContactTurnOrder, when immediate-act applies:
if (canActImmediately) {
  // Insert at currentTurnIndex + 1 (next to act)
  const actedSlots = turnOrder.slice(0, currentTurnIndex + 1)
  const unactedIds = turnOrder.slice(currentTurnIndex + 1)
  const newTurnOrder = [...actedSlots, newCombatant.id, ...unactedIds]
  return {
    turnOrder: newTurnOrder,
    // ... other fields
    currentTurnIndex // Unchanged — new Pokemon acts on next "next-turn" call
  }
}
```

#### Full Contact Example (PTU p.230)

> "Normally, Kadabra would be faster in the Initiative order than the Raticate. Since its Initiative Tick has already passed this round, it can act immediately and hits the Raticate with a Psybeam."

The flow:
1. Raticate acts (initiative 15)
2. Trainer acts (initiative 10), uses Standard Action to switch Wartortle for Kadabra
3. Kadabra has initiative 20 (already passed at position 15)
4. Kadabra is inserted as next-to-act and gets its turn immediately
5. Kadabra uses Psybeam on Raticate

#### League Battle Exception

In League Battles, immediate-act does NOT apply to voluntary switches (the Pokemon cannot be commanded). For fainted and forced switches in League Battles, the replacement Pokemon CAN act, but follows the standard Pokemon phase ordering (not immediate).

```typescript
// In the switch endpoint, determine canActThisRound:
const isFullContact = encounter.battleType === 'full_contact'
const canActImmediately = isFullContact &&
  hasInitiativeAlreadyPassed(newCombatant, currentCombatant) &&
  !body.faintedSwitch // Fainted switch exempts from League restriction but doesn't grant immediate act

// For the response:
switchDetails.canActThisRound = isFullContact || isFaintedSwitch || isForcedSwitch
```

---

## L. Recall and Release as Separate Tracked Actions

### PTU Rule (p.229)

> "Recall and Release actions can also be taken individually by a Trainer as Shift Actions."

### New Endpoint: `POST /api/encounters/[id]/recall.post.ts`

Recalls one or two Pokemon from the field as a Shift Action (one) or Standard Action (two).

**Request body:**

```typescript
interface RecallRequestBody {
  /** Combatant ID of the trainer performing the recall */
  trainerId: string
  /** Combatant IDs of the Pokemon to recall (1 = Shift, 2 = Standard) */
  pokemonCombatantIds: string[]
}
```

**Validation:**
1. Encounter exists and is active
2. Trainer combatant exists (type = 'human')
3. All Pokemon combatants exist (type = 'pokemon')
4. All Pokemon belong to the trainer (`entity.ownerId === trainer.entityId`)
5. All Pokemon are within 8m recall range (Full Contact only)
6. Array length is 1 or 2
7. If length 1: trainer has Shift Action available
8. If length 2: trainer has Standard Action available

**Execution:**
1. Remove each recalled Pokemon from combatants and turn orders (reuse `removeCombatantFromEncounter`)
2. Record SwitchAction(s) with `actionType: 'recall_only'`
3. Mark appropriate action as used (Shift or Standard)
4. Track that this trainer has recalled this round (for Section N)
5. Save and broadcast

### New Endpoint: `POST /api/encounters/[id]/release.post.ts`

Releases one or two Pokemon onto the field as a Shift Action (one) or Standard Action (two).

**Request body:**

```typescript
interface ReleaseRequestBody {
  /** Combatant ID of the trainer performing the release */
  trainerId: string
  /** Entity IDs of the Pokemon to release (1 = Shift, 2 = Standard) */
  pokemonEntityIds: string[]
  /** Optional positions for each released Pokemon */
  positions?: Array<{ x: number; y: number } | null>
}
```

**Validation:**
1. Encounter exists and is active
2. Trainer combatant exists (type = 'human')
3. All Pokemon entities exist in DB
4. All Pokemon belong to the trainer
5. None are already in the encounter
6. None are fainted
7. Array length is 1 or 2
8. If length 1: trainer has Shift Action available
9. If length 2: trainer has Standard Action available

**Execution:**
1. For each Pokemon:
   - Load from DB, build entity via `buildPokemonEntityFromRecord`
   - Build combatant via `buildCombatantFromEntity`
   - Place at specified position or auto-place near trainer
   - Insert into turn order (Section D logic)
2. Record SwitchAction(s) with `actionType: 'release_only'`
3. Mark appropriate action as used
4. Track that this trainer has released this round (for Section N)
5. Apply immediate-act logic (Section K) if applicable
6. Save and broadcast

### Placement for Released Pokemon

When a Pokemon is released (without recalling another), it doesn't inherit a recalled Pokemon's position. Instead:

1. If `positions` array specifies a position: use it (GM-chosen placement)
2. Otherwise: auto-place adjacent to the trainer on the grid

```typescript
/**
 * Find a grid position adjacent to the trainer for releasing a Pokemon.
 * Checks all 8 surrounding cells (and further if all adjacent are occupied).
 */
export function findAdjacentPosition(
  trainerPosition: GridPosition,
  occupiedCells: Set<string>,
  tokenSize: number,
  gridWidth: number,
  gridHeight: number
): GridPosition {
  // Check adjacent cells in priority order: right, below, left, above, then diagonals
  const offsets = [
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
  ]

  for (const offset of offsets) {
    const pos = {
      x: trainerPosition.x + offset.x,
      y: trainerPosition.y + offset.y
    }
    if (canFitAt(pos, tokenSize, gridWidth, gridHeight, occupiedCells)) {
      return pos
    }
  }

  // Expand search radius if all adjacent are occupied
  return findPlacementPosition(
    occupiedCells, 'players', tokenSize, gridWidth, gridHeight
  )
}
```

---

## M. Player View Switch Request

### Context

In the Player View, players should be able to request a Pokemon switch on their trainer's or Pokemon's turn. This follows the existing player action request pattern from `app/types/player-sync.ts`.

### WebSocket Flow

The `PlayerActionRequest` type already includes `switch_pokemon` as a `PlayerActionType`:

```typescript
// From app/types/player-sync.ts:
export type PlayerActionType =
  | 'use_move' | 'shift' | 'struggle' | 'pass'
  | 'use_item' | 'switch_pokemon' | 'maneuver' | 'move_token'
```

**Player-initiated switch request:**

```typescript
const switchRequest: PlayerActionRequest = {
  requestId: uuidv4(),
  playerId: 'player-id',
  playerName: 'Mira',
  action: 'switch_pokemon',
  pokemonId: 'replacement-entity-id',  // The Pokemon to release
  pokemonName: 'Pikachu',
  // targetIds: [currentPokemonCombatantId] // The Pokemon to recall
}
```

**Flow:**
1. Player sends `player_action` WebSocket message with `switch_pokemon` action
2. Server relays to GM via WebSocket
3. GM sees the switch request in the GM encounter panel
4. GM approves or rejects:
   - **Approve**: GM clicks "Execute Switch" which calls the switch endpoint with the player's parameters
   - **Reject**: GM sends `PlayerActionAck` with `status: 'rejected'`
5. Player receives acknowledgment

### Player UI Component

In the Player View encounter panel, add a "Switch Pokemon" button that:
- Appears when it's the player's trainer's turn or their Pokemon's turn
- Opens a selection modal showing the player's bench Pokemon
- Sends a `switch_pokemon` request via WebSocket
- Shows pending/accepted/rejected status
- Disables while a request is pending

### Composable: `app/composables/usePlayerCombat.ts`

The existing `usePlayerCombat` composable already handles player action requests. Extend it to support switch requests:

```typescript
// Add to usePlayerCombat:
async function requestSwitch(
  recallCombatantId: string,
  releaseEntityId: string,
  releaseName: string
) {
  const request: PlayerActionRequest = {
    requestId: uuidv4(),
    playerId: playerId.value,
    playerName: playerName.value,
    action: 'switch_pokemon',
    pokemonId: releaseEntityId,
    pokemonName: releaseName,
    targetIds: [recallCombatantId]
  }
  sendPlayerAction(request)
}
```

---

## N. Recall+Release in Same Round = Switch Detection

### PTU Rule (p.229)

> "Recalling and then Releasing by using two Shift Actions in one Round still counts as a Switch, even if they are declared as separate actions, and you may not do this to Recall and then Release the same Pokemon in one round."

### Detection Logic

After each recall or release action, check the round's `switchActions` to determine if a recall+release pair exists for the same trainer:

```typescript
/**
 * Check if a trainer has performed both a recall and a release this round.
 * If so, the combined actions count as a Switch for League restriction purposes.
 *
 * Also enforces: cannot Recall and Release the same Pokemon in one round.
 */
export function checkRecallReleasePair(
  switchActions: SwitchAction[],
  trainerId: string,
  round: number
): {
  countsAsSwitch: boolean
  recalledEntityIds: string[]
  releasedEntityIds: string[]
} {
  const trainerActions = switchActions.filter(
    a => a.trainerId === trainerId && a.round === round
  )

  const recalledEntityIds = trainerActions
    .filter(a => a.recalledEntityId !== null)
    .map(a => a.recalledEntityId!)

  const releasedEntityIds = trainerActions
    .filter(a => a.releasedEntityId !== null)
    .map(a => a.releasedEntityId!)

  const countsAsSwitch = recalledEntityIds.length > 0 && releasedEntityIds.length > 0

  return { countsAsSwitch, recalledEntityIds, releasedEntityIds }
}
```

**In the release endpoint, apply League restriction if recall+release forms a switch:**

```typescript
// After recording the release action:
const pairCheck = checkRecallReleasePair(
  updatedSwitchActions, body.trainerId, encounter.currentRound
)

if (pairCheck.countsAsSwitch && encounter.battleType === 'trainer') {
  // Apply League switch restriction to the newly released Pokemon
  for (const releasedId of pairCheck.releasedEntityIds) {
    const released = combatants.find(c => c.entityId === releasedId)
    if (released) {
      released.turnState.canBeCommanded = false
    }
  }
}
```

**Same-Pokemon validation in release endpoint:**

```typescript
// Cannot release a Pokemon that was recalled this round
const pairCheck = checkRecallReleasePair(
  switchActions, body.trainerId, encounter.currentRound
)

for (const entityId of body.pokemonEntityIds) {
  if (pairCheck.recalledEntityIds.includes(entityId)) {
    throw createError({
      statusCode: 400,
      message: 'Cannot release a Pokemon that was recalled this same round'
    })
  }
}
```

**Same-Pokemon validation in recall endpoint:**

```typescript
// Cannot recall a Pokemon that was released this round
for (const combatantId of body.pokemonCombatantIds) {
  const pokemon = combatants.find(c => c.id === combatantId)
  if (pokemon && pairCheck.releasedEntityIds.includes(pokemon.entityId)) {
    throw createError({
      statusCode: 400,
      message: 'Cannot recall a Pokemon that was released this same round'
    })
  }
}
```

---

## Implementation Order Within P2

1. **K first** (Immediate-Act) — modifies `insertIntoTurnOrder` and switch endpoint response
2. **L second** (Recall/Release endpoints) — depends on K for release immediate-act
3. **N third** (Recall+Release detection) — depends on L for separate action tracking
4. **M last** (Player View) — independent of K/L/N, but benefits from all being in place
