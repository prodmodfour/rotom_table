/**
 * Switching Service
 * Pure functions for Pokemon switching: validation, range checks,
 * initiative insertion, combatant removal, and action tracking.
 *
 * PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release
 * a Pokemon from its Poke Ball as a Standard Action on either the Trainer's
 * or the Pokemon's Initiative."
 */

import { ptuDiagonalDistance } from '~/utils/gridDistance'
import { sortByInitiativeWithRollOff } from '~/server/services/encounter.service'
import type { Combatant } from '~/types'
import type { SwitchAction } from '~/types/combat'
import type { GridPosition } from '~/types/spatial'

// ============================================
// CONSTANTS
// ============================================

/** PTU p.229: Poke Ball recall beam range */
export const POKEBALL_RECALL_RANGE = 8

// ============================================
// RANGE VALIDATION
// ============================================

/**
 * Check if a trainer is within Poke Ball recall range (8m) of a Pokemon.
 *
 * PTU p.229: "A Trainer cannot Switch or Recall their Pokemon if their active
 * Pokemon is out of range of their Poke Ball's recall beam -- 8 meters."
 *
 * PTU p.229: "During a League Battle, Trainers are generally considered to
 * always be in Switching range."
 *
 * Per decree-002: all grid distance uses ptuDiagonalDistance.
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

  // Calculate PTU diagonal distance (decree-002)
  const dx = pokemonPosition.x - trainerPosition.x
  const dy = pokemonPosition.y - trainerPosition.y
  const distance = ptuDiagonalDistance(dx, dy)

  return {
    inRange: distance <= POKEBALL_RECALL_RANGE,
    distance
  }
}

// ============================================
// COMBATANT REMOVAL
// ============================================

export interface RemovalResult {
  combatants: Combatant[]
  turnOrder: string[]
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  currentTurnIndex: number
}

/**
 * Remove a combatant from the encounter's arrays and turn orders.
 * Returns new arrays (immutable -- does not mutate inputs).
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

// ============================================
// IMMEDIATE-ACT DETECTION (P2 — Section K)
// ============================================

/**
 * Check whether a newly released Pokemon's initiative has already passed
 * this round. If so, it can act immediately (Full Contact only).
 *
 * "Already passed" means: the new Pokemon's initiative is higher than the
 * current combatant's initiative, so its turn slot was earlier in the round.
 *
 * PTU p.229: "If the Pokemon's Initiative Count has already passed, then
 * this means they may act immediately."
 */
export function hasInitiativeAlreadyPassed(
  newCombatant: Combatant,
  currentCombatant: Combatant | null
): boolean {
  if (!currentCombatant) return false
  return newCombatant.initiative > currentCombatant.initiative
}

// ============================================
// INITIATIVE INSERTION
// ============================================

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
 * - Position determined by initiative value (high-to-low)
 * - Ties broken by initiativeRollOff
 * - In League mode, inserted into pokemonTurnOrder only (decree-021)
 * - In Full Contact mode with canActImmediately=true, inserted as next-to-act (Section K)
 */
export function insertIntoTurnOrder(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  currentTurnOrder: string[],
  trainerTurnOrder: string[],
  pokemonTurnOrder: string[],
  currentTurnIndex: number,
  battleType: string,
  currentPhase: string,
  canActImmediately: boolean = false
): TurnOrderInsertResult {
  if (battleType === 'trainer') {
    return insertIntoLeagueTurnOrder(
      newCombatant, allCombatants, currentTurnOrder,
      trainerTurnOrder, pokemonTurnOrder, currentTurnIndex, currentPhase
    )
  }

  return insertIntoFullContactTurnOrder(
    newCombatant, allCombatants, currentTurnOrder, currentTurnIndex, canActImmediately
  )
}

/**
 * Insert into full contact turn order (single list, high-to-low initiative).
 *
 * When canActImmediately is true (Section K), the new combatant is inserted
 * as the next-to-act (immediately after currentTurnIndex) rather than being
 * sorted into the unacted portion by initiative.
 *
 * PTU p.229: "If the Pokemon's Initiative Count has already passed, then
 * this means they may act immediately."
 */
function insertIntoFullContactTurnOrder(
  newCombatant: Combatant,
  allCombatants: Combatant[],
  turnOrder: string[],
  currentTurnIndex: number,
  canActImmediately: boolean = false
): TurnOrderInsertResult {
  // Split into acted (frozen) and unacted (sortable)
  const actedSlots = turnOrder.slice(0, currentTurnIndex + 1)
  const unactedIds = turnOrder.slice(currentTurnIndex + 1)

  if (canActImmediately) {
    // Section K: Insert as next-to-act (immediately after current combatant)
    // The new Pokemon gets an immediate turn before the remaining unacted combatants
    const newTurnOrder = [...actedSlots, newCombatant.id, ...unactedIds]
    return {
      turnOrder: newTurnOrder,
      trainerTurnOrder: [],
      pokemonTurnOrder: [],
      currentTurnIndex // Unchanged — new Pokemon acts on next "next-turn" call
    }
  }

  // Standard insertion: add to unacted, re-sort by initiative
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
 * New Pokemon goes into pokemonTurnOrder only (decree-021).
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
    trainerTurnOrder, // Unchanged -- new combatant is a Pokemon
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

// ============================================
// ACTION TRACKING
// ============================================

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

// ============================================
// SWITCH ACTION BUILDER
// ============================================

/**
 * Build a SwitchAction record for the switch log.
 * Supports full_switch (Standard), fainted_switch (Shift), and forced_switch (no cost).
 */
export function buildSwitchAction(params: {
  trainerId: string
  recalledCombatantId: string
  recalledEntityId: string
  releasedCombatantId: string | null
  releasedEntityId: string
  round: number
  forced: boolean
  faintedSwitch?: boolean
}): SwitchAction {
  let actionType: SwitchAction['actionType'] = 'full_switch'
  let actionCost: SwitchAction['actionCost'] = 'standard'

  if (params.forced) {
    actionType = 'forced_switch'
    actionCost = 'shift' // Recorded for logging, but not actually consumed
  } else if (params.faintedSwitch) {
    actionType = 'fainted_switch'
    actionCost = 'shift'
  }

  return {
    trainerId: params.trainerId,
    recalledCombatantId: params.recalledCombatantId,
    recalledEntityId: params.recalledEntityId,
    releasedCombatantId: params.releasedCombatantId,
    releasedEntityId: params.releasedEntityId,
    actionType,
    actionCost,
    round: params.round,
    forced: params.forced
  }
}

// ============================================
// VALIDATION
// ============================================

export interface SwitchValidationResult {
  valid: boolean
  error?: string
  statusCode?: number
}

/**
 * Validate a full switch request against PTU rules.
 * 10-step validation chain per design spec.
 */
export function validateSwitch(params: {
  encounter: {
    isActive: boolean
    combatants: Combatant[]
    turnOrder: string[]
    currentTurnIndex: number
    battleType: string
  }
  trainerId: string
  recallCombatantId: string
  releaseEntityId: string
  releasedPokemonRecord: { id: string; ownerId: string | null; currentHp: number } | null
}): SwitchValidationResult {
  const { encounter, trainerId, recallCombatantId, releaseEntityId, releasedPokemonRecord } = params

  // 1. Encounter exists and is active
  if (!encounter.isActive) {
    return { valid: false, error: 'Encounter is not active', statusCode: 400 }
  }

  // 2. Trainer combatant exists (type='human')
  const trainer = encounter.combatants.find(c => c.id === trainerId)
  if (!trainer) {
    return { valid: false, error: 'Trainer combatant not found', statusCode: 404 }
  }
  if (trainer.type !== 'human') {
    return { valid: false, error: 'Specified combatant is not a trainer', statusCode: 400 }
  }

  // 3. Recalled Pokemon combatant exists (type='pokemon')
  const recalled = encounter.combatants.find(c => c.id === recallCombatantId)
  if (!recalled) {
    return { valid: false, error: 'Recalled Pokemon combatant not found', statusCode: 404 }
  }
  if (recalled.type !== 'pokemon') {
    return { valid: false, error: 'Specified combatant is not a Pokemon', statusCode: 400 }
  }

  // 3b. Recalled Pokemon must not be Trapped (PTU p.247: "Trapped... cannot be recalled")
  const recalledStatuses: string[] = (recalled.entity as { statusConditions?: string[] })?.statusConditions || []
  const recalledTempConditions: string[] = (recalled.entity as { tempConditions?: string[] })?.tempConditions || []
  const allRecalledConditions = [...recalledStatuses, ...recalledTempConditions]
  if (allRecalledConditions.includes('Trapped') || allRecalledConditions.includes('Bound')) {
    return { valid: false, error: 'Pokemon is Trapped and cannot be recalled', statusCode: 400 }
  }

  // 4. Recalled Pokemon belongs to trainer (ownerId check)
  const recalledEntity = recalled.entity as { ownerId?: string }
  if (recalledEntity.ownerId !== trainer.entityId) {
    return { valid: false, error: 'Recalled Pokemon does not belong to this trainer', statusCode: 400 }
  }

  // 5. Released Pokemon entity exists in DB
  if (!releasedPokemonRecord) {
    return { valid: false, error: 'Released Pokemon not found', statusCode: 404 }
  }

  // 6. Released Pokemon belongs to trainer
  if (releasedPokemonRecord.ownerId !== trainer.entityId) {
    return { valid: false, error: 'Released Pokemon does not belong to this trainer', statusCode: 400 }
  }

  // 7. Released Pokemon not already in encounter
  const alreadyInEncounter = encounter.combatants.some(c => c.entityId === releaseEntityId)
  if (alreadyInEncounter) {
    return { valid: false, error: 'Released Pokemon is already in the encounter', statusCode: 400 }
  }

  // 8. Released Pokemon not fainted
  if (releasedPokemonRecord.currentHp <= 0) {
    return { valid: false, error: 'Released Pokemon is fainted and cannot battle', statusCode: 400 }
  }

  // 9. Range check is done separately (needs grid positions)
  // 10. Action availability is done separately (needs turn context)

  return { valid: true }
}

/**
 * Check if the initiating combatant has a Standard Action available.
 * The switch can be initiated on either the trainer's or the Pokemon's turn.
 */
export function validateActionAvailability(
  encounter: {
    turnOrder: string[]
    currentTurnIndex: number
  },
  trainerId: string,
  recallCombatantId: string,
  trainerCombatant: Combatant,
  recalledCombatant: Combatant
): SwitchValidationResult {
  const currentTurnCombatantId = encounter.turnOrder[encounter.currentTurnIndex]
  const isTrainerTurn = currentTurnCombatantId === trainerId
  const isPokemonTurn = currentTurnCombatantId === recallCombatantId

  if (!isTrainerTurn && !isPokemonTurn) {
    return {
      valid: false,
      error: 'Switch can only be initiated on the trainer\'s or their Pokemon\'s turn',
      statusCode: 400
    }
  }

  // Check Standard Action on the initiating combatant
  const initiator = isTrainerTurn ? trainerCombatant : recalledCombatant
  if (initiator.turnState.standardActionUsed) {
    return {
      valid: false,
      error: 'Standard Action already used this turn',
      statusCode: 400
    }
  }

  return { valid: true }
}

// ============================================
// FAINTED SWITCH VALIDATION (P1 — Section H)
// ============================================

/**
 * Validate a fainted switch request.
 * PTU p.229: "Trainers may Switch out Fainted Pokemon as a Shift Action."
 *
 * Requirements:
 * - Recalled Pokemon must actually be fainted (currentHp <= 0)
 * - Trainer must have a Shift Action available
 * - It must be the trainer's turn (fainted Pokemon can't initiate)
 */
export function validateFaintedSwitch(
  recalledCombatant: Combatant,
  trainerCombatant: Combatant,
  encounter: {
    turnOrder: string[]
    currentTurnIndex: number
  },
  trainerId: string
): SwitchValidationResult {
  // Recalled Pokemon must be fainted
  if (recalledCombatant.entity.currentHp > 0) {
    return {
      valid: false,
      error: 'Cannot use fainted switch: Pokemon is not fainted',
      statusCode: 400
    }
  }

  // Must be the trainer's turn (fainted Pokemon can't act)
  const currentTurnCombatantId = encounter.turnOrder[encounter.currentTurnIndex]
  if (currentTurnCombatantId !== trainerId) {
    return {
      valid: false,
      error: 'Fainted switch can only be performed on the trainer\'s turn',
      statusCode: 400
    }
  }

  // Trainer must have Shift Action available
  if (trainerCombatant.turnState.shiftActionUsed) {
    return {
      valid: false,
      error: 'No Shift Action available for fainted switch',
      statusCode: 400
    }
  }

  return { valid: true }
}

// ============================================
// FORCED SWITCH VALIDATION (P1 — Section I)
// ============================================

/**
 * Validate a forced switch request (Roar, Whirlwind, etc.).
 * PTU p.229: Forced switches bypass action cost and League restriction.
 *
 * Per decree-034: only moves with explicit recall text qualify.
 * - No action cost check (forced doesn't consume an action)
 * - No turn check (can happen on any combatant's turn)
 * - Range check still applies in Full Contact mode
 * - Trapped check is bypassed for forced switches (the move overrides it)
 */
export function validateForcedSwitch(params: {
  encounter: {
    isActive: boolean
    combatants: Combatant[]
    battleType: string
  }
  trainerId: string
  recallCombatantId: string
  releaseEntityId: string
  releasedPokemonRecord: { id: string; ownerId: string | null; currentHp: number } | null
}): SwitchValidationResult {
  const { encounter, trainerId, recallCombatantId, releaseEntityId, releasedPokemonRecord } = params

  // 1. Encounter must be active
  if (!encounter.isActive) {
    return { valid: false, error: 'Encounter is not active', statusCode: 400 }
  }

  // 2. Trainer combatant exists
  const trainer = encounter.combatants.find(c => c.id === trainerId)
  if (!trainer || trainer.type !== 'human') {
    return { valid: false, error: 'Trainer combatant not found', statusCode: 404 }
  }

  // 3. Recalled Pokemon exists
  const recalled = encounter.combatants.find(c => c.id === recallCombatantId)
  if (!recalled || recalled.type !== 'pokemon') {
    return { valid: false, error: 'Recalled Pokemon combatant not found', statusCode: 404 }
  }

  // NOTE: Trapped check is SKIPPED for forced switches — the move overrides it

  // 4. Recalled Pokemon belongs to trainer
  const recalledEntity = recalled.entity as { ownerId?: string }
  if (recalledEntity.ownerId !== trainer.entityId) {
    return { valid: false, error: 'Recalled Pokemon does not belong to this trainer', statusCode: 400 }
  }

  // 5. Released Pokemon exists
  if (!releasedPokemonRecord) {
    return { valid: false, error: 'Released Pokemon not found', statusCode: 404 }
  }

  // 6. Released Pokemon belongs to trainer
  if (releasedPokemonRecord.ownerId !== trainer.entityId) {
    return { valid: false, error: 'Released Pokemon does not belong to this trainer', statusCode: 400 }
  }

  // 7. Released Pokemon not already in encounter
  const alreadyInEncounter = encounter.combatants.some(c => c.entityId === releaseEntityId)
  if (alreadyInEncounter) {
    return { valid: false, error: 'Released Pokemon is already in the encounter', statusCode: 400 }
  }

  // 8. Released Pokemon not fainted
  if (releasedPokemonRecord.currentHp <= 0) {
    return { valid: false, error: 'Released Pokemon is fainted and cannot battle', statusCode: 400 }
  }

  return { valid: true }
}

// ============================================
// LEAGUE RESTRICTION CHECK (P1 — Section G)
// ============================================

/**
 * Determine if a switched-in Pokemon can be commanded this round.
 * PTU p.229: "they cannot command the Pokemon that was Released as part
 * of the Switch for the remainder of the Round unless the Switch was
 * forced by a Move such as Roar or if they were Recalling and replacing
 * a Fainted Pokemon."
 *
 * Returns true if the Pokemon CAN be commanded (no restriction).
 */
export function canSwitchedPokemonBeCommanded(
  isLeagueBattle: boolean,
  isFaintedSwitch: boolean,
  isForcedSwitch: boolean
): boolean {
  // Non-League battles: no restriction
  if (!isLeagueBattle) return true

  // Fainted switch exemption
  if (isFaintedSwitch) return true

  // Forced switch exemption (Roar, Whirlwind, etc.)
  if (isForcedSwitch) return true

  // League Battle standard switch: cannot be commanded this round
  return false
}
