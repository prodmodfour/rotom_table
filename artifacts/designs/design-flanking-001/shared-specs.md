# Shared Specifications

## Core Concepts

### Adjacency (PTU p.232)

PTU uses 8-directional adjacency: a cell is adjacent to all 8 neighbors (cardinal + diagonal). Two combatants are adjacent when any cell occupied by one is an 8-neighbor of any cell occupied by the other.

For 1x1 tokens, the 8 adjacent cells of position `(x, y)` are:

```
(x-1, y-1) (x, y-1) (x+1, y-1)
(x-1, y  )  [TOKEN]  (x+1, y  )
(x-1, y+1) (x, y+1) (x+1, y+1)
```

### Flanking Definition (PTU p.232)

A combatant is **Flanked** when a sufficient number of foes are:
1. Adjacent to the target
2. **Not adjacent to each other**

The required number of non-adjacent foes depends on the target's size:

| Target Size | PTU Size Category | Token Footprint | Required Foes |
|-------------|-------------------|-----------------|---------------|
| Small | Small/Medium | 1x1 | 2 |
| Medium | Small/Medium | 1x1 | 2 |
| Large | Large | 2x2 | 3 |
| Huge | Huge | 3x3 | 4 |
| Gigantic | Gigantic | 4x4 | 5 |

### Non-Adjacency Rule

Two flankers are valid only if they are **not adjacent to each other**. This prevents two enemies standing side-by-side from flanking a target. The flankers must be on "opposite sides" -- positioned such that no single 8-neighbor path connects them without passing through or adjacent to the target.

### Multi-Tile Attacker Counting (PTU p.232)

> "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."

A single Large (2x2) attacker adjacent to a target may count as 1, 2, 3, or 4 "foes" depending on how many of its cells are adjacent to the target.

**Critical rule**: "A single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."

### Flanking Penalty

When Flanked, the target takes **-2 to all Evasion values** (Physical, Special, Speed). This makes them easier to hit with any attack.

---

## Data Types

### `app/types/combat.ts` (extended)

```typescript
/**
 * Size category for flanking requirement lookup.
 * Maps to PTU size categories (p.232).
 */
export type FlankingSize = 'small' | 'medium' | 'large' | 'huge' | 'gigantic'

/**
 * Result of flanking detection for a single combatant.
 */
export interface FlankingStatus {
  /** Whether this combatant is currently flanked */
  isFlanked: boolean
  /** IDs of the combatants that are flanking this target */
  flankerIds: string[]
  /** Number of effective flanking foes (includes multi-tile counting) */
  effectiveFoeCount: number
  /** Number required to flank (based on target size) */
  requiredFoes: number
}

/**
 * Map of combatant ID -> flanking status for the entire encounter.
 * Recomputed whenever token positions change.
 */
export type FlankingMap = Record<string, FlankingStatus>
```

### Flanking Size Mapping

```typescript
/**
 * Map token size (footprint) to the number of non-adjacent foes required to flank.
 *
 * PTU p.232:
 * - Small/Medium (1x1): 2 foes
 * - Large (2x2): 3 foes
 * - Huge (3x3): 4 foes
 * - Gigantic (4x4): 5 foes
 */
export const FLANKING_FOES_REQUIRED: Record<number, number> = {
  1: 2,  // Small/Medium
  2: 3,  // Large
  3: 4,  // Huge
  4: 5,  // Gigantic
}

/**
 * Flanking evasion penalty per PTU p.232.
 * Applied to all evasion values (Physical, Special, Speed).
 */
export const FLANKING_EVASION_PENALTY = 2
```

---

## Data Flow Diagram

```
TOKEN POSITION CHANGES (move, add, remove)
       |
       v
  useFlankingDetection.computeFlankingMap()
       |
       +---> For each combatant:
       |        1. Get all adjacent enemy combatants
       |        2. Filter to non-adjacent pairs (flankers must not be adjacent to each other)
       |        3. Count effective foes (multi-tile counting for P1)
       |        4. Compare against required foes for target size
       |        5. Build FlankingStatus
       |
       v
  FlankingMap (Record<combatantId, FlankingStatus>)
       |
       +---> VTT Rendering: highlight flanked tokens
       |
       +---> Accuracy Calculation: -2 evasion penalty for flanked targets
       |
       +---> CombatantCard: "Flanked" badge display
       |
       +---> WebSocket: broadcast flanking state changes
```

---

## Adjacency Computation for Multi-Tile Tokens

### Getting Adjacent Cells for a Multi-Tile Target

For a token at position `(x, y)` with size `S`, the occupied cells are:
```
{ (x+dx, y+dy) | 0 <= dx < S, 0 <= dy < S }
```

The adjacent cells (border ring) around a multi-tile token are all cells that:
1. Are within 1 cell of any occupied cell (8-directional)
2. Are NOT themselves occupied by the target

```typescript
function getAdjacentCells(position: GridPosition, size: number): GridPosition[] {
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
      // Check all 8 neighbors of this occupied cell
      for (const [nx, ny] of [
        [cx-1,cy-1], [cx,cy-1], [cx+1,cy-1],
        [cx-1,cy],              [cx+1,cy],
        [cx-1,cy+1], [cx,cy+1], [cx+1,cy+1]
      ]) {
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
```

### Checking Adjacency Between Two Combatants

Two combatants are adjacent if any cell of one is an 8-neighbor of any cell of the other:

```typescript
function areAdjacent(
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
```

### Counting Adjacent Cells for Multi-Tile Attacker (P1)

When a multi-tile attacker is adjacent to a target, count how many of the attacker's cells are adjacent to the target's cells:

```typescript
function countAdjacentCells(
  attackerPos: GridPosition, attackerSize: number,
  targetPos: GridPosition, targetSize: number
): number {
  const targetCells = new Set<string>()
  for (let dx = 0; dx < targetSize; dx++) {
    for (let dy = 0; dy < targetSize; dy++) {
      targetCells.add(`${targetPos.x + dx},${targetPos.y + dy}`)
    }
  }

  let count = 0
  for (let dx = 0; dx < attackerSize; dx++) {
    for (let dy = 0; dy < attackerSize; dy++) {
      const ax = attackerPos.x + dx
      const ay = attackerPos.y + dy
      // Check if this attacker cell is adjacent to any target cell
      for (const [nx, ny] of [
        [ax-1,ay-1], [ax,ay-1], [ax+1,ay-1],
        [ax-1,ay],              [ax+1,ay],
        [ax-1,ay+1], [ax,ay+1], [ax+1,ay+1]
      ]) {
        if (targetCells.has(`${nx},${ny}`)) {
          count++
          break // This attacker cell counts as 1
        }
      }
    }
  }

  return count
}
```

---

## Integration Points

### Existing Code That Needs Flanking Awareness

| File | Integration | Tier |
|------|------------|------|
| `app/composables/useMoveCalculation.ts` | `getAccuracyThreshold()` needs flanking penalty | P0/P2 |
| `app/composables/useGridRendering.ts` | Render flanking highlights on VTT | P0 |
| `app/composables/useCanvasDrawing.ts` | Draw flanking indicator visuals | P0 |
| `app/components/vtt/VTTToken.vue` | Flanked state visual indicator | P0 |
| `app/components/encounter/CombatantCard.vue` | "Flanked" badge | P2 |
| `app/stores/encounter.ts` | Flanking state in encounter data | P2 |
| `app/server/api/encounters/[id]/calculate-damage.post.ts` | Server-side flanking penalty | P2 |
| `app/utils/evasionCalculation.ts` | Flanking penalty in evasion computation | P2 |

### Side-Based Hostility

Flanking uses `isEnemySide()` from `app/utils/combatSides.ts` to determine foes:
- `players` and `allies` are friendly -- cannot flank each other
- `enemies` is hostile to both `players` and `allies`
- Same side is never hostile

This is the same hostility model used by `getEnemyOccupiedCells()` in `useGridMovement.ts`.

---

## Edge Cases & Design Decisions

### 1. Flanking is computed client-side (P0/P1)

Flanking detection is a pure function of token positions and combat sides. It does not require server state. P0 computes it client-side in the VTT composable. P2 adds server-side computation for the accuracy endpoint.

### 2. Self-flanking prevention

A single combatant can never flank by itself, even if it occupies multiple adjacent squares. The minimum is always 2 distinct combatants. This is enforced by checking `flankerSet.size >= 2` after counting.

### 3. Fainted/Dead combatants do not flank

Fainted or Dead combatants cannot contribute to flanking. The detection function filters out combatants with HP <= 0 or the 'Dead' status condition.

### 4. Flanking is symmetric by side, not by identity

If Pokemon A (enemies) and Pokemon B (enemies) flank Player C, both A and B benefit from C's reduced evasion. The penalty applies to the Flanked target, not to specific flankers.

### 5. Abilities that prevent flanking

Some PTU abilities (e.g., Flutter) and features (e.g., Whirlwind Strikes, Quick Gymnastics) grant immunity to flanking. P0 does not implement these -- the GM can manually override by removing the Flanked status. P1/P2 may add an ability check if these are commonly used.

### 6. Adjacency is 8-directional (cardinal + diagonal)

PTU does not distinguish between cardinal and diagonal adjacency for flanking purposes. A foe on a diagonal is adjacent just like a foe on a cardinal direction. This is consistent with PTU's general 8-directional adjacency model.

### 7. Grid boundary handling

Cells outside the grid boundary are not valid positions. Flanking detection only considers combatants with valid grid positions.

---

## Files Changed Summary

### P0 (Core Flanking Detection)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/flankingGeometry.ts` | Pure geometry: adjacency, non-adjacency checks |
| **NEW** | `app/composables/useFlankingDetection.ts` | Flanking detection composable with reactive FlankingMap |
| **EDIT** | `app/types/combat.ts` | Add `FlankingStatus`, `FlankingMap`, flanking constants |
| **EDIT** | `app/composables/useGridRendering.ts` | Render flanking highlights |
| **EDIT** | `app/composables/useCanvasDrawing.ts` | Draw flanking indicator visuals |
| **EDIT** | `app/composables/useMoveCalculation.ts` | Apply -2 evasion penalty for flanked targets |

### P1 (Multi-Tile & Advanced)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/flankingGeometry.ts` | Multi-tile adjacent cell counting, multi-tile target border ring |
| **EDIT** | `app/composables/useFlankingDetection.ts` | Multi-tile flanking logic, 3+ attacker handling |

### P2 (Automation)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/composables/useFlankingDetection.ts` | Auto-detect on position change watchers |
| **EDIT** | `app/components/encounter/CombatantCard.vue` | "Flanked" status badge |
| **EDIT** | `app/stores/encounter.ts` | Flanking state getter |
| **EDIT** | `app/server/api/encounters/[id]/calculate-damage.post.ts` | Server-side flanking penalty |
| **EDIT** | `app/utils/evasionCalculation.ts` | Flanking penalty integration |
