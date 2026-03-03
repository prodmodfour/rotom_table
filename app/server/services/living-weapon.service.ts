/**
 * Living Weapon Service
 *
 * Pure functions for managing wield state within an encounter.
 * No DB access -- API endpoints handle persistence.
 *
 * PTU pp.305-306: Living Weapon capability (Honedge line).
 * Engage = Standard Action, Disengage = Swift Action.
 */

import type { Combatant } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
import type { Pokemon, HumanCharacter, SkillRank } from '~/types/character'
import { getLivingWeaponConfig } from '~/utils/combatantCapabilities'
import { LIVING_WEAPON_CONFIG } from '~/constants/livingWeapon'
import { areAdjacent } from '~/utils/adjacency'

// ============================================================
// Skill Rank Validation
// ============================================================

const SKILL_RANK_ORDER: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
]

/**
 * Check if a skill rank meets or exceeds a required rank.
 */
export function meetsSkillRequirement(
  actualRank: SkillRank | undefined,
  requiredRank: SkillRank
): boolean {
  const actual = actualRank ?? 'Untrained'
  return SKILL_RANK_ORDER.indexOf(actual) >= SKILL_RANK_ORDER.indexOf(requiredRank)
}

// ============================================================
// Query Functions
// ============================================================

/**
 * Find the wield relationship for a given combatant (as wielder or weapon).
 * Returns null if the combatant is not part of any wield relationship.
 */
export function findWieldRelationship(
  wieldRelationships: WieldRelationship[],
  combatantId: string
): WieldRelationship | null {
  return wieldRelationships.find(
    r => r.wielderId === combatantId || r.weaponId === combatantId
  ) ?? null
}

/**
 * Check if a combatant is currently being wielded as a Living Weapon.
 */
export function isWielded(combatant: Combatant): boolean {
  return combatant.wieldedByTrainerId !== undefined
}

/**
 * Check if a combatant is currently wielding a Living Weapon.
 */
export function isWielding(combatant: Combatant): boolean {
  return combatant.wieldingWeaponId !== undefined
}

/**
 * Get the wielded Pokemon combatant for a trainer.
 * Returns null if the trainer is not wielding.
 */
export function getWieldedWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  wielderId: string
): Combatant | null {
  const relationship = wieldRelationships.find(
    r => r.wielderId === wielderId
  )
  if (!relationship) return null

  return combatants.find(c => c.id === relationship.weaponId) ?? null
}

/**
 * Get the wielder trainer combatant for a weapon Pokemon.
 * Returns null if the Pokemon is not wielded.
 */
export function getWielder(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  weaponId: string
): Combatant | null {
  const relationship = wieldRelationships.find(
    r => r.weaponId === weaponId
  )
  if (!relationship) return null

  return combatants.find(c => c.id === relationship.wielderId) ?? null
}

// ============================================================
// Engage / Disengage
// ============================================================

/** Result of an engage operation */
export interface EngageResult {
  combatants: Combatant[]
  wieldRelationships: WieldRelationship[]
  wieldRelationship: WieldRelationship
  wielder: Combatant
  weapon: Combatant
}

/** Result of a disengage operation */
export interface DisengageResult {
  combatants: Combatant[]
  wieldRelationships: WieldRelationship[]
  removedRelationship: WieldRelationship
  wielder: Combatant
  weapon: Combatant
}

/**
 * Validate and execute a Living Weapon engage action.
 * Returns new combatant array and wield relationships (immutable).
 *
 * Validation rules:
 * 1. wielder must be a human combatant
 * 2. weapon must be a Pokemon combatant
 * 3. Pokemon must have Living Weapon capability
 * 4. Must be on the same side
 * 5. Trainer must not already be wielding
 * 6. Pokemon must not already be wielded
 * 7. Must be adjacent (if positions are set)
 *
 * NOTE: Per decree-043, Combat Skill Rank gates weapon MOVE ACCESS only,
 * not engagement. Any trainer can engage a Living Weapon regardless of
 * Combat rank. Rank gating deferred to P1 (move injection).
 */
export function engageLivingWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  wielderId: string,
  weaponId: string
): EngageResult {
  // Find combatants
  const wielder = combatants.find(c => c.id === wielderId)
  if (!wielder) {
    throw createError({ statusCode: 404, message: 'Wielder combatant not found' })
  }

  const weapon = combatants.find(c => c.id === weaponId)
  if (!weapon) {
    throw createError({ statusCode: 404, message: 'Weapon combatant not found' })
  }

  // Rule 1: wielder must be human
  if (wielder.type !== 'human') {
    throw createError({ statusCode: 400, message: 'Only trainers (human combatants) can wield Living Weapons' })
  }

  // Rule 2: weapon must be Pokemon
  if (weapon.type !== 'pokemon') {
    throw createError({ statusCode: 400, message: 'Only Pokemon can be wielded as Living Weapons' })
  }

  // Rule 3: Pokemon must have Living Weapon capability
  const pokemon = weapon.entity as Pokemon
  const weaponConfig = getLivingWeaponConfig(pokemon)
  if (!weaponConfig) {
    throw createError({ statusCode: 400, message: `${pokemon.species} does not have the Living Weapon capability` })
  }

  // Rule 4: same side
  if (wielder.side !== weapon.side) {
    throw createError({ statusCode: 400, message: 'Wielder and weapon must be on the same side' })
  }

  // Rule 5: trainer must not already be wielding
  if (wielder.wieldingWeaponId !== undefined) {
    throw createError({ statusCode: 400, message: 'Trainer is already wielding a Living Weapon' })
  }

  // Rule 6: Pokemon must not already be wielded
  if (weapon.wieldedByTrainerId !== undefined) {
    throw createError({ statusCode: 400, message: 'This Pokemon is already being wielded by another trainer' })
  }

  // Rule 7: adjacency check (only if both have positions)
  if (wielder.position && weapon.position) {
    const adjacent = areAdjacent(
      wielder.position, wielder.tokenSize || 1,
      weapon.position, weapon.tokenSize || 1
    )
    if (!adjacent) {
      throw createError({ statusCode: 400, message: 'Wielder and weapon must be adjacent to engage' })
    }
  }

  // Determine species for the relationship
  const weaponSpecies = weaponConfig.species as WieldRelationship['weaponSpecies']

  // Check if the Pokemon is fainted
  const isFainted = pokemon.currentHp <= 0 ||
    pokemon.statusConditions?.includes('Fainted') === true

  const relationship: WieldRelationship = {
    wielderId,
    weaponId,
    weaponSpecies,
    isFainted,
  }

  // Update combatant flags (immutable)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId) {
      return { ...c, wieldingWeaponId: weaponId }
    }
    if (c.id === weaponId) {
      return { ...c, wieldedByTrainerId: wielderId }
    }
    return c
  })

  const updatedWielder = updatedCombatants.find(c => c.id === wielderId)!
  const updatedWeapon = updatedCombatants.find(c => c.id === weaponId)!

  return {
    combatants: updatedCombatants,
    wieldRelationships: [...wieldRelationships, relationship],
    wieldRelationship: relationship,
    wielder: updatedWielder,
    weapon: updatedWeapon,
  }
}

/**
 * Disengage a Living Weapon wield relationship.
 * Can be called from either the wielder or weapon side.
 * Returns new combatant array and wield relationships (immutable).
 */
export function disengageLivingWeapon(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  combatantId: string
): DisengageResult {
  const relationship = findWieldRelationship(wieldRelationships, combatantId)
  if (!relationship) {
    throw createError({
      statusCode: 400,
      message: 'Combatant is not part of any wield relationship'
    })
  }

  const { wielderId, weaponId } = relationship

  // Clear combatant flags (immutable)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId) {
      const { wieldingWeaponId, ...rest } = c
      return rest as Combatant
    }
    if (c.id === weaponId) {
      const { wieldedByTrainerId, ...rest } = c
      return rest as Combatant
    }
    return c
  })

  const updatedWielder = updatedCombatants.find(c => c.id === wielderId)!
  const updatedWeapon = updatedCombatants.find(c => c.id === weaponId)!

  return {
    combatants: updatedCombatants,
    wieldRelationships: wieldRelationships.filter(
      r => r.wielderId !== relationship.wielderId
    ),
    removedRelationship: relationship,
    wielder: updatedWielder,
    weapon: updatedWeapon,
  }
}

// ============================================================
// State Updates
// ============================================================

/**
 * Update wield relationship fainted state when a Living Weapon Pokemon faints.
 * PTU p.305: fainted Living Weapons are still usable as inanimate equipment.
 * Returns updated wield relationships array (immutable).
 */
export function updateWieldFaintedState(
  wieldRelationships: WieldRelationship[],
  weaponCombatantId: string,
  isFainted: boolean
): WieldRelationship[] {
  return wieldRelationships.map(r => {
    if (r.weaponId === weaponCombatantId) {
      return { ...r, isFainted }
    }
    return r
  })
}

/**
 * Clear wield relationships when a combatant is removed from the encounter.
 * Auto-disengages without action cost.
 * Returns updated combatant array and wield relationships (immutable).
 */
export function clearWieldOnRemoval(
  combatants: Combatant[],
  wieldRelationships: WieldRelationship[],
  removedId: string
): { combatants: Combatant[]; wieldRelationships: WieldRelationship[] } {
  const relationship = findWieldRelationship(wieldRelationships, removedId)
  if (!relationship) {
    return { combatants, wieldRelationships }
  }

  const { wielderId, weaponId } = relationship

  // Clear flags on the remaining combatant (the removed one is already gone)
  const updatedCombatants = combatants.map(c => {
    if (c.id === wielderId && wielderId !== removedId) {
      const { wieldingWeaponId, ...rest } = c
      return rest as Combatant
    }
    if (c.id === weaponId && weaponId !== removedId) {
      const { wieldedByTrainerId, ...rest } = c
      return rest as Combatant
    }
    return c
  })

  const updatedRelationships = wieldRelationships.filter(
    r => r.wielderId !== relationship.wielderId
  )

  return { combatants: updatedCombatants, wieldRelationships: updatedRelationships }
}
