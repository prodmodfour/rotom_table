/**
 * PTU Evolution Eligibility Check
 *
 * Pure functions for determining which evolutions are available
 * for a Pokemon based on its current state and species triggers.
 *
 * No DB access — operates on pre-fetched data only.
 *
 * Reference: PTU Core Chapter 5, p.202
 */

import type { EvolutionTrigger } from '~/types/species'

// ============================================
// TYPES
// ============================================

export interface EvolutionCheckInput {
  currentLevel: number
  heldItem: string | null
  evolutionTriggers: EvolutionTrigger[]
}

export interface EvolutionAvailable {
  toSpecies: string
  trigger: EvolutionTrigger
}

export interface EvolutionIneligible {
  toSpecies: string
  trigger: EvolutionTrigger
  reason: string
}

export interface EvolutionEligibilityResult {
  available: EvolutionAvailable[]
  ineligible: EvolutionIneligible[]
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Check which evolutions are available for a Pokemon.
 * Pure function — does not query DB.
 *
 * Logic per trigger:
 * 1. If minimumLevel is set, check currentLevel >= minimumLevel
 * 2. If requiredItem is set and itemMustBeHeld is true, check heldItem matches
 * 3. If requiredItem is set and itemMustBeHeld is false (stone), mark as available
 *    with a note — the GM confirms stone inventory (P0 does not enforce stone inventory)
 * 4. A trigger is "available" if all level/held-item requirements are met.
 *    Stone-based triggers are listed as available since the GM is the authority
 *    on whether the player has the stone.
 */
export function checkEvolutionEligibility(input: EvolutionCheckInput): EvolutionEligibilityResult {
  const { currentLevel, heldItem, evolutionTriggers } = input
  const available: EvolutionAvailable[] = []
  const ineligible: EvolutionIneligible[] = []

  for (const trigger of evolutionTriggers) {
    const reasons: string[] = []

    // Check level requirement
    if (trigger.minimumLevel !== null && currentLevel < trigger.minimumLevel) {
      reasons.push(`Requires minimum level ${trigger.minimumLevel} (current: ${currentLevel})`)
    }

    // Check held item requirement
    if (trigger.requiredItem !== null && trigger.itemMustBeHeld) {
      if (!heldItem || heldItem.toLowerCase() !== trigger.requiredItem.toLowerCase()) {
        reasons.push(`Requires holding ${trigger.requiredItem}`)
      }
    }

    if (reasons.length === 0) {
      available.push({ toSpecies: trigger.toSpecies, trigger })
    } else {
      ineligible.push({
        toSpecies: trigger.toSpecies,
        trigger,
        reason: reasons.join('; ')
      })
    }
  }

  return { available, ineligible }
}

/**
 * Extract level-only evolution levels from triggers.
 * Used to feed into calculateLevelUps() for the canEvolve flag.
 * Only includes level-based triggers where no item is required.
 */
export function getEvolutionLevels(triggers: EvolutionTrigger[]): number[] {
  return triggers
    .filter(t => t.minimumLevel !== null && t.requiredItem === null)
    .map(t => t.minimumLevel!)
}

// ============================================
// STAT TYPES (shared between client and server)
// ============================================

export interface EvolutionStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

// ============================================
// BASE RELATIONS VALIDATION — re-exported from shared utility
// ============================================

import { validateBaseRelations as _validateBaseRelations } from '~/utils/baseRelations'
import type { Stats } from '~/types/character'

/**
 * Legacy wrapper: accepts EvolutionStats and returns string[] for backward compatibility.
 * New code should use validateBaseRelations from ~/utils/baseRelations directly.
 */
export function validateBaseRelations(
  natureAdjustedBase: EvolutionStats,
  statPoints: EvolutionStats
): string[] {
  const result = _validateBaseRelations(
    natureAdjustedBase as Stats,
    statPoints as Stats
  )
  return result.violations
}
