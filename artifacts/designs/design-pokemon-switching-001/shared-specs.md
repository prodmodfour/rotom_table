# Shared Specifications

## Data Flow Diagram

```
GM INITIATES SWITCH (Full Switch — Standard Action):
  GM selects "Switch Pokemon" on trainer's turn
       |
       v
  SwitchPokemonModal opens
       |
       +---> GM selects Pokemon to recall (current active)
       +---> GM selects Pokemon to release (from trainer's bench)
       |
       v
  Client calls POST /api/encounters/:id/switch
       |
       v
  Server validates:
       |
       +---> Is it the trainer's or Pokemon's turn? (initiative check)
       +---> Does the trainer have a Standard Action available?
       +---> Is the recalled Pokemon within 8m of the trainer? (VTT range check)
       +---> Is the replacement Pokemon not already in the encounter?
       +---> Is the replacement Pokemon owned by this trainer?
       |
       v
  Server executes switch:
       |
       +---> Mark Standard Action as used on the initiating combatant
       +---> Remove recalled Pokemon from combatants array + turn order
       +---> Build new combatant from replacement Pokemon (via buildCombatantFromEntity)
       +---> Place new combatant at recalled Pokemon's grid position
       +---> Insert into turn order at appropriate initiative position
       +---> If League Battle: set canBeCommanded = false on new Pokemon (P1)
       +---> If initiative already passed: mark for immediate action (P2)
       +---> Save encounter state
       |
       v
  WebSocket broadcast: pokemon_switched event
       |
       v
  Client updates encounter store

FAINTED SWITCH (Shift Action — P1):
  Trainer's Pokemon faints
       |
       v
  GM selects "Switch Fainted Pokemon" (Shift Action)
       |
       v
  POST /api/encounters/:id/switch with { faintedSwitch: true }
       |
       v
  Server validates:
       +---> Is recalled Pokemon actually fainted?
       +---> Does the trainer have a Shift Action available?
       |
       v
  Server executes (same as above, but):
       +---> Mark Shift Action as used (not Standard)
       +---> In League Battle: canBeCommanded = true (fainted switch exempt)

RECALL ONLY (Shift Action — P2):
  POST /api/encounters/:id/recall
       |
       v
  Remove Pokemon from combatants, mark Shift Action used
  Track: trainerRecalledThisRound = true

RELEASE ONLY (Shift Action — P2):
  POST /api/encounters/:id/release
       |
       v
  Add Pokemon to combatants at position near trainer
  Mark Shift Action used
  Track: trainerReleasedThisRound = true
  If both recalled AND released this round: treat as Switch (League restriction applies)
```

---

## Existing Code Analysis

### Current Add/Remove Combatant Flow

The existing system has two paths for adding/removing combatants:

1. **Add**: `POST /api/encounters/:id/combatants` (`combatants.post.ts`)
   - Loads entity from DB via `buildPokemonEntityFromRecord` / `buildHumanEntityFromRecord`
   - Builds combatant via `buildCombatantFromEntity` (calculates initiative, evasions, stages)
   - Auto-places on grid via `findPlacementPosition` from `grid-placement.service.ts`
   - Pushes to combatants array, saves to DB
   - Does NOT modify turn order, trainer/pokemon turn order, or handle initiative insertion

2. **Remove**: `DELETE /api/encounters/:id/combatants/:combatantId` (`[combatantId].delete.ts`)
   - Splices from combatants array
   - Removes from `turnOrder`, `trainerTurnOrder`, `pokemonTurnOrder`
   - Adjusts `currentTurnIndex` if needed
   - Does NOT track the removal as an action or log it

**Critical gap**: Neither path enforces action economy, validates range, or handles initiative ordering for mid-combat additions. The new switching system must preserve these as raw GM tools (for setup/correction) while adding the formal PTU switching workflow alongside them.

### Turn State System

From `app/types/combat.ts`, the `TurnState` interface already has the `canBeCommanded` field:

```typescript
export interface TurnState {
  hasActed: boolean
  standardActionUsed: boolean
  shiftActionUsed: boolean
  swiftActionUsed: boolean
  canBeCommanded: boolean  // <-- KEY: Used by League switch restriction
  isHolding: boolean
  heldUntilInitiative?: number
}
```

This field is initialized to `true` in `buildCombatantFromEntity` and `resetCombatantsForNewRound` but is never set to `false` by any current code. The switching workflow will use this field for League Battle restrictions (P1).

### Initiative System

From `combatant.service.ts`:
- `buildCombatantFromEntity()` calculates initiative from speed + bonus
- `calculateCurrentInitiative()` recalculates with current CS-modified speed
- From `encounter.service.ts`: `sortByInitiativeWithRollOff()` handles tie-breaking
- From `encounter.service.ts`: `reorderInitiativeAfterSpeedChange()` re-sorts unacted combatants (decree-006)

The switching workflow needs to insert the new Pokemon into the correct position in the turn order, respecting:
- Whether the encounter is full contact (single turn order) or League (separate trainer/pokemon orders)
- The current turn index (new Pokemon must appear after current position in the unacted portion)
- Tie-breaking with existing combatants at the same initiative value

### VTT Grid Distance

From `app/utils/gridDistance.ts`:
- `ptuDiagonalDistance(dx, dy)` — PTU alternating diagonal rule: `diagonals + floor(diagonals/2) + straights`
- This is the pure geometric distance function. The 8m range check for switching uses this function directly (no terrain costs for range checks; only line-of-sight distance matters for Poke Ball recall beam).

From `app/composables/useGridMovement.ts`:
- `calculateMoveDistance(from, to)` wraps `ptuDiagonalDistance`
- The composable is client-side; the server-side range check will call `ptuDiagonalDistance` directly

### WebSocket Events

From `app/server/routes/ws.ts` and existing broadcast patterns, combat events follow the pattern:
```
{ type: 'event_name', data: { encounterId, ...payload } }
```

Existing combat broadcast events: `turn_change`, `damage_applied`, `heal_applied`, `status_change`, `move_executed`, `combatant_added`, `combatant_removed`.

The switching workflow adds: `pokemon_switched`, `pokemon_recalled`, `pokemon_released`.

---

## New Data Types

### SwitchAction (Tracking per-round switch activity)

```typescript
/**
 * Tracks a switching action performed during a round.
 * Used to enforce: (a) Standard Action cost, (b) League restriction,
 * (c) Recall+Release same round = Switch detection (P2).
 */
export interface SwitchAction {
  /** Combatant ID of the trainer who performed the switch */
  trainerId: string
  /** Combatant ID of the recalled Pokemon (null if release-only) */
  recalledCombatantId: string | null
  /** Entity ID of the recalled Pokemon (for DB reference) */
  recalledEntityId: string | null
  /** Combatant ID of the released Pokemon (null if recall-only) */
  releasedCombatantId: string | null
  /** Entity ID of the released Pokemon (for DB reference) */
  releasedEntityId: string | null
  /** Type of switch action */
  actionType: 'full_switch' | 'fainted_switch' | 'recall_only' | 'release_only' | 'forced_switch'
  /** Action cost type */
  actionCost: 'standard' | 'shift'
  /** Round number */
  round: number
  /** Whether this was forced by a move (Roar, etc.) */
  forced: boolean
}
```

### SwitchRequest (API request body)

```typescript
/**
 * Request body for POST /api/encounters/:id/switch
 */
export interface SwitchRequest {
  /** Combatant ID of the trainer performing the switch */
  trainerId: string
  /** Combatant ID of the Pokemon being recalled */
  recallCombatantId: string
  /** Entity ID of the Pokemon being released (from DB, not yet a combatant) */
  releaseEntityId: string
  /** Whether this is a fainted switch (Shift Action instead of Standard) */
  faintedSwitch?: boolean
  /** Whether this was forced by a move effect */
  forced?: boolean
  /** Optional override position for the released Pokemon (default: recalled Pokemon's position) */
  releasePosition?: { x: number; y: number }
}
```

### SwitchResult (API response)

```typescript
/**
 * Response from the switch endpoint.
 */
export interface SwitchResult {
  /** The full updated encounter state */
  encounter: Encounter
  /** Details of the switch for logging/display */
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
```

---

## Extended Encounter State

The `Encounter` interface needs a new field to track per-round switching actions:

```typescript
export interface Encounter {
  // ... existing fields ...

  /** Per-round switch action log. Cleared at round start. */
  switchActions: SwitchAction[]
}
```

This field is:
- Initialized to `[]` on encounter start
- Appended to on each switch/recall/release action
- Cleared on new round (same as `declarations`)
- Persisted as JSON in the `Encounter` Prisma model (new column: `switchActions String @default("[]")`)

---

## WebSocket Events

### pokemon_switched

Broadcast when a full switch occurs (recall + release as one action).

```typescript
{
  type: 'pokemon_switched',
  data: {
    encounterId: string
    trainerId: string
    trainerName: string
    recalledName: string
    releasedName: string
    releasedCombatantId: string
    actionCost: 'standard' | 'shift'
    canActThisRound: boolean
  }
}
```

### pokemon_recalled (P2)

Broadcast when a Pokemon is recalled without immediate replacement.

```typescript
{
  type: 'pokemon_recalled',
  data: {
    encounterId: string
    trainerId: string
    recalledName: string
    recalledCombatantId: string
  }
}
```

### pokemon_released (P2)

Broadcast when a Pokemon is released without recalling another.

```typescript
{
  type: 'pokemon_released',
  data: {
    encounterId: string
    trainerId: string
    releasedName: string
    releasedCombatantId: string
    canActImmediately: boolean
  }
}
```

---

## Range Check Logic

The 8m range check uses the PTU diagonal distance formula between the trainer's grid position and the Pokemon's grid position.

```typescript
/**
 * Check if a trainer is within Poke Ball recall range (8m) of a Pokemon.
 * Uses PTU diagonal distance (alternating 1m/2m diagonals).
 * Returns { inRange: boolean, distance: number }.
 *
 * Special cases:
 * - League Battles: trainers are always in range (PTU p.229)
 * - No grid/positions: always in range (gridless play)
 */
function checkRecallRange(
  trainerPosition: GridPosition | undefined,
  pokemonPosition: GridPosition | undefined,
  isLeagueBattle: boolean
): { inRange: boolean; distance: number }
```

Per PTU p.229: "During a League Battle, Trainers are generally considered to always be in Switching range." This means the range check is only enforced in Full Contact battles.

---

## Initiative Insertion Logic

When a new Pokemon is released mid-combat, it must be inserted into the turn order at the correct initiative position.

### Full Contact Mode

The new Pokemon's initiative is calculated via `buildCombatantFromEntity`. It is inserted into `turnOrder` at the appropriate position based on initiative value, but only among the **unacted** portion of the turn order (slots after `currentTurnIndex`). If the new Pokemon's initiative is higher than all remaining unacted combatants, it goes first among the unacted. If lower, it goes at the corresponding position.

```
Before switch (turnOrder, currentTurn = 2):
  [Acted1, Acted2, Current*, Unacted1(init=15), Unacted2(init=10)]

New Pokemon has init=12:
  [Acted1, Acted2, Current*, NewPokemon(init=12), Unacted1(init=15) ← WRONG]

Wait — must maintain descending order among unacted:
  [Acted1, Acted2, Current*, Unacted1(init=15), NewPokemon(init=12), Unacted2(init=10)]
```

The insertion respects decree-006: initiative is based on current CS-modified speed. Ties are broken by `initiativeRollOff`.

### League Battle Mode

In League mode, the new Pokemon is inserted into `pokemonTurnOrder` (high-to-low speed). It is NOT inserted into `trainerTurnOrder` (it's a Pokemon, not a trainer). The current phase determines whether the Pokemon can act this round:

- If we're in `trainer_declaration` or `trainer_resolution` phase: the Pokemon hasn't missed its turn yet (Pokemon phase hasn't started). It will appear in the Pokemon phase turn order.
- If we're in `pokemon` phase: the Pokemon is inserted among unacted Pokemon only.

---

## Existing Code Paths to Preserve

The new switching endpoints are **separate** from the existing add/remove combatant endpoints:

| Endpoint | Purpose | Preserved? |
|----------|---------|-----------|
| `POST /api/encounters/:id/combatants` | GM manually adds a combatant (pre-combat setup, corrections) | YES — unchanged |
| `DELETE /api/encounters/:id/combatants/:id` | GM manually removes a combatant (corrections, fleeing) | YES — unchanged |
| `POST /api/encounters/:id/switch` | **NEW** — Formal PTU switch with action economy | NEW |
| `POST /api/encounters/:id/recall` | **NEW** (P2) — Individual recall as Shift Action | NEW |
| `POST /api/encounters/:id/release` | **NEW** (P2) — Individual release as Shift Action | NEW |

The existing endpoints remain for non-switching scenarios (adding NPC reinforcements, removing fled combatants, pre-combat roster changes). The new endpoints enforce PTU switching rules.
