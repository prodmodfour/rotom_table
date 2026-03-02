/**
 * Reactive composable for detecting flanking status across all combatants.
 *
 * Computes a FlankingMap indicating which combatants are currently flanked,
 * recomputing whenever combatant positions or sides change.
 *
 * PTU p.232: A combatant is Flanked when sufficient foes are adjacent
 * but NOT adjacent to each other. Flanked targets take -2 to all evasion.
 *
 * P1: Uses checkFlankingMultiTile for full multi-tile token support.
 * Handles Large (2x2, 3 foes), Huge (3x3, 4 foes), Gigantic (4x4, 5 foes).
 * Multi-tile attackers count as multiple foes per adjacent cells (PTU p.232).
 *
 * P2: Watcher detects flanking state transitions and invokes callbacks
 * for WebSocket broadcasting and VTT re-rendering.
 *
 * Client-side only -- no server involvement for P0/P1.
 * Server-side flanking for accuracy is in calculate-damage.post.ts (P2).
 */

import type { Combatant, CombatSide } from '~/types'
import type { FlankingMap, FlankingStatus } from '~/types/combat'
import { checkFlankingMultiTile, FLANKING_EVASION_PENALTY } from '~/utils/flankingGeometry'
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
 * Options for the flanking detection composable.
 *
 * onFlankingChanged: Called when a combatant's flanked status transitions
 *   (flanked -> unflanked or unflanked -> flanked). Used for WebSocket broadcast.
 * render: Called after flanking state changes to trigger VTT re-render.
 */
interface FlankingDetectionOptions {
  onFlankingChanged?: (combatantId: string, isFlanked: boolean, flankerIds: string[]) => void
  render?: () => void
}

/**
 * Composable for detecting flanking status across all combatants.
 *
 * Accepts the full combatant list (reactive) and computes a FlankingMap
 * indicating which combatants are currently flanked.
 *
 * P2: Accepts optional callbacks for transition detection and re-rendering.
 *
 * Usage:
 *   const { flankingMap, isTargetFlanked, getFlankingPenalty } = useFlankingDetection(combatants)
 *   const { flankingMap } = useFlankingDetection(combatants, { onFlankingChanged, render })
 */
export function useFlankingDetection(
  combatants: Ref<Combatant[]>,
  options?: FlankingDetectionOptions
) {
  /**
   * Extract position data from combatants, filtering to alive and positioned.
   */
  const positionedCombatants = computed((): FlankingCombatant[] => {
    return combatants.value
      .filter(c => c.position != null)
      .filter(c => {
        // Exclude fainted/dead combatants -- they cannot flank or be flanked
        const hp = c.entity.currentHp ?? 0
        const conditions = c.entity.statusConditions ?? []
        const isDead = conditions.includes('Dead')
        const isFainted = conditions.includes('Fainted')
        return hp > 0 && !isDead && !isFainted
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
   *
   * Uses checkFlankingMultiTile which handles all token sizes including
   * multi-tile targets (Large/Huge/Gigantic) and multi-tile attackers
   * that count as multiple foes per adjacent cells (PTU p.232).
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

      const result = checkFlankingMultiTile(target.position, target.size, foes)

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

  // P2: Track previous flanking state for change detection
  const previousFlankedSet = ref<Set<string>>(new Set())

  watch(flankingMap, (newMap) => {
    const newFlankedSet = new Set<string>()

    for (const [id, status] of Object.entries(newMap)) {
      if (status.isFlanked) {
        newFlankedSet.add(id)
      }
    }

    // Detect transitions (newly flanked or no longer flanked)
    for (const id of newFlankedSet) {
      if (!previousFlankedSet.value.has(id)) {
        options?.onFlankingChanged?.(id, true, newMap[id].flankerIds)
      }
    }
    for (const id of previousFlankedSet.value) {
      if (!newFlankedSet.has(id)) {
        options?.onFlankingChanged?.(id, false, [])
      }
    }

    previousFlankedSet.value = newFlankedSet

    // Trigger VTT re-render to update visual indicators
    options?.render?.()
  }, { deep: true })

  return {
    flankingMap,
    isTargetFlanked,
    getFlankingStatus,
    getFlankingPenalty,
  }
}
