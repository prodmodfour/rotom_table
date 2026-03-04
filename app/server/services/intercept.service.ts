/**
 * Intercept Service (feature-016 P2)
 *
 * Intercept Melee (R116) and Intercept Ranged (R117) per PTU p.242.
 * Extracted from out-of-turn.service.ts for file size compliance.
 *
 * - Eligibility: canIntercept, checkInterceptLoyalty, canInterceptMove
 * - Detection: detectInterceptMelee, detectInterceptRanged
 * - Resolution: resolveInterceptMelee, resolveInterceptRanged
 * - Geometry: calculatePushDirection
 */

import { v4 as uuidv4 } from 'uuid'
import type { Combatant, GridPosition, Pokemon } from '~/types'
import type { OutOfTurnAction, OutOfTurnUsage } from '~/types/combat'
import { INTERCEPT_BLOCKING_CONDITIONS } from '~/types/combat'
import { areAdjacent } from '~/utils/adjacency'
import { isEnemySide } from '~/utils/combatSides'
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'
import { getLineOfAttackCellsMultiTile, canReachLineOfAttack } from '~/utils/lineOfAttack'
import { getDefaultOutOfTurnUsage } from '~/server/services/out-of-turn.service'

// ============================================
// TYPES
// ============================================

export interface InterceptMeleeDetectionParams {
  /** The combatant being attacked */
  targetId: string
  /** The attacker */
  attackerId: string
  /** The move used */
  move: { name: string; range: string; canMiss: boolean; actionType?: string }
  /** All combatants */
  combatants: Combatant[]
  /** Current round */
  round: number
}

export interface InterceptRangedDetectionParams {
  /** The target of the ranged attack */
  targetId: string
  /** The attacker */
  attackerId: string
  /** The move used */
  move: { name: string; range: string; canMiss: boolean; actionType?: string; targetCount: number }
  /** All combatants */
  combatants: Combatant[]
  /** Current round */
  round: number
}

// ============================================
// INTERCEPT ELIGIBILITY
// ============================================

/**
 * Check if a combatant can attempt an Intercept (Melee or Ranged).
 *
 * PTU p.242: Cannot attempt Intercepts while Asleep, Confused, Enraged,
 * Frozen, Stuck, Paralyzed, or otherwise unable to move.
 * Must not have used Interrupt this round.
 * Must have both Standard + Shift actions available (Full Action).
 */
export function canIntercept(combatant: Combatant): { allowed: boolean; reason?: string } {
  // Must have HP > 0
  if (combatant.entity.currentHp <= 0) {
    return { allowed: false, reason: 'Fainted combatants cannot Intercept' }
  }

  // Check blocking conditions
  const conditions: string[] = combatant.entity.statusConditions ?? []
  for (const blockingCondition of INTERCEPT_BLOCKING_CONDITIONS) {
    if (conditions.includes(blockingCondition)) {
      return { allowed: false, reason: `${blockingCondition} prevents Intercept` }
    }
  }

  // Also check Fainted/Dead
  if (conditions.includes('Fainted') || conditions.includes('Dead')) {
    return { allowed: false, reason: 'Cannot Intercept while Fainted or Dead' }
  }

  // Once per round Interrupt limit (Intercept IS an Interrupt)
  const usage = combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()
  if (usage.interruptUsed) {
    return { allowed: false, reason: 'Interrupt already used this round' }
  }

  // Must have Full Action available (Standard + Shift)
  // PTU p.227: "Full Actions take both your Standard Action and Shift Action"
  // If EITHER action is already consumed, the Full Action is unavailable
  const ts = combatant.turnState
  if (ts.standardActionUsed || ts.shiftActionUsed) {
    return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
  }

  // Must have a grid position
  if (!combatant.position) {
    return { allowed: false, reason: 'No grid position for Intercept check' }
  }

  return { allowed: true }
}

/**
 * Check Pokemon loyalty requirement for Intercept.
 * PTU p.242: Pokemon need Loyalty 3+ to intercept for their Trainer,
 * Loyalty 6 for any ally.
 */
export function checkInterceptLoyalty(
  interceptor: Combatant,
  target: Combatant
): { allowed: boolean; reason?: string } {
  if (interceptor.type !== 'pokemon') return { allowed: true }

  const pokemon = interceptor.entity as Pokemon
  const loyalty = pokemon.loyalty ?? 3

  if (loyalty < 3) {
    return { allowed: false, reason: 'Pokemon needs Loyalty 3+ to Intercept' }
  }

  if (loyalty < 6) {
    // Can only intercept for their Trainer
    const ownerId = pokemon.ownerId
    if (target.entityId !== ownerId) {
      return { allowed: false, reason: 'Pokemon needs Loyalty 6 to Intercept for non-Trainer allies' }
    }
  }

  return { allowed: true }
}

/**
 * Check if Intercept is allowed against a Priority or Interrupt move.
 * PTU p.242: Can only Intercept Priority/Interrupt moves if faster than attacker.
 */
export function canInterceptMove(
  interceptor: Combatant,
  attacker: Combatant,
  move: { actionType?: string }
): { allowed: boolean; reason?: string } {
  if (move.actionType === 'priority' || move.actionType === 'interrupt') {
    if (interceptor.initiative <= attacker.initiative) {
      return {
        allowed: false,
        reason: 'Must be faster than attacker to Intercept Priority/Interrupt moves'
      }
    }
  }
  return { allowed: true }
}

// ============================================
// HELPERS
// ============================================

/**
 * Check if two combatants are allies (same side or friendly sides).
 * Players and Allies are friendly to each other.
 */
function isAllyCombatant(a: Combatant, b: Combatant): boolean {
  if (a.id === b.id) return false
  return !isEnemySide(a.side, b.side)
}

/**
 * Get the effective movement speed of a combatant in meters.
 * Applies movement-modifying conditions per PTU rules:
 * - Stuck: speed 0 (cannot move)
 * - Tripped: speed 0 (must spend Shift to stand)
 * - Slowed: half speed
 * - Speed CS: additive bonus/penalty (half stage, min 2)
 * - Sprint: +50%
 *
 * Mirrors applyMovementModifiers from useGridMovement.ts for server use.
 */
function getCombatantSpeed(combatant: Combatant): number {
  let baseSpeed: number
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    baseSpeed = pokemon.capabilities?.overland || 5
  } else {
    baseSpeed = 5
  }

  const conditions: string[] = combatant.entity.statusConditions ?? []
  const tempConditions: string[] = combatant.tempConditions ?? []

  // Stuck: cannot move at all
  if (conditions.includes('Stuck')) return 0

  // Tripped: must spend Shift to stand before moving
  if (conditions.includes('Tripped') || tempConditions.includes('Tripped')) return 0

  let speed = baseSpeed

  // Slowed: half speed
  if (conditions.includes('Slowed')) {
    speed = Math.floor(speed / 2)
  }

  // Speed Combat Stage: additive bonus/penalty (half stage value)
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  if (speedStage !== 0) {
    const clamped = Math.max(-6, Math.min(6, speedStage))
    const stageBonus = Math.trunc(clamped / 2)
    speed = speed + stageBonus
    if (stageBonus < 0) {
      speed = Math.max(speed, 2)
    }
  }

  // Sprint: +50%
  if (tempConditions.includes('Sprint')) {
    speed = Math.floor(speed * 1.5)
  }

  return Math.max(speed, baseSpeed > 0 ? 1 : 0)
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

// ============================================
// INTERCEPT DETECTION
// ============================================

/**
 * Detect Intercept Melee opportunities when an ally is hit by an adjacent melee attack.
 *
 * PTU p.242: Trigger -- An ally within movement range is hit by an adjacent foe.
 *
 * Eligible interceptors must:
 * 1. Be allies of the target (same side or friendly sides)
 * 2. Be within their movement range of the target
 * 3. Pass canIntercept check (no blocking conditions, Full Action available)
 * 4. The attack must be melee (attacker adjacent to target)
 * 5. The move must be able to miss (no Aura Sphere/Swift)
 * 6. For Pokemon: meet Loyalty requirements
 * 7. Speed check for Priority/Interrupt moves
 */
export function detectInterceptMelee(params: InterceptMeleeDetectionParams): OutOfTurnAction[] {
  const { targetId, attackerId, move, combatants, round } = params
  const results: OutOfTurnAction[] = []

  // Move must be able to miss
  if (!move.canMiss) return results

  const target = combatants.find(c => c.id === targetId)
  const attacker = combatants.find(c => c.id === attackerId)
  if (!target || !attacker) return results
  if (!target.position || !attacker.position) return results

  // Attacker must be adjacent to target (melee requirement)
  if (!areAdjacent(attacker.position, attacker.tokenSize, target.position, target.tokenSize)) {
    return results
  }

  const targetName = getDisplayName(target)
  const attackerName = getDisplayName(attacker)

  for (const interceptor of combatants) {
    if (interceptor.id === targetId || interceptor.id === attackerId) continue
    if (!interceptor.position) continue

    // Must be an ally of the target
    if (!isAllyCombatant(interceptor, target)) continue

    // Must pass general Intercept eligibility
    if (!canIntercept(interceptor).allowed) continue

    // Must be within movement range of the target (edge-to-edge for multi-tile tokens)
    const speed = getCombatantSpeed(interceptor)
    const distance = ptuDistanceTokensBBox(
      { position: interceptor.position, size: interceptor.tokenSize },
      { position: target.position, size: target.tokenSize }
    )
    if (distance > speed) continue

    // Loyalty check for Pokemon
    const loyaltyCheck = checkInterceptLoyalty(interceptor, target)
    if (!loyaltyCheck.allowed) continue

    // Speed check for Priority/Interrupt moves
    const moveCheck = canInterceptMove(interceptor, attacker, move)
    if (!moveCheck.allowed) continue

    const interceptorName = getDisplayName(interceptor)

    results.push({
      id: uuidv4(),
      category: 'interrupt',
      actorId: interceptor.id,
      triggerId: attackerId,
      triggerType: 'ally_hit_melee',
      triggerDescription: `${interceptorName} can Intercept Melee: ${attackerName} hit ${targetName} with ${move.name}`,
      round,
      status: 'pending',
      triggerContext: {
        moveName: move.name,
        originalTargetId: targetId,
        attackerId
      }
    })
  }

  return results
}

/**
 * Detect Intercept Ranged opportunities when a ranged single-target attack
 * passes within an ally's movement range.
 *
 * PTU p.242: Trigger -- A Ranged X-Target attack passes within your movement range.
 *
 * Eligible interceptors must:
 * 1. Be allies of the target
 * 2. Have at least one cell on the line of attack within movement range
 * 3. Pass canIntercept check
 * 4. The attack must be ranged (not melee) and single-target
 * 5. The move must be able to miss
 * 6. For Pokemon: meet Loyalty requirements
 * 7. Speed check for Priority/Interrupt moves
 */
export function detectInterceptRanged(params: InterceptRangedDetectionParams): OutOfTurnAction[] {
  const { targetId, attackerId, move, combatants, round } = params
  const results: OutOfTurnAction[] = []

  // Move must be able to miss
  if (!move.canMiss) return results

  // Must be single-target
  if (move.targetCount !== 1) return results

  const target = combatants.find(c => c.id === targetId)
  const attacker = combatants.find(c => c.id === attackerId)
  if (!target || !attacker) return results
  if (!target.position || !attacker.position) return results

  // Must be ranged (attacker NOT adjacent to target)
  if (areAdjacent(attacker.position, attacker.tokenSize, target.position, target.tokenSize)) {
    return results
  }

  // Get the line of attack (center-to-center for multi-tile tokens)
  const attackLine = getLineOfAttackCellsMultiTile(
    attacker.position, attacker.tokenSize,
    target.position, target.tokenSize
  )
  if (attackLine.length < 3) return results // Need intermediate cells

  const targetName = getDisplayName(target)
  const attackerName = getDisplayName(attacker)

  for (const interceptor of combatants) {
    if (interceptor.id === targetId || interceptor.id === attackerId) continue
    if (!interceptor.position) continue

    // Must be an ally of the target
    if (!isAllyCombatant(interceptor, target)) continue

    // Must pass general Intercept eligibility
    if (!canIntercept(interceptor).allowed) continue

    // Must be able to reach a cell on the line of attack (edge-to-edge for multi-tile)
    const speed = getCombatantSpeed(interceptor)
    const reachCheck = canReachLineOfAttack(interceptor.position, speed, attackLine, interceptor.tokenSize)
    if (!reachCheck.canReach) continue

    // Loyalty check for Pokemon
    const loyaltyCheck = checkInterceptLoyalty(interceptor, target)
    if (!loyaltyCheck.allowed) continue

    // Speed check for Priority/Interrupt moves
    const moveCheck = canInterceptMove(interceptor, attacker, move)
    if (!moveCheck.allowed) continue

    const interceptorName = getDisplayName(interceptor)

    results.push({
      id: uuidv4(),
      category: 'interrupt',
      actorId: interceptor.id,
      triggerId: attackerId,
      triggerType: 'ranged_in_range',
      triggerDescription: `${interceptorName} can Intercept Ranged: ${attackerName} targeted ${targetName} with ${move.name}`,
      round,
      status: 'pending',
      triggerContext: {
        moveName: move.name,
        originalTargetId: targetId,
        attackerId
      }
    })
  }

  return results
}

// ============================================
// INTERCEPT RESOLUTION
// ============================================

/**
 * Calculate the push direction for Intercept Melee.
 * The ally is pushed 1m directly away from the interceptor.
 *
 * Returns the new position for the pushed ally, or null if no valid push target.
 * Checks occupied cells to find a valid destination.
 */
export function calculatePushDirection(
  interceptorPos: GridPosition,
  allyPos: GridPosition,
  combatants: Combatant[],
  excludeIds: string[] = []
): GridPosition | null {
  // Vector from interceptor to ally
  const dx = allyPos.x - interceptorPos.x
  const dy = allyPos.y - interceptorPos.y

  // Normalize to direction (-1, 0, or 1)
  const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1
  const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1

  // Primary push direction
  const primaryTarget: GridPosition = {
    x: allyPos.x + dirX,
    y: allyPos.y + dirY
  }

  // Build occupied set
  const excludeSet = new Set(excludeIds)
  const occupiedSet = new Set<string>()
  for (const c of combatants) {
    if (excludeSet.has(c.id)) continue
    if (!c.position) continue
    for (let fx = 0; fx < c.tokenSize; fx++) {
      for (let fy = 0; fy < c.tokenSize; fy++) {
        occupiedSet.add(`${c.position.x + fx},${c.position.y + fy}`)
      }
    }
  }

  // Check primary direction
  if (!occupiedSet.has(`${primaryTarget.x},${primaryTarget.y}`)) {
    return primaryTarget
  }

  // Try adjacent cells as fallback (G1: nearest valid adjacent cell)
  const fallbacks: GridPosition[] = []
  for (let fdx = -1; fdx <= 1; fdx++) {
    for (let fdy = -1; fdy <= 1; fdy++) {
      if (fdx === 0 && fdy === 0) continue
      const candidate: GridPosition = {
        x: allyPos.x + fdx,
        y: allyPos.y + fdy
      }
      // Skip the interceptor's position
      if (candidate.x === interceptorPos.x && candidate.y === interceptorPos.y) continue
      if (!occupiedSet.has(`${candidate.x},${candidate.y}`)) {
        fallbacks.push(candidate)
      }
    }
  }

  if (fallbacks.length === 0) return null

  // Pick the fallback closest to the primary direction
  return fallbacks.reduce((best, candidate) => {
    const bestDist = Math.abs(candidate.x - primaryTarget.x) + Math.abs(candidate.y - primaryTarget.y)
    const currentBestDist = Math.abs(best.x - primaryTarget.x) + Math.abs(best.y - primaryTarget.y)
    return bestDist < currentBestDist ? candidate : best
  })
}

/**
 * Resolve an Intercept Melee action.
 *
 * PTU p.242:
 * - DC = 3 x distance (meters) from interceptor to target
 * - Success: Push ally 1m away, interceptor shifts to ally's old position, takes the hit
 * - Failure: Interceptor shifts floor(skillCheck / 3) meters toward target
 *
 * Returns updated combatants and result details. Does NOT mutate inputs.
 */
export function resolveInterceptMelee(
  combatants: Combatant[],
  interceptorId: string,
  targetId: string,
  attackerId: string,
  skillCheck: number
): {
  updatedCombatants: Combatant[]
  interceptSuccess: boolean
  distanceMoved: number
  dcRequired: number
  interceptorNewPosition?: GridPosition
  targetNewPosition?: GridPosition
} {
  const interceptor = combatants.find(c => c.id === interceptorId)
  const target = combatants.find(c => c.id === targetId)
  if (!interceptor?.position || !target?.position) {
    return { updatedCombatants: combatants, interceptSuccess: false, distanceMoved: 0, dcRequired: 0 }
  }

  // Calculate distance (edge-to-edge for multi-tile tokens) and DC
  const distance = ptuDistanceTokensBBox(
    { position: interceptor.position, size: interceptor.tokenSize },
    { position: target.position, size: target.tokenSize }
  )
  const dcRequired = 3 * distance

  const success = skillCheck >= dcRequired

  if (success) {
    // Push ally 1m away, interceptor shifts to ally's old position
    const allyOldPos = { ...target.position }
    const pushTarget = calculatePushDirection(
      interceptor.position,
      target.position,
      combatants,
      [interceptorId, targetId]
    )

    const targetNewPosition = pushTarget || allyOldPos // If no push possible, ally stays (G1)
    const interceptorNewPosition = { ...allyOldPos }

    const updatedCombatants = combatants.map(c => {
      if (c.id === interceptorId) {
        return {
          ...c,
          position: interceptorNewPosition,
          turnState: {
            ...c.turnState,
            standardActionUsed: true,
            shiftActionUsed: true
          },
          outOfTurnUsage: {
            ...(c.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
            interruptUsed: true
          }
        }
      }
      if (c.id === targetId && pushTarget) {
        return {
          ...c,
          position: targetNewPosition
        }
      }
      return c
    })

    return {
      updatedCombatants,
      interceptSuccess: true,
      distanceMoved: distance,
      dcRequired,
      interceptorNewPosition,
      targetNewPosition: pushTarget ? targetNewPosition : undefined
    }
  } else {
    // Failure: shift floor(skillCheck / 3) meters toward target
    const shiftDistance = Math.floor(skillCheck / 3)

    let newInterceptorPos = { ...interceptor.position }
    if (shiftDistance > 0 && target.position) {
      // Move interceptor toward target along the shortest path
      const dx = target.position.x - interceptor.position.x
      const dy = target.position.y - interceptor.position.y
      const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1
      const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1

      // Step-by-step movement toward target with PTU alternating diagonal cost
      // Per decree-002: diagonal movement alternates 1m/2m cost
      let moved = 0
      let cx = interceptor.position.x
      let cy = interceptor.position.y
      let diagCount = 0
      while (moved < shiftDistance) {
        const nextX = cx + dirX
        const nextY = cy + dirY
        const isDiag = dirX !== 0 && dirY !== 0
        const stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1
        if (moved + stepCost > shiftDistance) break
        // Don't move onto the target's position
        if (nextX === target.position.x && nextY === target.position.y) break
        cx = nextX
        cy = nextY
        moved += stepCost
        if (isDiag) diagCount++
      }
      newInterceptorPos = { x: cx, y: cy }
    }

    const updatedCombatants = combatants.map(c => {
      if (c.id === interceptorId) {
        return {
          ...c,
          position: newInterceptorPos,
          turnState: {
            ...c.turnState,
            standardActionUsed: true,
            shiftActionUsed: true
          },
          outOfTurnUsage: {
            ...(c.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
            interruptUsed: true
          }
        }
      }
      return c
    })

    return {
      updatedCombatants,
      interceptSuccess: false,
      distanceMoved: shiftDistance,
      dcRequired,
      interceptorNewPosition: newInterceptorPos
    }
  }
}

/**
 * Resolve an Intercept Ranged action.
 *
 * PTU p.242:
 * - Interceptor shifts floor(skillCheck / 2) meters toward chosen target square
 * - If they reach the square, they take the attack instead
 * - If not, they still shift the calculated distance
 *
 * Returns updated combatants and result details. Does NOT mutate inputs.
 */
export function resolveInterceptRanged(
  combatants: Combatant[],
  interceptorId: string,
  targetSquare: GridPosition,
  skillCheck: number
): {
  updatedCombatants: Combatant[]
  interceptSuccess: boolean
  distanceMoved: number
  interceptorNewPosition?: GridPosition
  reachedTarget: boolean
} {
  const interceptor = combatants.find(c => c.id === interceptorId)
  if (!interceptor?.position) {
    return {
      updatedCombatants: combatants,
      interceptSuccess: false,
      distanceMoved: 0,
      reachedTarget: false
    }
  }

  // Calculate max shift distance
  const maxShift = Math.floor(skillCheck / 2)

  // Calculate distance to target square (edge-to-edge for multi-tile interceptors)
  const distanceToTarget = ptuDistanceTokensBBox(
    { position: interceptor.position, size: interceptor.tokenSize },
    { position: targetSquare, size: 1 }
  )

  const reachedTarget = maxShift >= distanceToTarget
  const distanceMoved = Math.min(maxShift, distanceToTarget)

  // Move interceptor toward target square
  let newPosition: GridPosition
  if (reachedTarget) {
    newPosition = { ...targetSquare }
  } else {
    // Move along the direction toward target square
    const dx = targetSquare.x - interceptor.position.x
    const dy = targetSquare.y - interceptor.position.y
    const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1
    const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1

    // Per decree-002: diagonal movement alternates 1m/2m cost
    let moved = 0
    let cx = interceptor.position.x
    let cy = interceptor.position.y
    let diagCount = 0
    while (moved < maxShift) {
      const isDiag = dirX !== 0 && dirY !== 0
      const stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1
      if (moved + stepCost > maxShift) break
      cx += dirX
      cy += dirY
      moved += stepCost
      if (isDiag) diagCount++
    }
    newPosition = { x: cx, y: cy }
  }

  const updatedCombatants = combatants.map(c => {
    if (c.id === interceptorId) {
      return {
        ...c,
        position: newPosition,
        turnState: {
          ...c.turnState,
          standardActionUsed: true,
          shiftActionUsed: true
        },
        outOfTurnUsage: {
          ...(c.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
          interruptUsed: true
        }
      }
    }
    return c
  })

  return {
    updatedCombatants,
    interceptSuccess: reachedTarget,
    distanceMoved,
    interceptorNewPosition: newPosition,
    reachedTarget
  }
}
