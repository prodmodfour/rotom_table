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
import { findPlacementPosition } from '~/server/services/grid-placement.service'
import { prisma } from '~/server/utils/prisma'
import { RECALL_CLEARED_CONDITIONS, getConditionDef } from '~/constants/statusConditions'
import { shouldClearOnRecall } from '~/constants/conditionSourceRules'
import type { Combatant, ConditionInstance, StatusCondition } from '~/types'
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
  // Note: tempConditions lives on the combatant, not the entity.
  const recalledStatuses: string[] = (recalled.entity as { statusConditions?: string[] })?.statusConditions || []
  const recalledTempConditions: string[] = recalled.tempConditions || []
  const allRecalledConditions = [...recalledStatuses, ...recalledTempConditions]
  if (allRecalledConditions.includes('Trapped')) {
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
 * Validate a forced switch request (Roar, etc.).
 * PTU p.229: Forced switches bypass action cost and League restriction.
 *
 * Per decree-034: Whirlwind is a push, not a forced switch.
 * Only moves with explicit recall text qualify (e.g., Roar).
 * - No action cost check (forced doesn't consume an action)
 * - No turn check (can happen on any combatant's turn)
 * - Range check still applies in Full Contact mode
 * - Trapped check: per decree-039, Roar does NOT override Trapped. Blocked with specific error.
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

  // 3b. Trapped check — per decree-039: Roar does NOT override Trapped
  // PTU p.247: "A Pokemon or Trainer that is Trapped cannot be recalled."
  // Only moves with explicit text bypass Trapped (U-Turn, Baton Pass, Volt Switch, Parting Shot).
  // Roar's text (p.8855) says nothing about Trapped, so the recall is blocked.
  // The shift movement still happens (handled by the caller), but recall fails here.
  // Note: tempConditions lives on the combatant, not the entity.
  const recalledStatuses: string[] = (recalled.entity as { statusConditions?: string[] })?.statusConditions || []
  const recalledTempConditions: string[] = recalled.tempConditions || []
  const allRecalledConditions = [...recalledStatuses, ...recalledTempConditions]
  if (allRecalledConditions.includes('Trapped')) {
    return { valid: false, error: 'Cannot recall Trapped Pokemon — forced switch blocked (decree-039)', statusCode: 400 }
  }

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

  // Forced switch exemption (Roar, etc. — Whirlwind is a push per decree-034)
  if (isForcedSwitch) return true

  // League Battle standard switch: cannot be commanded this round
  return false
}

// ============================================
// ADJACENT PLACEMENT (P2 — Section L)
// ============================================

/**
 * Find a grid position adjacent to the trainer for releasing a Pokemon.
 * Checks all 8 surrounding cells (and further if all adjacent are occupied).
 * Falls back to findPlacementPosition (grid-wide search) to avoid overlapping tokens.
 *
 * PTU p.229: Released Pokemon is placed adjacent to the trainer
 * when no recalled Pokemon position is available to inherit.
 */
export function findAdjacentPosition(
  trainerPosition: GridPosition,
  occupiedCells: Set<string>,
  tokenSize: number,
  gridWidth: number,
  gridHeight: number,
  side: string = 'players'
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

  // Expand search: try radius 2-5 around trainer
  for (let radius = 2; radius <= 5; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) < radius && Math.abs(dy) < radius) continue // Skip inner cells (already checked)
        const pos = {
          x: trainerPosition.x + dx,
          y: trainerPosition.y + dy
        }
        if (canFitAt(pos, tokenSize, gridWidth, gridHeight, occupiedCells)) {
          return pos
        }
      }
    }
  }

  // Grid-wide fallback: use findPlacementPosition to search the entire grid
  // instead of overlapping with the trainer's token
  return findPlacementPosition(occupiedCells, side, tokenSize, gridWidth, gridHeight)
}

/**
 * Check if a token of given size can fit at a position without
 * overlapping occupied cells or exceeding grid bounds.
 */
function canFitAt(
  pos: GridPosition,
  tokenSize: number,
  gridWidth: number,
  gridHeight: number,
  occupiedCells: Set<string>
): boolean {
  if (pos.x < 0 || pos.y < 0) return false
  if (pos.x + tokenSize > gridWidth || pos.y + tokenSize > gridHeight) return false
  for (let dx = 0; dx < tokenSize; dx++) {
    for (let dy = 0; dy < tokenSize; dy++) {
      if (occupiedCells.has(`${pos.x + dx},${pos.y + dy}`)) return false
    }
  }
  return true
}

// ============================================
// RECALL SIDE-EFFECTS
// ============================================

/**
 * Apply recall side-effects to a Pokemon's DB record.
 * PTU p.247-248: volatile conditions cleared, temp HP lost, combat stages reset.
 *
 * Per decree-047: Other conditions use source-aware clearing when
 * conditionInstances are provided. Without instances, falls back
 * to static clearsOnRecall flags (backward compat).
 *
 * Shared by switch.post.ts and recall.post.ts to avoid duplicated logic.
 */
export async function applyRecallSideEffects(
  entityId: string,
  conditionInstances?: ConditionInstance[]
): Promise<void> {
  const dbRecord = await prisma.pokemon.findUnique({
    where: { id: entityId }
  })
  if (!dbRecord) return

  const currentStatuses: StatusCondition[] = JSON.parse(dbRecord.statusConditions || '[]')

  const persistentOnly = currentStatuses.filter((status: StatusCondition) => {
    const instance = conditionInstances?.find(i => i.condition === status)
    return !shouldClearOnRecall(status, instance)
  })

  await prisma.pokemon.update({
    where: { id: entityId },
    data: {
      statusConditions: JSON.stringify(persistentOnly),
      temporaryHp: 0,
      stageModifiers: JSON.stringify({})
    }
  })
}

// ============================================
// RECALL+RELEASE PAIR DETECTION (P2 — Section N)
// ============================================

/**
 * Check if a trainer has performed both a recall and a release this round.
 * If so, the combined actions count as a Switch for League restriction purposes.
 *
 * Also enforces: cannot Recall and Release the same Pokemon in one round.
 *
 * PTU p.229: "Recalling and then Releasing by using two Shift Actions in
 * one Round still counts as a Switch, even if they are declared as separate
 * actions, and you may not do this to Recall and then Release the same
 * Pokemon in one round."
 */
export function checkRecallReleasePair(
  switchActions: SwitchAction[],
  trainerId: string,
  round: number
): {
  countsAsSwitch: boolean
  recalledEntityIds: string[]
  releasedEntityIds: string[]
  isFaintedSwitch: boolean
} {
  const trainerActions = switchActions.filter(
    a => a.trainerId === trainerId && a.round === round
  )

  const recallActions = trainerActions.filter(a => a.recalledEntityId !== null)
  const recalledEntityIds = recallActions.map(a => a.recalledEntityId!)

  const releasedEntityIds = trainerActions
    .filter(a => a.releasedEntityId !== null)
    .map(a => a.releasedEntityId!)

  const countsAsSwitch = recalledEntityIds.length > 0 && releasedEntityIds.length > 0

  // PTU p.229: fainted replacement switches are exempt from League restriction.
  // If ANY recalled Pokemon was fainted at the time of recall, the pair qualifies
  // as a fainted switch and the released Pokemon can be commanded this round.
  const isFaintedSwitch = recallActions.some(a => a.recalledWasFainted === true)

  return { countsAsSwitch, recalledEntityIds, releasedEntityIds, isFaintedSwitch }
}
