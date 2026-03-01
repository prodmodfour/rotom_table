/**
 * Out-of-Turn Action Service (feature-016)
 *
 * Central service for all out-of-turn action mechanics:
 * - Attack of Opportunity (P0): detection, eligibility, resolution
 * - Hold Action (P1): declare hold, release held, check hold queue
 * - Priority Actions (P1): standard, limited, advanced variants
 * - Interrupt Actions (P1): generic framework for interrupt triggers
 *
 * Pure functions where possible. All five AoO trigger types from PTU p.241.
 */

import { v4 as uuidv4 } from 'uuid'
import type { Combatant, GridPosition } from '~/types'
import type {
  AoOTrigger,
  InterruptTrigger,
  OutOfTurnAction,
  OutOfTurnUsage,
  OutOfTurnCategory,
  HoldActionState
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

/**
 * Remove resolved/declined/expired actions from previous rounds.
 * Keeps only pending actions (current round) and resolved actions from
 * the current round (for reference). Prevents indefinite accumulation.
 * Returns a new array.
 */
export function cleanupResolvedActions(
  pendingActions: OutOfTurnAction[],
  currentRound: number
): OutOfTurnAction[] {
  return pendingActions.filter(action => {
    // Always keep pending actions
    if (action.status === 'pending') return true
    // Keep resolved/declined/expired actions from the current round only
    return action.round === currentRound
  })
}

// ============================================
// HOLD ACTION (P1 — PTU p.227)
// ============================================

/**
 * Get default HoldActionState.
 */
export function getDefaultHoldActionState(): HoldActionState {
  return {
    isHolding: false,
    holdUntilInitiative: null,
    holdUsedThisRound: false
  }
}

/**
 * Check if a combatant can hold their action.
 * PTU p.227: Can only hold once per round, must be on their turn, and must not have acted.
 */
export function canHoldAction(combatant: Combatant): { allowed: boolean; reason?: string } {
  // Must not have acted yet this turn
  if (combatant.hasActed) {
    return { allowed: false, reason: 'Combatant has already acted this turn' }
  }

  // Must not have HP <= 0
  if (combatant.entity.currentHp <= 0) {
    return { allowed: false, reason: 'Fainted combatants cannot hold actions' }
  }

  // Check once-per-round hold limit
  const holdState = combatant.holdAction ?? getDefaultHoldActionState()
  if (holdState.holdUsedThisRound) {
    return { allowed: false, reason: 'Hold action already used this round' }
  }

  // Cannot hold if already holding (shouldn't happen, but safety)
  if (holdState.isHolding) {
    return { allowed: false, reason: 'Already holding an action' }
  }

  return { allowed: true }
}

/**
 * Apply a hold action to a combatant.
 * Returns updated combatant and new hold queue entry.
 * Does NOT mutate inputs.
 */
export function applyHoldAction(
  combatant: Combatant,
  holdUntilInitiative: number | null
): {
  updatedCombatant: Combatant
  holdQueueEntry: { combatantId: string; holdUntilInitiative: number | null }
} {
  const updatedCombatant: Combatant = {
    ...combatant,
    turnState: {
      ...combatant.turnState,
      isHolding: true
    },
    holdAction: {
      isHolding: true,
      holdUntilInitiative,
      holdUsedThisRound: true
    },
    // Mark as acted so turn progression can advance past them
    hasActed: true
  }

  return {
    updatedCombatant,
    holdQueueEntry: {
      combatantId: combatant.id,
      holdUntilInitiative
    }
  }
}

/**
 * Release a held action. Returns updated combatant with full action economy.
 * Does NOT mutate input.
 */
export function releaseHeldAction(combatant: Combatant): Combatant {
  return {
    ...combatant,
    turnState: {
      ...combatant.turnState,
      isHolding: false,
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false
    },
    holdAction: {
      ...(combatant.holdAction ?? getDefaultHoldActionState()),
      isHolding: false
    },
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1
  }
}

/**
 * Check the hold queue to see if any held combatants should be released.
 * Returns ALL combatants whose holdUntilInitiative has been reached
 * by the current initiative value.
 *
 * Per decree-006: holdUntilInitiative is an absolute initiative value,
 * not a position in the turn order.
 */
export function checkHoldQueue(
  holdQueue: Array<{ combatantId: string; holdUntilInitiative: number | null }>,
  currentInitiative: number
): Array<{ combatantId: string }> {
  const results: Array<{ combatantId: string }> = []
  for (const entry of holdQueue) {
    if (entry.holdUntilInitiative !== null && currentInitiative <= entry.holdUntilInitiative) {
      results.push({ combatantId: entry.combatantId })
    }
  }
  return results
}

/**
 * Remove a combatant from the hold queue. Returns new array.
 */
export function removeFromHoldQueue(
  holdQueue: Array<{ combatantId: string; holdUntilInitiative: number | null }>,
  combatantId: string
): Array<{ combatantId: string; holdUntilInitiative: number | null }> {
  return holdQueue.filter(entry => entry.combatantId !== combatantId)
}

// ============================================
// PRIORITY ACTIONS (P1 — PTU p.228)
// ============================================

/**
 * Check if a combatant can use a Priority action.
 *
 * Standard: must not have acted, once per round
 * Limited: must not have acted, once per round
 * Advanced: once per round (CAN have already acted)
 */
export function canUsePriority(
  combatant: Combatant,
  variant: 'standard' | 'limited' | 'advanced'
): { allowed: boolean; reason?: string } {
  // Must have HP > 0
  if (combatant.entity.currentHp <= 0) {
    return { allowed: false, reason: 'Fainted combatants cannot use Priority' }
  }

  // Once per round
  const usage = combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()
  if (usage.priorityUsed) {
    return { allowed: false, reason: 'Priority already used this round' }
  }

  // Standard and Limited require the combatant has not acted
  if (variant !== 'advanced' && combatant.hasActed) {
    return { allowed: false, reason: 'Combatant has already acted this round' }
  }

  // Cannot use Priority while holding (F2 edge case)
  const holdState = combatant.holdAction ?? getDefaultHoldActionState()
  if (holdState.isHolding) {
    return { allowed: false, reason: 'Cannot use Priority while holding an action' }
  }

  return { allowed: true }
}

/**
 * Apply a Standard Priority action.
 * The combatant gets a full turn immediately. Their original position
 * in the turn order should be skipped.
 * Returns updated combatant.
 */
export function applyStandardPriority(combatant: Combatant): Combatant {
  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      priorityUsed: true
    },
    // Full action economy for the inserted turn
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1,
    turnState: {
      ...combatant.turnState,
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      isHolding: false
    }
  }
}

/**
 * Apply a Limited Priority action.
 * Only the Priority action is taken (Standard Action consumed).
 * Rest of turn happens at normal initiative.
 * Returns updated combatant.
 */
export function applyLimitedPriority(combatant: Combatant): Combatant {
  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      priorityUsed: true
    },
    turnState: {
      ...combatant.turnState,
      standardActionUsed: true
    }
  }
}

/**
 * Apply an Advanced Priority action.
 * Only the Priority action is taken. If the combatant has already acted,
 * they forfeit their next round turn (skipNextRound = true).
 * Returns updated combatant.
 */
export function applyAdvancedPriority(combatant: Combatant): Combatant {
  const alreadyActed = combatant.hasActed
  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      priorityUsed: true
    },
    // Advanced Priority consumes a Standard Action (spec B2)
    turnState: {
      ...combatant.turnState,
      standardActionUsed: true
    },
    // If they already acted, they forfeit next round
    skipNextRound: alreadyActed ? true : combatant.skipNextRound
  }
}

// ============================================
// INTERRUPT ACTIONS (P1 — PTU p.228)
// ============================================

/**
 * Check if a combatant can use an Interrupt action.
 * Once per round. Cannot use if fainted.
 */
export function canUseInterrupt(combatant: Combatant): { allowed: boolean; reason?: string } {
  // Must have HP > 0
  if (combatant.entity.currentHp <= 0) {
    return { allowed: false, reason: 'Fainted combatants cannot use Interrupt' }
  }

  // Once per round
  const usage = combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()
  if (usage.interruptUsed) {
    return { allowed: false, reason: 'Interrupt already used this round' }
  }

  return { allowed: true }
}

/**
 * Create a pending Interrupt action.
 * Returns a new OutOfTurnAction in 'pending' status for GM resolution.
 */
export function createInterruptAction(
  actorId: string,
  triggerId: string,
  triggerType: InterruptTrigger,
  triggerDescription: string,
  round: number,
  triggerContext?: OutOfTurnAction['triggerContext']
): OutOfTurnAction {
  return {
    id: uuidv4(),
    category: 'interrupt',
    actorId,
    triggerId,
    triggerType,
    triggerDescription,
    round,
    status: 'pending',
    triggerContext
  }
}

/**
 * Mark a combatant as having used their Interrupt this round.
 * Returns updated combatant. Does NOT mutate input.
 *
 * Per PTU p.229 + spec F3: In League Battles, only switched-in Pokemon
 * that cannot be commanded this round (canBeCommanded=false) forfeit
 * their next round turn when using an Interrupt. Regular Pokemon
 * using Interrupts do NOT lose their next turn.
 */
export function applyInterruptUsage(
  combatant: Combatant,
  isLeagueBattle: boolean
): Combatant {
  // Only switched-in Pokemon (canBeCommanded=false) forfeit next turn (PTU p.229)
  const isUncommandablePokemon = isLeagueBattle
    && combatant.type === 'pokemon'
    && combatant.turnState?.canBeCommanded === false

  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      interruptUsed: true
    },
    skipNextRound: isUncommandablePokemon ? true : combatant.skipNextRound
  }
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
// STRUGGLE ATTACK STATS
// ============================================

/**
 * Get the Struggle Attack stats for a combatant based on their Combat skill.
 * PTU p.240: "if a Trainer or Pokemon has a Combat Skill Rank of Expert or
 * higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
 *
 * Returns { ac, setDamage, isExpert } where setDamage is the set damage avg.
 */
export function getStruggleAttackStats(combatant: Combatant): {
  ac: number
  setDamage: number
  isExpert: boolean
} {
  const hasExpertCombat = checkExpertCombatSkill(combatant)
  if (hasExpertCombat) {
    return { ac: 3, setDamage: 13, isExpert: true }
  }
  return { ac: 4, setDamage: 11, isExpert: false }
}

/**
 * Check if a combatant has Expert+ Combat skill rank.
 * Only applicable to human combatants (trainers).
 * Pokemon don't have named skill ranks in the PTU skill system.
 */
function checkExpertCombatSkill(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const entity = combatant.entity as { skills?: Record<string, string> }
  if (!entity.skills) return false
  const combatRank = entity.skills.Combat || entity.skills.combat
  return combatRank === 'Expert' || combatRank === 'Master'
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
