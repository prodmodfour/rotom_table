/**
 * Reactive composable for detecting flanking status across all combatants.
 *
 * Computes a FlankingMap indicating which combatants are currently flanked,
 * recomputing whenever combatant positions or sides change.
 *
 * PTU p.232: A combatant is Flanked when sufficient foes are adjacent
 * but NOT adjacent to each other. Flanked targets take -2 to all evasion.
 *
 * Client-side only -- no server involvement for P0.
 */

import type { Combatant, CombatSide } from '~/types'
import type { FlankingMap, FlankingStatus } from '~/types/combat'
import { checkFlanking, FLANKING_EVASION_PENALTY } from '~/utils/flankingGeometry'
import { isEnemySide } from '~/utils/combatSides'

/**
 * Internal representation of a combatant for flanking computation.
 * Filtered to only alive, positioned combatants.
 */
interface FlankingCombatant {
  id: string
  position: { x: number; y: number }
  size: number
  side: CombatSide
}

/**
 * Composable for detecting flanking status across all combatants.
 *
 * Accepts the full combatant list (reactive) and computes a FlankingMap
 * indicating which combatants are currently flanked.
 *
 * Usage:
 *   const { flankingMap, isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatants)
 */
export function useFlankingDetection(combatants: Ref<Combatant[]>) {
  /**
   * Extract position data from combatants, filtering to alive and positioned.
   */
  const positionedCombatants = computed((): FlankingCombatant[] => {
    return combatants.value
      .filter(c => c.position != null)
      .filter(c => {
        // Exclude fainted/dead combatants -- they cannot flank or be flanked
        const hp = c.entity.currentHp ?? 0
        const isDead = (c.entity.statusConditions ?? []).includes('Dead')
        return hp > 0 && !isDead
      })
      .map(c => ({
        id: c.id,
        position: c.position!,
        size: c.tokenSize || 1,
        side: c.side,
      }))
  })

  /**
   * Compute the flanking map for all positioned, alive combatants.
   *
   * For each combatant, determine if it is flanked by checking
   * all enemy combatants adjacent to it for the non-adjacency condition.
   */
  const flankingMap = computed((): FlankingMap => {
    const map: FlankingMap = {}
    const allCombatants = positionedCombatants.value

    for (const target of allCombatants) {
      // Get all enemy combatants (foes relative to this target)
      const foes = allCombatants
        .filter(c => c.id !== target.id)
        .filter(c => isEnemySide(target.side, c.side))
        .map(c => ({
          id: c.id,
          position: c.position,
          size: c.size,
        }))

      const result = checkFlanking(target.position, target.size, foes)

      map[target.id] = {
        isFlanked: result.isFlanked,
        flankerIds: result.flankerIds,
        effectiveFoeCount: result.effectiveFoeCount,
        requiredFoes: result.requiredFoes,
      }
    }

    return map
  })

  /**
   * Check if a specific combatant is currently flanked.
   */
  const isTargetFlanked = (combatantId: string): boolean => {
    return flankingMap.value[combatantId]?.isFlanked ?? false
  }

  /**
   * Get the flanking status for a specific combatant.
   */
  const getFlankingStatus = (combatantId: string): FlankingStatus | null => {
    return flankingMap.value[combatantId] ?? null
  }

  /**
   * Get the evasion penalty for a flanked target (0 if not flanked).
   * PTU p.232: -2 to Physical, Special, and Speed evasion.
   */
  const getFlankingPenalty = (combatantId: string): number => {
    return isTargetFlanked(combatantId) ? FLANKING_EVASION_PENALTY : 0
  }

  return {
    flankingMap,
    isTargetFlanked,
    getFlankingStatus,
    getFlankingPenalty,
  }
}
