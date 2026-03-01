# P0 Specification: Core Flanking Detection (1x1 Tokens)

P0 implements flanking detection for 1x1 (Small/Medium) tokens only. Multi-tile tokens are deferred to P1 (feature-013 dependency). P0 covers the most common case in gameplay -- trainers and most Pokemon are 1x1.

---

## A. Flanking Geometry Utility

### New File: `app/utils/flankingGeometry.ts`

Pure geometry functions with no framework dependencies. Fully unit-testable.

```typescript
import type { GridPosition } from '~/types'

/**
 * The 8 directional offsets for adjacency (cardinal + diagonal).
 * PTU treats diagonal adjacency identically to cardinal for flanking.
 */
export const NEIGHBOR_OFFSETS: ReadonlyArray<[number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

/**
 * Map token footprint size to the number of non-adjacent foes required to flank.
 * PTU p.232: Small/Medium=2, Large=3, Huge=4, Gigantic=5.
 */
export const FLANKING_FOES_REQUIRED: Record<number, number> = {
  1: 2,  // Small/Medium (1x1)
  2: 3,  // Large (2x2)
  3: 4,  // Huge (3x3)
  4: 5,  // Gigantic (4x4)
}

/**
 * Flanking evasion penalty per PTU p.232.
 * Applied to Physical, Special, and Speed evasion.
 */
export const FLANKING_EVASION_PENALTY = 2

/**
 * Get all cells occupied by a token.
 *
 * @param position - Top-left anchor position
 * @param size - Token footprint (1=1x1, 2=2x2, etc.)
 * @returns Array of all occupied grid positions
 */
export function getOccupiedCells(position: GridPosition, size: number): GridPosition[] {
  const cells: GridPosition[] = []
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: position.x + dx, y: position.y + dy })
    }
  }
  return cells
}

/**
 * Get all cells adjacent to a token (the border ring).
 * Adjacent cells are within 1 step (8-directional) of any occupied cell
 * but NOT occupied by the token itself.
 *
 * @param position - Top-left anchor position
 * @param size - Token footprint
 * @returns Array of unique adjacent grid positions
 */
export function getAdjacentCells(position: GridPosition, size: number): GridPosition[] {
  const occupied = new Set<string>()
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      occupied.add(`${position.x + dx},${position.y + dy}`)
    }
  }

  const adjacent: GridPosition[] = []
  const seen = new Set<string>()

  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const cx = position.x + dx
      const cy = position.y + dy
      for (const [ox, oy] of NEIGHBOR_OFFSETS) {
        const nx = cx + ox
        const ny = cy + oy
        const key = `${nx},${ny}`
        if (!occupied.has(key) && !seen.has(key)) {
          seen.add(key)
          adjacent.push({ x: nx, y: ny })
        }
      }
    }
  }

  return adjacent
}

/**
 * Check if two combatants are adjacent (any cell of one is an 8-neighbor of any cell of the other).
 *
 * For P0 with 1x1 tokens, this simplifies to: |dx| <= 1 && |dy| <= 1 && not same cell.
 *
 * @param posA - Position of combatant A
 * @param sizeA - Token size of combatant A
 * @param posB - Position of combatant B
 * @param sizeB - Token size of combatant B
 * @returns true if adjacent
 */
export function areAdjacent(
  posA: GridPosition, sizeA: number,
  posB: GridPosition, sizeB: number
): boolean {
  for (let dxA = 0; dxA < sizeA; dxA++) {
    for (let dyA = 0; dyA < sizeA; dyA++) {
      for (let dxB = 0; dxB < sizeB; dxB++) {
        for (let dyB = 0; dyB < sizeB; dyB++) {
          const dx = Math.abs((posA.x + dxA) - (posB.x + dxB))
          const dy = Math.abs((posA.y + dyA) - (posB.y + dyB))
          if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
            return true
          }
        }
      }
    }
  }
  return false
}

/**
 * Determine if a target is flanked by a set of foes (P0: 1x1 tokens only).
 *
 * PTU p.232 Flanking Rule:
 * A combatant is Flanked when at least N foes are adjacent to them
 * but NOT adjacent to each other, where N depends on target size.
 *
 * Algorithm (P0, all 1x1):
 * 1. Collect all foes adjacent to the target.
 * 2. Find any pair of foes that are NOT adjacent to each other.
 * 3. If such a pair exists, the target is Flanked (N=2 for 1x1 targets).
 *
 * @param targetPos - Target's grid position
 * @param targetSize - Target's token size (1 for P0)
 * @param foes - Array of { id, position, size } for all enemy combatants
 * @returns FlankingResult with isFlanked flag and flanker IDs
 */
export function checkFlanking(
  targetPos: GridPosition,
  targetSize: number,
  foes: ReadonlyArray<{ id: string; position: GridPosition; size: number }>
): { isFlanked: boolean; flankerIds: string[]; effectiveFoeCount: number; requiredFoes: number } {
  const requiredFoes = FLANKING_FOES_REQUIRED[targetSize] ?? 2

  // Step 1: Find all foes adjacent to the target
  const adjacentFoes = foes.filter(foe =>
    areAdjacent(targetPos, targetSize, foe.position, foe.size)
  )

  if (adjacentFoes.length < requiredFoes) {
    return {
      isFlanked: false,
      flankerIds: [],
      effectiveFoeCount: adjacentFoes.length,
      requiredFoes,
    }
  }

  // Step 2: For 1x1 targets (P0), find any pair of adjacent foes
  // that are NOT adjacent to each other.
  // This is O(n^2) over adjacent foes -- typically 0-8, so negligible.
  const flankerIds: string[] = []

  for (let i = 0; i < adjacentFoes.length; i++) {
    for (let j = i + 1; j < adjacentFoes.length; j++) {
      const foeA = adjacentFoes[i]
      const foeB = adjacentFoes[j]
      if (!areAdjacent(foeA.position, foeA.size, foeB.position, foeB.size)) {
        // Found a non-adjacent pair -> target is Flanked
        // Collect ALL contributing flankers (not just this pair)
        // A flanker contributes if it's not adjacent to at least one other flanker
        // For simplicity in P0, return all adjacent foes as potential flankers
        return {
          isFlanked: true,
          flankerIds: adjacentFoes.map(f => f.id),
          effectiveFoeCount: adjacentFoes.length,
          requiredFoes,
        }
      }
    }
  }

  // All adjacent foes are adjacent to each other -- no flanking
  return {
    isFlanked: false,
    flankerIds: [],
    effectiveFoeCount: adjacentFoes.length,
    requiredFoes,
  }
}
```

---

## B. Flanking Detection Composable

### New File: `app/composables/useFlankingDetection.ts`

Reactive composable that computes flanking state for all combatants in an encounter. Depends on combatant positions, sides, and token sizes.

```typescript
import type { Combatant, GridPosition } from '~/types'
import type { FlankingMap, FlankingStatus } from '~/types/combat'
import { checkFlanking } from '~/utils/flankingGeometry'
import { isEnemySide } from '~/utils/combatSides'

interface FlankingCombatant {
  id: string
  position: GridPosition
  size: number
  side: CombatSide
  isAlive: boolean
}

/**
 * Composable for detecting flanking status across all combatants.
 *
 * Accepts the full combatant list (reactive) and computes a FlankingMap
 * indicating which combatants are currently flanked.
 *
 * Usage:
 *   const { flankingMap, isTargetFlanked } = useFlankingDetection(combatants)
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
        isAlive: true,
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
   */
  const getFlankingPenalty = (combatantId: string): number => {
    return isTargetFlanked(combatantId) ? 2 : 0
  }

  return {
    flankingMap,
    isTargetFlanked,
    getFlankingStatus,
    getFlankingPenalty,
  }
}
```

---

## C. Visual Indicator on VTT

### Modified: `app/composables/useCanvasDrawing.ts`

Add a flanking highlight drawing function. Flanked tokens get a colored border/glow to indicate their flanked state.

```typescript
/**
 * Draw a flanking indicator around a token.
 *
 * Renders a pulsing red-orange border around flanked combatants
 * to provide immediate visual feedback on the VTT grid.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Pixel X of the token's top-left cell
 * @param y - Pixel Y of the token's top-left cell
 * @param cellSize - Size of one grid cell in pixels
 * @param tokenSize - Token footprint (1=1x1, 2=2x2)
 * @param pulse - Animation value 0-1 for pulsing effect
 */
export function drawFlankingIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  tokenSize: number,
  pulse: number
): void {
  const width = cellSize * tokenSize
  const height = cellSize * tokenSize
  const alpha = 0.4 + 0.3 * Math.sin(pulse * Math.PI * 2)

  ctx.save()
  ctx.strokeStyle = `rgba(255, 100, 50, ${alpha})`
  ctx.lineWidth = 3
  ctx.setLineDash([6, 3])

  // Draw dashed border around the token
  ctx.strokeRect(
    x + 1.5,
    y + 1.5,
    width - 3,
    height - 3
  )

  ctx.restore()
}
```

### Modified: `app/composables/useGridRendering.ts`

In the token rendering pass, after drawing the token sprite, check the flanking map and draw the flanking indicator if the combatant is flanked.

```typescript
// In the render loop, after drawing each token:
if (flankingMap.value[combatant.id]?.isFlanked) {
  drawFlankingIndicator(
    ctx,
    tokenX,
    tokenY,
    cellSize,
    combatant.tokenSize || 1,
    animationFrame  // 0-1 cycled by requestAnimationFrame
  )
}
```

### Modified: `app/components/vtt/VTTToken.vue`

Add a CSS-based flanking indicator as a fallback/overlay for the HTML token layer. This provides a consistent visual even when canvas rendering is not in the foreground.

```vue
<!-- Inside VTTToken template, add conditional class -->
<div
  class="vtt-token"
  :class="{
    'vtt-token--flanked': isFlanked,
    // ... existing classes
  }"
>
  <!-- existing content -->
</div>
```

```scss
// In VTTToken styles
.vtt-token--flanked {
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border: 2px dashed rgba(255, 100, 50, 0.7);
    border-radius: $border-radius-sm;
    pointer-events: none;
    animation: flanking-pulse 1.5s ease-in-out infinite;
  }
}

@keyframes flanking-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

---

## D. Flanking Evasion Penalty in Accuracy Calculation

### Modified: `app/composables/useMoveCalculation.ts`

The `getAccuracyThreshold()` function currently accounts for evasion, accuracy stages, and rough terrain penalties. Add the flanking penalty.

**Current signature** (unchanged):
```typescript
const getAccuracyThreshold = (targetId: string): number
```

**Integration approach**: The composable receives the flanking detection composable's `getFlankingPenalty` function via parameter injection or by instantiating `useFlankingDetection` with the allCombatants ref.

```typescript
// In useMoveCalculation, add flanking penalty to threshold:
const getAccuracyThreshold = (targetId: string): number => {
  if (!move.value.ac) return 0

  const evasion = getTargetEvasion(targetId)
  const effectiveEvasion = Math.min(9, evasion)

  // Flanking penalty: -2 to evasion (subtracted from threshold, making it easier to hit)
  const flankingPenalty = getFlankingPenalty(targetId)

  // Rough terrain penalty: +2 to threshold (making it harder to hit)
  const roughPenalty = getRoughTerrainPenalty(targetId)

  // Flanking reduces evasion -> reduces threshold (easier to hit)
  // Rough terrain increases threshold (harder to hit)
  return Math.max(
    1,
    move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty
  )
}
```

**Design decision**: The flanking penalty is applied as an evasion reduction (subtracted from threshold), not as an accuracy bonus. Per PTU p.232: "they take a -2 penalty to their Evasion." This means the target's evasion is reduced, which lowers the accuracy threshold the attacker needs to roll.

**Parameter passing**: `useMoveCalculation` receives a new optional parameter for the flanking penalty getter:

```typescript
export function useMoveCalculation(
  move: Ref<Move>,
  actor: Ref<Combatant>,
  targets: Ref<Combatant[]>,
  allCombatants: Ref<Combatant[]>,
  options?: {
    getFlankingPenalty?: (targetId: string) => number
  }
)
```

When `options.getFlankingPenalty` is provided (VTT encounters with grid positions), it is used. When not provided (non-VTT encounters), flanking penalty is 0.

---

## Summary of File Changes (P0)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/flankingGeometry.ts` | Pure geometry: `getOccupiedCells`, `getAdjacentCells`, `areAdjacent`, `checkFlanking`, constants |
| **NEW** | `app/composables/useFlankingDetection.ts` | Reactive composable: `flankingMap`, `isTargetFlanked`, `getFlankingPenalty` |
| **EDIT** | `app/types/combat.ts` | Add `FlankingStatus`, `FlankingMap`, `FlankingSize` types |
| **EDIT** | `app/composables/useCanvasDrawing.ts` | Add `drawFlankingIndicator()` function |
| **EDIT** | `app/composables/useGridRendering.ts` | Call flanking indicator during token render |
| **EDIT** | `app/components/vtt/VTTToken.vue` | Add `vtt-token--flanked` CSS class with dashed border |
| **EDIT** | `app/composables/useMoveCalculation.ts` | Add flanking penalty to `getAccuracyThreshold()`, accept optional `getFlankingPenalty` param |
