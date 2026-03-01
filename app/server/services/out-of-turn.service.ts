/**
 * Out-of-Turn Action Service (feature-016)
 *
 * Central service for Attack of Opportunity detection, eligibility, and resolution.
 * Pure functions where possible. All five AoO trigger types from PTU p.241.
 *
 * PTU p.241 AoO rules:
 * - Free Action + Interrupt triggered by specific adjacent-foe actions
 * - Struggle Attack (AC 4, 1d8+6 Physical Typeless Melee)
 * - Once per round per combatant
 * - Cannot be used by Sleeping, Flinched, or Paralyzed combatants
 * - AoO itself does NOT trigger further AoOs (no recursion)
 */

import { v4 as uuidv4 } from 'uuid'
import type { Combatant, GridPosition } from '~/types'
import type {
  AoOTrigger,
  OutOfTurnAction,
  OutOfTurnUsage
} from '~/types/combat'
import { AOO_BLOCKING_CONDITIONS } from '~/types/combat'
import { AOO_TRIGGER_MAP } from '~/constants/aooTriggers'
import {
  areAdjacent,
  getAdjacentEnemies,
  wasAdjacentBeforeMove
} from '~/utils/adjacency'
import { isEnemySide } from '~/utils/combatSides'

// ============================================
// TYPES
// ============================================

export interface AoODetectionParams {
  /** The combatant performing the triggering action */
  actor: Combatant
  /** Type of trigger to check */
  triggerType: AoOTrigger
  /** All combatants in the encounter */
  combatants: Combatant[]
  /** Current round number */
  round: number
  /** For shift_away: the position BEFORE the shift */
  previousPosition?: GridPosition
  /** For shift_away: the position AFTER the shift */
  newPosition?: GridPosition
  /** For maneuver_other: the target(s) of the maneuver */
  maneuverTargetIds?: string[]
  /** For ranged_attack: whether any target is adjacent to the attacker */
  hasAdjacentTarget?: boolean
}

// ============================================
// AoO ELIGIBILITY CHECK
// ============================================

/**
 * Check if a combatant can use an AoO right now.
 *
 * PTU p.241: "Attacks of Opportunity cannot be made by Sleeping,
 * Flinched, or Paralyzed targets."
 * Also: "You may use Attack of Opportunity only once per round."
 */
export function canUseAoO(combatant: Combatant): { allowed: boolean; reason?: string } {
  // 1. Must have HP > 0 (not fainted)
  if (combatant.entity.currentHp <= 0) {
    return { allowed: false, reason: 'Fainted combatants cannot use AoO' }
  }

  // 2. Check blocking status conditions
  const conditions: string[] = combatant.entity.statusConditions ?? []
  for (const blockingCondition of AOO_BLOCKING_CONDITIONS) {
    if (conditions.includes(blockingCondition)) {
      return { allowed: false, reason: `${blockingCondition} prevents AoO usage` }
    }
  }

  // Also check for Fainted/Dead explicitly
  if (conditions.includes('Fainted') || conditions.includes('Dead')) {
    return { allowed: false, reason: 'Cannot use AoO while Fainted or Dead' }
  }

  // 3. Once per round limit
  const usage = combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()
  if (usage.aooUsed) {
    return { allowed: false, reason: 'AoO already used this round' }
  }

  // 4. Must have a grid position (for adjacency checks)
  if (!combatant.position) {
    return { allowed: false, reason: 'No grid position for adjacency check' }
  }

  return { allowed: true }
}

// ============================================
// AoO TRIGGER DETECTION
// ============================================

/**
 * Detect all valid AoO opportunities triggered by a specific action.
 * Returns one OutOfTurnAction per eligible reactor.
 *
 * PTU p.241 rules:
 * - Only adjacent enemies can trigger AoO
 * - Reactor must pass canUseAoO check
 * - The triggering action must match specific conditions
 */
export function detectAoOTriggers(params: AoODetectionParams): OutOfTurnAction[] {
  const { actor, triggerType, combatants, round } = params
  const triggerInfo = AOO_TRIGGER_MAP[triggerType]
  const results: OutOfTurnAction[] = []

  // Validate trigger-specific preconditions
  if (!validateTriggerPreconditions(params)) {
    return results
  }

  // Find eligible reactors based on trigger type
  const eligibleReactors = findEligibleReactors(params)

  // Create an OutOfTurnAction for each eligible reactor
  for (const reactor of eligibleReactors) {
    const actorName = getDisplayName(actor)
    results.push({
      id: uuidv4(),
      category: 'aoo',
      actorId: reactor.id,
      triggerId: actor.id,
      triggerType,
      triggerDescription: `${actorName} ${triggerInfo.description}`,
      round,
      status: 'pending'
    })
  }

  return results
}

/**
 * Validate trigger-specific preconditions.
 * Returns false if the trigger cannot fire at all (e.g., disengaged actor).
 */
function validateTriggerPreconditions(params: AoODetectionParams): boolean {
  const { actor, triggerType, previousPosition, newPosition, hasAdjacentTarget } = params

  switch (triggerType) {
    case 'shift_away':
      // Actor must have disengaged=false (Disengage exempts from shift_away AoO)
      if (actor.disengaged) return false
      // Must have both previous and new positions
      if (!previousPosition || !newPosition) return false
      if (!actor.position) return false
      return true

    case 'ranged_attack':
      // Trigger only fires if the actor has NO adjacent target
      // (ranged attack targeting someone adjacent does NOT provoke)
      if (hasAdjacentTarget === true) return false
      if (!actor.position) return false
      return true

    case 'stand_up':
      if (!actor.position) return false
      return true

    case 'maneuver_other':
      if (!actor.position) return false
      return true

    case 'retrieve_item':
      if (!actor.position) return false
      return true

    default:
      return false
  }
}

/**
 * Find all combatants eligible to react with an AoO based on the trigger type.
 */
function findEligibleReactors(params: AoODetectionParams): Combatant[] {
  const { actor, triggerType, combatants, previousPosition, newPosition, maneuverTargetIds } = params

  // Get adjacent enemies (the pool of potential reactors)
  let adjacentEnemies: Combatant[]

  if (triggerType === 'shift_away' && previousPosition) {
    // For shift_away: check who was adjacent at the PREVIOUS position
    adjacentEnemies = combatants.filter(c => {
      if (c.id === actor.id) return false
      if (!c.position) return false
      if (!isEnemyCombatant(actor, c)) return false
      // Must have been adjacent before AND not adjacent after
      return wasAdjacentBeforeMove(
        previousPosition,
        newPosition!,
        actor.tokenSize,
        c.position,
        c.tokenSize
      )
    })
  } else {
    // For other triggers: check who is currently adjacent
    adjacentEnemies = getAdjacentEnemies(actor.id, combatants)
  }

  // Filter by eligibility (canUseAoO)
  let eligible = adjacentEnemies.filter(c => canUseAoO(c).allowed)

  // Trigger-specific filtering
  if (triggerType === 'maneuver_other' && maneuverTargetIds) {
    // Exclude the maneuver's targets (they can't AoO the maneuver targeting them)
    const targetSet = new Set(maneuverTargetIds)
    eligible = eligible.filter(c => !targetSet.has(c.id))
  }

  return eligible
}

// ============================================
// AoO RESOLUTION
// ============================================

/**
 * Resolve a pending AoO action (accept or decline).
 * Returns a new array of pendingOutOfTurnActions with the action updated.
 *
 * When accepted:
 * - The reactor's outOfTurnUsage.aooUsed is set to true
 * - The action status changes to 'accepted'
 *
 * When declined:
 * - The action status changes to 'declined'
 * - No other changes
 *
 * Does NOT mutate the input arrays; returns new references.
 */
export function resolveAoOAction(
  pendingActions: OutOfTurnAction[],
  combatants: Combatant[],
  actionId: string,
  accepted: boolean
): { updatedActions: OutOfTurnAction[]; updatedCombatants: Combatant[] } {
  const updatedActions = pendingActions.map(action => {
    if (action.id !== actionId) return action
    return {
      ...action,
      status: accepted ? 'accepted' as const : 'declined' as const
    }
  })

  if (!accepted) {
    return { updatedActions, updatedCombatants: combatants }
  }

  // Find the action to get the reactor ID
  const action = pendingActions.find(a => a.id === actionId)
  if (!action) {
    return { updatedActions, updatedCombatants: combatants }
  }

  // Mark the reactor as having used their AoO this round
  const updatedCombatants = combatants.map(c => {
    if (c.id !== action.actorId) return c
    return {
      ...c,
      outOfTurnUsage: {
        ...(c.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
        aooUsed: true
      }
    }
  })

  return { updatedActions, updatedCombatants }
}

/**
 * Expire all pending out-of-turn actions for a given round.
 * Called at round end to prevent stale prompts from persisting.
 * Returns a new array.
 */
export function expirePendingActions(
  pendingActions: OutOfTurnAction[],
  round: number
): OutOfTurnAction[] {
  return pendingActions.map(action => {
    if (action.round === round && action.status === 'pending') {
      return { ...action, status: 'expired' as const }
    }
    return action
  })
}

/**
 * Auto-decline pending AoO actions for a combatant that has fainted.
 * Returns a new array.
 */
export function autoDeclineFaintedReactor(
  pendingActions: OutOfTurnAction[],
  faintedCombatantId: string
): OutOfTurnAction[] {
  return pendingActions.map(action => {
    if (action.actorId === faintedCombatantId && action.status === 'pending') {
      return { ...action, status: 'declined' as const }
    }
    return action
  })
}

// ============================================
// DEFAULT VALUES
// ============================================

/**
 * Get default OutOfTurnUsage (all false — nothing used this round).
 */
export function getDefaultOutOfTurnUsage(): OutOfTurnUsage {
  return {
    aooUsed: false,
    priorityUsed: false,
    interruptUsed: false
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Check if two combatants are enemies based on their side assignments.
 */
function isEnemyCombatant(a: Combatant, b: Combatant): boolean {
  return isEnemySide(a.side, b.side)
}

/**
 * Get the display name for a combatant.
 */
function getDisplayName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const entity = combatant.entity as { nickname?: string; species: string }
    return entity.nickname || entity.species
  }
  return (combatant.entity as { name: string }).name
}
