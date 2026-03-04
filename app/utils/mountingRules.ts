/**
 * Mounting rules and capability parsing for PTU Pokemon mounting system.
 *
 * PTU p.306-307: "Mountable X: This Pokemon may serve as a mount for
 * X average Trainers regardless of Power Capability and ignoring
 * penalties for weight carried."
 *
 * PTU p.218: Mounting is a Standard Action with Acrobatics/Athletics DC 10.
 * Expert skill: mount as Free Action during Shift (2m+ movement).
 *
 * PTU p.139: Mounted Prowess edge: auto-succeed mounting checks,
 * +3 to remain-mounted checks.
 */

import type { Combatant } from '~/types/encounter'
import type { Pokemon, HumanCharacter, SkillRank } from '~/types/character'
import { RIDER_FEATURE_NAMES } from '~/constants/trainerClasses'

// ============================================================
// Constants
// ============================================================

/** PTU p.218: DC for mounting a Pokemon */
export const MOUNT_CHECK_DC = 10

/** PTU p.218: DC for remaining mounted (dismount check) */
export const DISMOUNT_CHECK_DC = 10

/** PTU p.139: Mounted Prowess bonus to remain-mounted checks */
export const MOUNTED_PROWESS_REMAIN_BONUS = 3

/** PTU p.218: Minimum shift distance for Expert-level free mount */
export const FREE_MOUNT_MIN_SHIFT = 2

/** Default trainer movement speed (meters) */
export const TRAINER_DEFAULT_SPEED = 5

// ============================================================
// Capability Parsing
// ============================================================

/**
 * Parse the Mountable capability from a Pokemon's otherCapabilities.
 * Returns the capacity (number of trainers it can carry), or 0 if not mountable.
 *
 * Matches patterns: "Mountable 1", "Mountable 2", "Mountable X" (treated as 1).
 * Case-insensitive. Handles leading/trailing whitespace.
 */
export function parseMountableCapacity(otherCapabilities: string[]): number {
  if (!otherCapabilities || otherCapabilities.length === 0) return 0

  for (const cap of otherCapabilities) {
    const match = cap.trim().match(/^mountable\s+(\d+)$/i)
    if (match) {
      return parseInt(match[1], 10)
    }
    // Handle bare "Mountable" without a number (treat as 1)
    if (cap.trim().toLowerCase() === 'mountable') {
      return 1
    }
  }

  return 0
}

/**
 * Check if a Pokemon combatant has the Mountable capability.
 */
export function isMountable(combatant: Combatant): boolean {
  if (combatant.type !== 'pokemon') return false
  const pokemon = combatant.entity as Pokemon
  const caps = pokemon.capabilities?.otherCapabilities
  if (!caps) return false
  return parseMountableCapacity(caps) > 0
}

/**
 * Get the mount capacity of a Pokemon combatant.
 * Returns 0 if not a Pokemon or not mountable.
 */
export function getMountCapacity(combatant: Combatant): number {
  if (combatant.type !== 'pokemon') return 0
  const pokemon = combatant.entity as Pokemon
  const caps = pokemon.capabilities?.otherCapabilities
  if (!caps) return 0
  return parseMountableCapacity(caps)
}

/**
 * Count how many riders are currently mounted on a given mount.
 * Searches all combatants for riders pointing to this mount's ID.
 */
export function countCurrentRiders(mountId: string, combatants: Combatant[]): number {
  return combatants.filter(
    c => c.mountState?.isMounted && c.mountState.partnerId === mountId
  ).length
}

// ============================================================
// Skill & Edge Checks
// ============================================================

/**
 * Check if a trainer has the Mounted Prowess edge.
 * PTU p.139: Auto-succeed mounting checks, +3 to remain-mounted checks.
 */
export function hasMountedProwess(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  return (human.edges ?? []).some(
    edge => edge.toLowerCase().includes('mounted prowess')
  )
}

/**
 * Check if a trainer's Acrobatics or Athletics skill is at least Expert.
 * Used to determine if mounting can be done as a Free Action during Shift.
 * PTU p.218: "If your Acrobatics or Athletics is at least Expert..."
 */
export function hasExpertMountingSkill(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  const skills = human.skills ?? {}
  const expertOrAbove: SkillRank[] = ['Expert', 'Master']
  const acrobatics = skills['Acrobatics'] ?? skills['acrobatics']
  const athletics = skills['Athletics'] ?? skills['athletics']
  return expertOrAbove.includes(acrobatics as SkillRank) ||
         expertOrAbove.includes(athletics as SkillRank)
}

/**
 * Determine the action cost for mounting.
 * PTU p.218:
 * - Standard Action (Acrobatics/Athletics DC 10) by default
 * - Free Action during Shift if Expert Acrobatics/Athletics AND 2m+ movement
 * - Mounted Prowess: auto-succeed the check (still costs the action)
 */
export function getMountActionCost(
  combatant: Combatant
): 'standard' | 'free_with_shift' {
  if (hasExpertMountingSkill(combatant)) {
    return 'free_with_shift'
  }
  return 'standard'
}

/**
 * Check whether damage triggers a dismount check.
 * PTU p.218: "damage equal or greater to 1/4th of the target's Max Hit Points"
 * Per decree-004: uses real HP damage after temp HP absorption.
 */
export function triggersDismountCheck(hpDamage: number, maxHp: number): boolean {
  return hpDamage >= Math.floor(maxHp / 4)
}

// ============================================================
// Dismount Check Info
// ============================================================

export type DismountCheckReason = 'damage' | 'push' | 'confusion'

/**
 * Information about a triggered dismount check, returned in API responses.
 * The GM uses this to manually resolve the Acrobatics/Athletics check.
 */
export interface DismountCheckInfo {
  triggered: boolean
  riderId: string
  mountId: string
  dc: number
  mountedProwessBonus: number
  reason: DismountCheckReason
}

/**
 * Build dismount check info for a mounted combatant that was hit.
 * Determines the rider and mount IDs from the damaged combatant's mount state.
 */
export function buildDismountCheckInfo(
  damagedCombatant: Combatant,
  reason: DismountCheckReason,
  combatants: Combatant[]
): DismountCheckInfo | null {
  if (!damagedCombatant.mountState) return null

  const isRider = damagedCombatant.mountState.isMounted
  const riderId = isRider ? damagedCombatant.id : damagedCombatant.mountState.partnerId
  const mountId = isRider ? damagedCombatant.mountState.partnerId : damagedCombatant.id

  // Look up rider for Mounted Prowess check
  const rider = combatants.find(c => c.id === riderId)
  const prowessBonus = rider && hasMountedProwess(rider) ? MOUNTED_PROWESS_REMAIN_BONUS : 0

  return {
    triggered: true,
    riderId,
    mountId,
    dc: DISMOUNT_CHECK_DC,
    mountedProwessBonus: prowessBonus,
    reason
  }
}

// ============================================================
// Intercept Bonus (PTU p.218)
// ============================================================

/**
 * Check if two combatants are a mounted pair and can easily Intercept for each other.
 * PTU p.218: "It is very easy for you and your Pokemon to Intercept attacks
 * for each other while you are Mounted due to the lack of distance."
 *
 * Returns true if interceptor and target are a mounted pair (rider/mount relationship).
 */
export function isEasyIntercept(
  interceptorId: string,
  targetId: string,
  combatants: Combatant[]
): boolean {
  const interceptor = combatants.find(c => c.id === interceptorId)
  if (!interceptor?.mountState) return false
  return interceptor.mountState.partnerId === targetId
}

// ============================================================
// Rider Class Feature Detection (P2)
// ============================================================

/**
 * Check if a combatant has the Rider trainer class.
 * PTU p.102: Rider is a Battling Style class.
 */
export function hasRiderClass(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  return (human.trainerClasses ?? []).some(
    cls => cls === 'Rider' || cls.startsWith('Rider:')
  )
}

/**
 * Check if a combatant has a specific Rider class feature.
 * Features are stored in the HumanCharacter.features array.
 * Uses case-insensitive matching against RIDER_FEATURE_NAMES.
 */
export function hasRiderFeature(combatant: Combatant, featureName: string): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  const normalizedTarget = featureName.toLowerCase()
  return (human.features ?? []).some(
    f => f.toLowerCase() === normalizedTarget
  )
}

/**
 * Check if a Pokemon combatant has the Run Up ability.
 * Run Up is granted by Ramming Speed (2 Tutor Points → Run Up ability).
 */
export function hasRunUp(combatant: Combatant): boolean {
  if (combatant.type !== 'pokemon') return false
  const pokemon = combatant.entity as Pokemon
  return (pokemon.abilities ?? []).some(
    a => a.name.toLowerCase() === 'run up'
  )
}

/**
 * Check if a move uses Dash or Pass range.
 * Used by Run Up, Conqueror's March, and Overrun features.
 */
export function isDashOrPassRange(moveRange: string): boolean {
  const lower = moveRange.toLowerCase().trim()
  return lower === 'dash' || lower === 'pass' ||
    lower.startsWith('dash') || lower.startsWith('pass')
}

/**
 * Get remaining uses for a scene-limited feature (Lean In, Overrun).
 * Returns the number of uses remaining, or the max if not yet tracked.
 */
export function getFeatureUsesRemaining(
  combatant: Combatant,
  featureName: string,
  maxPerScene: number
): number {
  const usage = combatant.featureUsage?.[featureName]
  if (!usage) return maxPerScene
  return Math.max(0, usage.maxPerScene - usage.usedThisScene)
}

/**
 * Check if a move's range qualifies for Conqueror's March override.
 * PTU p.103: Dash, Burst, Blast, Cone, or Line range moves become Pass range.
 */
export function isConquerorsMarchEligibleRange(moveRange: string): boolean {
  const lower = moveRange.toLowerCase().trim()
  return lower === 'dash' ||
    lower.startsWith('burst') ||
    lower.startsWith('blast') ||
    lower.startsWith('cone') ||
    lower.startsWith('line')
}

// ============================================================
// Run Up Damage Bonus (P2, PTU p.103)
// ============================================================

/**
 * Calculate the Run Up damage bonus for a Dash/Pass move.
 * PTU p.103 (via Ramming Speed): "+1 bonus to their Damage Rolls for
 * every 3 meters the Pokemon moved this turn"
 *
 * @param distanceMovedThisTurn - Distance moved in meters this turn
 * @returns Damage bonus to add to the damage roll
 */
export function calculateRunUpBonus(distanceMovedThisTurn: number): number {
  return Math.floor(distanceMovedThisTurn / 3)
}

// ============================================================
// Overrun Modifier (P2, PTU p.103)
// ============================================================

/**
 * Calculate Overrun damage modifiers.
 * PTU p.103: "Your Pokemon adds their Speed Stat in addition to their
 * normal attacking Stat to their Damage Roll. The target gains Damage
 * Reduction against this attack equal to their own Speed Stat."
 *
 * @param mountSpeedStat - The mount's current Speed stat (base, pre-stage)
 * @param mountSpeedStage - The mount's Speed combat stage (-6 to +6)
 * @param targetSpeedStat - The target's current Speed stat (base, pre-stage)
 * @param targetSpeedStage - The target's Speed combat stage (-6 to +6)
 * @returns Object with bonusDamage (mount Speed) and targetDR (target Speed)
 */
export function calculateOverrunModifiers(
  mountSpeedStat: number,
  mountSpeedStage: number,
  targetSpeedStat: number,
  targetSpeedStage: number
): { bonusDamage: number; targetDR: number } {
  // Import would create circular dep; inline the stage multiplier calculation
  const STAGE_MULTS: Record<number, number> = {
    [-6]: 0.4, [-5]: 0.5, [-4]: 0.6, [-3]: 0.7, [-2]: 0.8, [-1]: 0.9,
    [0]: 1.0, [1]: 1.2, [2]: 1.4, [3]: 1.6, [4]: 1.8, [5]: 2.0, [6]: 2.2
  }
  const clamp = (v: number) => Math.max(-6, Math.min(6, v))
  const effectiveMountSpeed = Math.floor(mountSpeedStat * STAGE_MULTS[clamp(mountSpeedStage)])
  const effectiveTargetSpeed = Math.floor(targetSpeedStat * STAGE_MULTS[clamp(targetSpeedStage)])

  return {
    bonusDamage: effectiveMountSpeed,
    targetDR: effectiveTargetSpeed
  }
}

// ============================================================
// Lean In Resistance Step (P2, PTU p.103)
// ============================================================

/**
 * PTU resistance step progression.
 * Each step halves the damage. Lean In adds one additional step.
 *
 * Effectiveness values in PTU:
 * 2.0 (Super Effective) -> 1.0 (Neutral) -> 0.5 (Resisted) -> 0.25 (Double Resisted)
 *
 * "Resist one step further" means:
 * - If currently at 2.0: becomes 1.0
 * - If currently at 1.5: becomes 1.0 (capped — PTU doesn't have 0.75)
 * - If currently at 1.0: becomes 0.5
 * - If currently at 0.5: becomes 0.25
 * - If at 0.25: stays at 0.25 (floor)
 *
 * @param currentEffectiveness - The current type effectiveness multiplier
 * @returns The effectiveness multiplier after applying one resistance step
 */
export function applyResistStep(currentEffectiveness: number): number {
  if (currentEffectiveness >= 2.0) return 1.0
  if (currentEffectiveness >= 1.5) return 1.0
  if (currentEffectiveness >= 1.0) return 0.5
  if (currentEffectiveness >= 0.5) return 0.25
  return currentEffectiveness // Already at floor or immune
}

/**
 * Check if a move range qualifies as an area-of-effect for Lean In.
 * PTU p.103: "Burst, Blast, Cone, or Line"
 */
export function isAoERange(moveRange: string): boolean {
  const lower = moveRange.toLowerCase().trim()
  return lower.startsWith('burst') ||
    lower.startsWith('blast') ||
    lower.startsWith('cone') ||
    lower.startsWith('line')
}

