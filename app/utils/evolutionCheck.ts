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
  /** P2: Pokemon's gender for gender-specific evolution checks */
  gender?: string | null
  /** P2: Move names the Pokemon currently knows (for move-specific evolution checks) */
  currentMoves?: string[]
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
  /** Set when evolution is blocked by a prevention item (Everstone, Eviolite) */
  preventedByItem?: string
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

  // Everstone/Eviolite prevention — blocks ALL evolution paths
  const preventionItems = ['Everstone', 'Eviolite']
  const preventionMatch = preventionItems.find(
    item => heldItem?.toLowerCase() === item.toLowerCase()
  )
  if (preventionMatch) {
    return {
      available: [],
      ineligible: evolutionTriggers.map(t => ({
        toSpecies: t.toSpecies,
        trigger: t,
        reason: `Pokemon is holding an ${preventionMatch} (evolution prevented)`
      })),
      preventedByItem: preventionMatch
    }
  }

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

    // P2: Check gender requirement
    if (trigger.requiredGender) {
      const pokemonGender = input.gender || null
      if (!pokemonGender || pokemonGender.toLowerCase() !== trigger.requiredGender.toLowerCase()) {
        reasons.push(`Requires ${trigger.requiredGender} gender`)
      }
    }

    // P2: Check move requirement
    if (trigger.requiredMove) {
      const knownMoves = (input.currentMoves || []).map(m => m.toLowerCase())
      if (!knownMoves.includes(trigger.requiredMove.toLowerCase())) {
        reasons.push(`Requires knowing ${trigger.requiredMove}`)
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
// EVOLUTION MOVE LEARNING (R033)
// ============================================

export interface LearnsetEntry {
  level: number
  move: string
}

export interface EvolutionMoveResult {
  /** Moves available to learn immediately upon evolution */
  availableMoves: Array<{
    name: string
    level: number
  }>
  /** Current move count */
  currentMoveCount: number
  /** Maximum moves allowed (PTU: 6) */
  maxMoves: number
  /** Slots available for new moves */
  slotsAvailable: number
}

/**
 * Get moves that become available upon evolution.
 *
 * PTU p.202: "When Pokemon Evolve, they can immediately learn any Moves
 * that their new form learns at a Level lower than their minimum Level
 * for Evolution but that their previous form could not learn."
 *
 * Level-based evolutions: use strictly less than (entry.level < evolutionMinLevel)
 * per PTU wording "at a Level lower than their minimum Level."
 *
 * decree-036: For stone evolutions (no minimum level / evolutionMinLevel is null),
 * use currentLevel as the upper bound with <= comparison.
 *
 * Algorithm:
 * 1. For level-based evolutions: include moves where entry.level < evolutionMinLevel
 * 2. For stone evolutions (decree-036): include moves where entry.level <= currentLevel
 * 3. Exclude moves that appear anywhere in the old-form learnset
 * 4. Exclude moves the Pokemon already knows
 *
 * Pure function — no DB access.
 */
export function getEvolutionMoves(input: {
  oldLearnset: LearnsetEntry[]
  newLearnset: LearnsetEntry[]
  evolutionMinLevel: number | null
  currentLevel: number
  currentMoves: string[]
}): EvolutionMoveResult {
  const { oldLearnset, newLearnset, evolutionMinLevel, currentLevel, currentMoves } = input

  // All move names from old species' learnset (any level)
  const oldMoveNames = new Set(
    oldLearnset.map(entry => entry.move.toLowerCase())
  )

  // Current moves the Pokemon knows (case-insensitive)
  const knownMoves = new Set(
    currentMoves.map(name => name.toLowerCase())
  )

  // Filter new learnset based on evolution type:
  // Level-based: strictly less than evolutionMinLevel (PTU: "at a Level lower than")
  // Stone/item (decree-036): at or below currentLevel
  const availableMoves = newLearnset
    .filter(entry => {
      const meetsLevelCriteria = evolutionMinLevel !== null
        ? entry.level < evolutionMinLevel
        : entry.level <= currentLevel
      if (!meetsLevelCriteria) return false
      if (oldMoveNames.has(entry.move.toLowerCase())) return false
      if (knownMoves.has(entry.move.toLowerCase())) return false
      return true
    })
    .map(entry => ({
      name: entry.move,
      level: entry.level
    }))

  // Deduplicate by name (a move might appear at multiple levels)
  const seen = new Set<string>()
  const deduped = availableMoves.filter(move => {
    const key = move.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const currentMoveCount = currentMoves.length
  const maxMoves = 6

  return {
    availableMoves: deduped,
    currentMoveCount,
    maxMoves,
    slotsAvailable: Math.max(0, maxMoves - currentMoveCount)
  }
}

// ============================================
// EVOLUTION MOVE LIST BUILDER
// ============================================

export interface EvolutionMoveDetail {
  name: string
  type: string
  damageClass: string
  frequency: string
  ac: number | null
  damageBase: number | null
  range: string
  effect: string
}

/**
 * Build the selected move list by combining kept current moves with added evolution moves.
 * Shared between EvolutionConfirmModal and EvolutionMoveStep to avoid duplication.
 *
 * Pure function — no reactivity, no side effects.
 */
export function buildSelectedMoveList(input: {
  currentMoves: EvolutionMoveDetail[]
  removedMoves: string[]
  addedMoves: Array<{ name: string; detail: EvolutionMoveDetail | null }>
  evolutionMoveDetails: Map<string, EvolutionMoveDetail>
}): EvolutionMoveDetail[] {
  const { currentMoves, removedMoves, addedMoves, evolutionMoveDetails } = input

  const removedSet = new Set(removedMoves.map(n => n.toLowerCase()))
  const kept = currentMoves.filter(m => !removedSet.has(m.name.toLowerCase()))
  const added: EvolutionMoveDetail[] = addedMoves.map(m => {
    const detail = m.detail || evolutionMoveDetails.get(m.name)
    return {
      name: m.name,
      type: detail?.type || 'Normal',
      damageClass: detail?.damageClass || 'Status',
      frequency: detail?.frequency || 'At-Will',
      ac: detail?.ac ?? null,
      damageBase: detail?.damageBase ?? null,
      range: detail?.range || 'Melee',
      effect: detail?.effect || ''
    }
  })

  return [...kept, ...added]
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
