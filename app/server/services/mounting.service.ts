/**
 * Mounting Service
 *
 * Handles mount/dismount business logic for PTU combat encounters.
 * Pure functions that operate on combatant arrays -- no DB access.
 * API endpoints call these functions and handle persistence.
 *
 * PTU p.218: Mounting is a Standard Action (Acrobatics/Athletics DC 10).
 * PTU p.306-307: Mountable X capability determines rider capacity.
 */

import type { Combatant } from '~/types/encounter'
import type { MountState } from '~/types/combat'
import type { GridPosition } from '~/types/spatial'
import type { Pokemon, HumanCharacter, StatusCondition } from '~/types/character'
import {
  isMountable,
  getMountCapacity,
  countCurrentRiders,
  hasMountedProwess,
  getMountActionCost
} from '~/utils/mountingRules'
import { areAdjacent, getTokenCells, getAdjacentCellsForFootprint } from '~/utils/adjacency'
import { getFootprintCells } from '~/utils/sizeCategory'
import { getOverlandSpeed } from '~/utils/combatantCapabilities'
import { applyMovementModifiers } from '~/utils/movementModifiers'

// ============================================================
// Result Types
// ============================================================

export interface MountResult {
  updatedCombatants: Combatant[]
  riderId: string
  mountId: string
  actionCost: 'standard' | 'free_with_shift'
  checkRequired: boolean
  checkAutoSuccess: boolean
}

export interface DismountResult {
  updatedCombatants: Combatant[]
  riderId: string
  mountId: string
  riderPosition: GridPosition | null
  forced: boolean
}

// ============================================================
// Validation Helpers
// ============================================================

/** Status conditions that prevent mounting (PTU p.218) */
const MOUNT_BLOCKING_CONDITIONS: readonly string[] = ['Fainted', 'Stuck', 'Frozen']

/**
 * Validate mount preconditions. Throws descriptive errors on failure.
 */
function validateMountPreconditions(
  combatants: Combatant[],
  riderId: string,
  mountId: string
): { rider: Combatant; mount: Combatant } {
  const rider = combatants.find(c => c.id === riderId)
  if (!rider) {
    throw createError({ statusCode: 404, message: 'Rider combatant not found' })
  }

  const mount = combatants.find(c => c.id === mountId)
  if (!mount) {
    throw createError({ statusCode: 404, message: 'Mount combatant not found' })
  }

  // Rule 2: rider must be human
  if (rider.type !== 'human') {
    throw createError({ statusCode: 400, message: 'Only trainers (human combatants) can mount Pokemon' })
  }

  // Rule 3: mount must be pokemon
  if (mount.type !== 'pokemon') {
    throw createError({ statusCode: 400, message: 'Only Pokemon can be mounted' })
  }

  // Rule 4: mount must have Mountable capability
  if (!isMountable(mount)) {
    throw createError({ statusCode: 400, message: 'This Pokemon does not have the Mountable capability' })
  }

  // Rule 5: capacity check
  const capacity = getMountCapacity(mount)
  const currentRiders = countCurrentRiders(mountId, combatants)
  if (currentRiders >= capacity) {
    throw createError({
      statusCode: 400,
      message: `Mount is at capacity (${currentRiders}/${capacity} riders)`
    })
  }

  // Rule 6: rider not already mounted
  if (rider.mountState?.isMounted) {
    throw createError({ statusCode: 400, message: 'Rider is already mounted on another Pokemon' })
  }

  // Rule 7: same side
  if (rider.side !== mount.side) {
    throw createError({ statusCode: 400, message: 'Rider and mount must be on the same side' })
  }

  // Rule 8: adjacency check (if grid positions exist)
  if (rider.position && mount.position) {
    const adjacent = areAdjacent(
      rider.position, rider.tokenSize || 1,
      mount.position, mount.tokenSize || 1
    )
    // Also allow same-position (in case they share a cell already)
    const samePosition = rider.position.x === mount.position.x && rider.position.y === mount.position.y
    if (!adjacent && !samePosition) {
      throw createError({ statusCode: 400, message: 'Rider must be adjacent to the mount' })
    }
  }

  // Rule 9: rider status conditions
  const riderConditions: string[] = (rider.entity as HumanCharacter).statusConditions ?? []
  if (MOUNT_BLOCKING_CONDITIONS.some(c => riderConditions.includes(c))) {
    throw createError({ statusCode: 400, message: 'Rider cannot mount while Fainted, Stuck, or Frozen' })
  }

  // Rule 10: mount not fainted
  const mountConditions: string[] = (mount.entity as Pokemon).statusConditions ?? []
  if (mountConditions.includes('Fainted')) {
    throw createError({ statusCode: 400, message: 'Cannot mount a Fainted Pokemon' })
  }

  return { rider, mount }
}

// ============================================================
// Mount
// ============================================================

/**
 * Execute a mount action. Returns new combatant array (immutable).
 * Throws if validation fails.
 */
export function executeMount(
  combatants: Combatant[],
  riderId: string,
  mountId: string,
  skipCheck?: boolean
): MountResult {
  const { rider, mount } = validateMountPreconditions(combatants, riderId, mountId)

  const actionCost = getMountActionCost(rider)
  const checkAutoSuccess = hasMountedProwess(rider)
  // GM override: skipCheck bypasses the DC 10 mounting check
  const checkRequired = skipCheck ? false : !checkAutoSuccess

  // Apply movement modifiers (Slowed, Speed CS, Sprint) from the mount's conditions
  // ONCE upfront so movementRemaining is the final budget. The client returns this
  // value directly from getSpeed/getMaxPossibleSpeed without re-applying modifiers.
  const mountMovement = applyMovementModifiers(mount, getOverlandSpeed(mount))

  const updatedCombatants = combatants.map(c => {
    if (c.id === riderId) {
      return {
        ...c,
        mountState: {
          isMounted: true,
          partnerId: mountId,
          movementRemaining: mountMovement
        } as MountState,
        // Move rider to mount's position (they share the same grid square)
        position: mount.position ? { ...mount.position } : c.position,
        // Consume Standard Action if not Expert-level free mount
        turnState: actionCost === 'standard'
          ? { ...c.turnState, standardActionUsed: true }
          : c.turnState
      }
    }
    if (c.id === mountId) {
      return {
        ...c,
        mountState: {
          isMounted: false, // mount is being ridden, not riding
          partnerId: riderId,
          movementRemaining: mountMovement
        } as MountState
      }
    }
    return c
  })

  return {
    updatedCombatants,
    riderId,
    mountId,
    actionCost,
    checkRequired,
    checkAutoSuccess
  }
}

// ============================================================
// Dismount
// ============================================================

/**
 * Build a set of occupied cell keys from combatants (excluding specific IDs).
 */
function buildOccupiedCellSet(combatants: Combatant[], excludeIds: string[]): Set<string> {
  const excludeSet = new Set(excludeIds)
  const occupied = new Set<string>()
  for (const c of combatants) {
    if (excludeSet.has(c.id)) continue
    if (!c.position) continue
    const cells = getFootprintCells(c.position.x, c.position.y, c.tokenSize || 1)
    for (const cell of cells) {
      occupied.add(`${cell.x},${cell.y}`)
    }
  }
  return occupied
}

/**
 * Find the best adjacent cell for a dismounting rider.
 * Prefers cells in this order: same-row right, same-row left,
 * same-col down, same-col up, diagonals.
 * Returns null if all adjacent cells are occupied.
 */
export function findDismountPosition(
  mountPosition: GridPosition,
  mountSize: number,
  occupiedCells: Set<string>,
  gridWidth: number,
  gridHeight: number
): GridPosition | null {
  const candidates: GridPosition[] = []

  // Right side, left side
  for (let dy = 0; dy < mountSize; dy++) {
    candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y + dy })
    candidates.push({ x: mountPosition.x - 1, y: mountPosition.y + dy })
  }
  // Below, above
  for (let dx = 0; dx < mountSize; dx++) {
    candidates.push({ x: mountPosition.x + dx, y: mountPosition.y + mountSize })
    candidates.push({ x: mountPosition.x + dx, y: mountPosition.y - 1 })
  }
  // Diagonals
  candidates.push({ x: mountPosition.x - 1, y: mountPosition.y - 1 })
  candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y - 1 })
  candidates.push({ x: mountPosition.x - 1, y: mountPosition.y + mountSize })
  candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y + mountSize })

  for (const pos of candidates) {
    if (pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight) continue
    if (!occupiedCells.has(`${pos.x},${pos.y}`)) return pos
  }

  return null
}

/**
 * Execute a dismount action. Returns new combatant array (immutable).
 * Throws if validation fails.
 */
export function executeDismount(
  combatants: Combatant[],
  riderId: string,
  forced: boolean,
  gridWidth: number,
  gridHeight: number,
  _skipCheck?: boolean
): DismountResult {
  const rider = combatants.find(c => c.id === riderId)
  if (!rider) {
    throw createError({ statusCode: 404, message: 'Rider combatant not found' })
  }

  if (!rider.mountState?.isMounted) {
    throw createError({ statusCode: 400, message: 'Rider is not currently mounted' })
  }

  const mountId = rider.mountState.partnerId
  const mount = combatants.find(c => c.id === mountId)
  if (!mount) {
    throw createError({ statusCode: 404, message: 'Mount combatant not found' })
  }

  // Determine rider's new position (adjacent to mount)
  let riderPosition: GridPosition | null = null
  if (mount.position) {
    const mountSize = mount.tokenSize || 1
    // Exclude rider from occupied set since they are moving
    const occupiedCells = buildOccupiedCellSet(combatants, [riderId])
    riderPosition = findDismountPosition(
      mount.position, mountSize, occupiedCells, gridWidth, gridHeight
    )
  }

  const updatedCombatants = combatants.map(c => {
    if (c.id === riderId) {
      return {
        ...c,
        mountState: undefined,
        // Place rider at the dismount position (or keep current if no valid position)
        position: riderPosition ?? c.position
      }
    }
    if (c.id === mountId) {
      return {
        ...c,
        mountState: undefined
      }
    }
    return c
  })

  return {
    updatedCombatants,
    riderId,
    mountId,
    riderPosition,
    forced
  }
}

// ============================================================
// Mount State Lifecycle
// ============================================================

/**
 * Reset mount movement for a new round.
 * Called by resetCombatantsForNewRound.
 * Sets movementRemaining to mount's modifier-adjusted movement speed for all active mount pairs.
 * Movement modifiers (Slowed, Speed CS, Sprint) are applied from the mount's conditions
 * ONCE here so the client can return movementRemaining directly without re-applying.
 * Returns a new combatant array (immutable).
 */
export function resetMountMovement(combatants: Combatant[]): Combatant[] {
  return combatants.map(c => {
    if (!c.mountState) return c

    if (!c.mountState.isMounted) {
      // This is the mount -- recalculate movement from its Overland speed with modifiers
      const mountSpeed = applyMovementModifiers(c, getOverlandSpeed(c))
      return {
        ...c,
        mountState: {
          ...c.mountState,
          movementRemaining: mountSpeed
        }
      }
    }

    // This is the rider -- sync movement with mount's modified speed
    const mountPartner = combatants.find(p => p.id === c.mountState!.partnerId)
    if (mountPartner) {
      const mountSpeed = applyMovementModifiers(mountPartner, getOverlandSpeed(mountPartner))
      return {
        ...c,
        mountState: {
          ...c.mountState,
          movementRemaining: mountSpeed
        }
      }
    }

    return c
  })
}

/**
 * Clear mount state when a combatant is removed from encounter.
 * If the removed combatant is a rider, clear mount state on the mount.
 * If the removed combatant is a mount, clear mount state on all its riders.
 * Returns a new combatant array (immutable).
 */
export function clearMountOnRemoval(
  combatants: Combatant[],
  removedId: string
): Combatant[] {
  return combatants.map(c => {
    if (c.mountState && c.mountState.partnerId === removedId) {
      return {
        ...c,
        mountState: undefined
      }
    }
    return c
  })
}

/**
 * Clear mount state when a combatant faints.
 * PTU: when mount faints, rider is automatically dismounted.
 * When rider faints, the mount relationship is cleared.
 * Returns a new combatant array and a flag indicating if dismount occurred.
 */
export function clearMountOnFaint(
  combatants: Combatant[],
  faintedId: string,
  gridWidth: number,
  gridHeight: number
): { combatants: Combatant[]; dismounted: boolean } {
  const fainted = combatants.find(c => c.id === faintedId)
  if (!fainted?.mountState) {
    return { combatants, dismounted: false }
  }

  const partnerId = fainted.mountState.partnerId

  if (fainted.mountState.isMounted) {
    // Rider fainted -- just clear mount state on both
    const updated = combatants.map(c => {
      if (c.id === faintedId || c.id === partnerId) {
        return { ...c, mountState: undefined }
      }
      return c
    })
    return { combatants: updated, dismounted: true }
  }

  // Mount fainted -- auto-dismount rider with position placement
  const rider = combatants.find(c => c.id === partnerId)
  if (!rider) {
    // Partner not found, just clear the fainted combatant's state
    const updated = combatants.map(c => {
      if (c.id === faintedId) {
        return { ...c, mountState: undefined }
      }
      return c
    })
    return { combatants: updated, dismounted: false }
  }

  // Find dismount position for the rider
  let riderPosition: GridPosition | null = null
  if (fainted.position) {
    const mountSize = fainted.tokenSize || 1
    const occupiedCells = buildOccupiedCellSet(combatants, [partnerId])
    riderPosition = findDismountPosition(
      fainted.position, mountSize, occupiedCells, gridWidth, gridHeight
    )
  }

  const updated = combatants.map(c => {
    if (c.id === faintedId) {
      return { ...c, mountState: undefined }
    }
    if (c.id === partnerId) {
      return {
        ...c,
        mountState: undefined,
        position: riderPosition ?? c.position
      }
    }
    return c
  })

  return { combatants: updated, dismounted: true }
}
