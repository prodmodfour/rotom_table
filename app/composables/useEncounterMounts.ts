import type { Encounter } from '~/types'
import type { GridPosition } from '~/types/spatial'
import { CONQUERORS_MARCH_CONDITION } from '~/constants/trainerClasses'

/**
 * Composable for encounter mount/dismount and Rider class feature actions.
 * Handles mounting, dismounting, Agility Training, Conqueror's March,
 * Ride as One, scene-limited features, and Living Weapon wield state.
 */

interface EncounterMountsContext {
  getEncounter: () => Encounter | null
  setEncounter: (enc: Encounter) => void
  setError: (msg: string) => void
}

export function useEncounterMounts(ctx: EncounterMountsContext) {

  // ===========================================
  // Mount / Dismount (feature-004)
  // ===========================================

  /** Mount a trainer on an adjacent Pokemon with the Mountable capability */
  async function mountRider(riderId: string, mountId: string, skipCheck?: boolean) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          mountResult: {
            riderId: string
            mountId: string
            actionCost: 'standard' | 'free_with_shift'
            checkRequired: boolean
            checkAutoSuccess: boolean
            mounted: boolean
          }
        }
      }>(`/api/encounters/${encounter.id}/mount`, {
        method: 'POST',
        body: { riderId, mountId, skipCheck }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data.mountResult
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to mount')
      throw e
    }
  }

  /** Dismount a trainer from their mounted Pokemon */
  async function dismountRider(riderId: string, forced?: boolean, skipCheck?: boolean) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          dismountResult: {
            riderId: string
            mountId: string
            riderPosition: GridPosition | null
            forced: boolean
            dismounted: boolean
          }
        }
      }>(`/api/encounters/${encounter.id}/dismount`, {
        method: 'POST',
        body: { riderId, forced, skipCheck }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data.dismountResult
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to dismount')
      throw e
    }
  }

  // ===========================================
  // Rider Class Feature Activation (feature-004 P2)
  // ===========================================

  /**
   * Toggle Agility Training on/off for a mounted pair.
   * Stored as a persistent flag on mountState (not tempConditions) so it
   * survives turn-end clearing. Cleared automatically on dismount.
   * Rider feature doubles the Training bonus: +2 Movement, +8 Initiative.
   */
  function toggleAgilityTraining(combatantId: string) {
    const encounter = ctx.getEncounter()
    if (!encounter) return
    const combatant = encounter.combatants.find(c => c.id === combatantId)
    if (!combatant?.mountState) return

    // Find the mount (the one with isMounted=false)
    const mountId = combatant.mountState.isMounted ? combatant.mountState.partnerId : combatantId
    const mount = encounter.combatants.find(c => c.id === mountId)
    if (!mount?.mountState) return

    const newActive = !mount.mountState.agilityTrainingActive
    mount.mountState = {
      ...mount.mountState,
      agilityTrainingActive: newActive
    }

    // Also set on rider for consistency
    const riderId = combatant.mountState.isMounted ? combatantId : combatant.mountState.partnerId
    const rider = encounter.combatants.find(c => c.id === riderId)
    if (rider?.mountState) {
      rider.mountState = {
        ...rider.mountState,
        agilityTrainingActive: newActive
      }
    }
  }

  /**
   * Activate Conqueror's March for the current round.
   * Adds CONQUERORS_MARCH_CONDITION temp condition to the mount.
   * Consumes the rider's Standard Action (it is an Order).
   * Requires: rider has feature, mount has Run Up, mount is being ridden.
   */
  function activateConquerorsMarch(riderId: string, mountId: string) {
    const encounter = ctx.getEncounter()
    if (!encounter) return
    const mount = encounter.combatants.find(c => c.id === mountId)
    if (!mount) return

    const tempConditions = mount.tempConditions ?? []
    if (!tempConditions.includes(CONQUERORS_MARCH_CONDITION)) {
      mount.tempConditions = [...tempConditions, CONQUERORS_MARCH_CONDITION]
    }

    // Conqueror's March costs a Standard Action (it is an Order)
    const rider = encounter.combatants.find(c => c.id === riderId)
    if (rider) {
      rider.turnState = {
        ...rider.turnState,
        standardActionUsed: true
      }
    }
  }

  /**
   * Record a scene-limited feature use (Lean In, Overrun).
   * Increments usedThisScene for the given feature on the combatant.
   */
  function useSceneFeature(combatantId: string, featureName: string, maxPerScene: number): boolean {
    const encounter = ctx.getEncounter()
    if (!encounter) return false
    const combatant = encounter.combatants.find(c => c.id === combatantId)
    if (!combatant) return false

    const usage = combatant.featureUsage ?? {}
    const current = usage[featureName] ?? { usedThisScene: 0, maxPerScene }

    if (current.usedThisScene >= current.maxPerScene) return false

    combatant.featureUsage = {
      ...usage,
      [featureName]: {
        usedThisScene: current.usedThisScene + 1,
        maxPerScene
      }
    }
    return true
  }

  /**
   * Set the Ride as One initiative swap flag on a mounted pair.
   * When the first pair member's turn comes up and the GM chooses the other,
   * this flag is set to indicate the swap occurred.
   */
  function setRideAsOneSwapped(combatantId: string, swapped: boolean) {
    const encounter = ctx.getEncounter()
    if (!encounter) return
    const combatant = encounter.combatants.find(c => c.id === combatantId)
    if (!combatant?.mountState) return

    combatant.mountState = {
      ...combatant.mountState,
      rideAsOneSwapped: swapped
    }

    // Also set on partner
    const partner = encounter.combatants.find(c => c.id === combatant.mountState!.partnerId)
    if (partner?.mountState) {
      partner.mountState = {
        ...partner.mountState,
        rideAsOneSwapped: swapped
      }
    }
  }

  /**
   * Update distance moved this turn for a combatant.
   * Called by movement handlers when a combatant moves.
   */
  function addDistanceMoved(combatantId: string, distance: number) {
    const encounter = ctx.getEncounter()
    if (!encounter) return
    const combatant = encounter.combatants.find(c => c.id === combatantId)
    if (!combatant) return

    combatant.turnState = {
      ...combatant.turnState,
      distanceMovedThisTurn: (combatant.turnState.distanceMovedThisTurn ?? 0) + distance
    }
  }

  return {
    mountRider,
    dismountRider,
    toggleAgilityTraining,
    activateConquerorsMarch,
    useSceneFeature,
    setRideAsOneSwapped,
    addDistanceMoved
  }
}
