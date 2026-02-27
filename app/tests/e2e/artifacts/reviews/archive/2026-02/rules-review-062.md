---
review_id: rules-review-062
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-019
domain: vtt-grid
commits_reviewed:
  - 6ff3b0a
files_reviewed:
  - app/composables/useRangeParser.ts
mechanics_verified:
  - size-category-grid-footprints
  - multi-cell-range-measurement
  - chebyshev-distance-for-range
  - self-targeting-multi-cell
  - cardinal-adjacency-multi-cell
  - closest-cell-pair-for-los
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Token Sizes (p.231/lines 400-410)
  - core/07-combat.md#Adjacency Definition (p.231/lines 429-432)
  - core/07-combat.md#Diagonal Movement (p.231/lines 425-428)
  - core/07-combat.md#Flanking for Large+ (p.232/lines 500-506)
reviewed_at: 2026-02-20T16:30:00
---

## Review Scope

Reviewing commit `6ff3b0a` which adds multi-cell token support to the range parser. The fix introduces `TokenFootprint`, `getOccupiedCells()`, `chebyshevDistanceTokens()`, and `closestCellPair()`, and extends `isInRange()` with optional `attackerSize` and `targetSize` parameters.

## PTU Rulebook Reference

### Token Size Categories (Ch. 7, p.231, lines 400-410)

> A combatant's footprint on a grid is determined by their Size. **Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4**, but you may choose to use other shapes for Pokemon that have different body shapes such as serpents. As a rough guideline, create the new shape to be roughly the same number of total squares as the default shape.
> For example, a Steelix (Gigantic) might be 8x2 meters, twisting into different shapes as it moves on the map. An Aerodactyl (Huge) is probably 2x4 due to its wide wingspan.

Size categories and footprints:
| Category | Default Footprint | Notes |
|----------|-------------------|-------|
| Small | 1x1 | |
| Medium | 1x1 | |
| Large | 2x2 | |
| Huge | 3x3 | |
| Gigantic | 4x4 | |

Custom shapes are allowed (serpents, wide wingspan, etc.) but the total square count should match the default.

### Adjacency Definition (Ch. 7, p.231, lines 429-432)

> Two combatants are **Adjacent** to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. **Cardinally Adjacent**, however, does not count diagonal squares.

This is critical for multi-cell tokens: adjacency is based on **any** occupied square touching, not just origin positions.

### Diagonal Movement vs Range (Ch. 7, p.231, lines 425-428)

> Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth.

The alternating 1/2 diagonal cost applies **only to movement** (Shift Actions). PTU does not specify a separate diagonal cost for range measurement. The standard interpretation is that range uses simple Chebyshev distance (diagonal = 1 meter) and only movement uses the alternating rule. This is consistent with how the existing codebase has always measured range (Chebyshev) versus movement (alternating diagonal).

### Flanking for Multi-Cell Tokens (Ch. 7, p.232, lines 500-506)

> Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying.

This confirms PTU treats multi-cell tokens as occupying multiple squares and that adjacency checks consider all occupied squares. While this specific rule is about flanking, it establishes the pattern that multi-cell token interactions use all occupied cells, not just the origin.

### Range Measurement for Multi-Cell Tokens

PTU does not have an explicit section titled "Range Measurement for Multi-Cell Tokens." However, the adjacency definition ("any squares they occupy touch each other") combined with the multi-cell token rules establishes the principle: interactions between multi-cell tokens consider all occupied cells. For range, the natural extension is to measure from the nearest occupied cell of each token. This is the standard convention in grid-based TTRPGs (e.g., D&D 3.5/4e/5e all measure from the nearest cell of multi-cell creatures) and is the only interpretation consistent with PTU's adjacency rule.

## Mechanics Verified

### 1. Size Category Grid Footprints

- **PTU Rule:** Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4 (p.231, lines 400-402).
- **Implementation:** `TokenFootprint` uses `size: number` where 1 = 1x1, 2 = 2x2, 3 = 3x3, 4 = 4x4. `getOccupiedCells()` generates all cells from `(x, y)` to `(x+size-1, y+size-1)`.
- **Status:** CORRECT
- **Notes:** The implementation assumes square footprints (NxN), matching PTU's default footprints. PTU allows custom non-square shapes (e.g., 8x2 Steelix), but these are explicitly GM-discretion variants. The square default is the correct baseline implementation.

### 2. Multi-Cell Range Measurement (Nearest Cell)

- **PTU Rule:** No explicit text, but inferred from adjacency definition ("any squares they occupy touch each other") and the general principle that multi-cell tokens interact via all occupied cells (flanking rules confirm this).
- **Implementation:** `chebyshevDistanceTokens()` calculates the minimum Chebyshev distance between the rectangular footprints of two tokens using an O(1) interval-gap formula:
  ```
  gapX = max(0, a.x - bRight, b.x - aRight)
  gapY = max(0, a.y - bBottom, b.y - aBottom)
  distance = max(gapX, gapY)
  ```
- **Status:** CORRECT
- **Notes:** The O(1) rectangle-to-rectangle distance formula is mathematically equivalent to iterating all cell pairs and taking the minimum Chebyshev distance, but runs in constant time regardless of token size. This is both correct and efficient. The formula correctly handles overlapping tokens (distance = 0), adjacent tokens (distance = 1), and separated tokens.

### 3. Chebyshev Distance for Range

- **PTU Rule:** Diagonal movement uses alternating 1/2 cost (p.425-428). Range is not explicitly defined but is universally treated as Chebyshev (diagonal = 1) in the PTU community and in this codebase's existing implementation.
- **Implementation:** Uses `Math.max(gapX, gapY)` which is Chebyshev distance.
- **Status:** CORRECT
- **Notes:** The commit does not change the distance metric -- it was already Chebyshev for single-cell tokens. The multi-cell extension naturally uses the same metric applied to the nearest cell pair. If the codebase ever switches to alternating diagonal for range, only the distance calculation would need updating, not the nearest-cell logic.

### 4. Self-Targeting for Multi-Cell Tokens

- **PTU Rule:** Self-targeting moves affect the user. For multi-cell tokens, the user occupies multiple cells.
- **Implementation:** For single-cell tokens, self-targeting checks `attacker.x === target.x && attacker.y === target.y`. For multi-cell tokens, it checks `chebyshevDistanceTokens(attackerFootprint, targetFootprint) === 0`, which returns true if the footprints overlap.
- **Status:** CORRECT
- **Notes:** This correctly handles the case where a multi-cell token uses a self-targeting move. The "self" check verifies that the target overlaps the user's footprint. A self-targeting move should only affect the user itself -- and the check ensures that `target` must occupy at least one of the same cells as the `attacker`. This is the correct interpretation.

### 5. Cardinal Adjacency for Multi-Cell Tokens

- **PTU Rule:** "Cardinally Adjacent, however, does not count diagonal squares" (p.432).
- **Implementation:** For cardinally-adjacent range, the code:
  1. Checks `chebyshevDistanceTokens() !== 1` and returns false if not adjacent.
  2. Uses `closestCellPair()` to find the nearest cells between the two tokens.
  3. Checks `(dx === 1 && dy === 0) || (dx === 0 && dy === 1)` on the closest pair to verify cardinality.
- **Status:** CORRECT
- **Notes:** This correctly adapts cardinal adjacency for multi-cell tokens. Two multi-cell tokens are cardinally adjacent if their nearest cells share an edge (not a corner). The `closestCellPair()` approach finds the actual nearest cells and then applies the cardinal check to those specific cells, which is the correct method.

### 6. Closest Cell Pair for LoS Tracing

- **PTU Rule:** LoS should be checked between the relevant cells of multi-cell tokens.
- **Implementation:** `closestCellPair()` iterates all cell pairs between two tokens and returns the pair with minimum Chebyshev distance. This pair is then used for `hasLineOfSight()` tracing.
- **Status:** CORRECT
- **Notes:** For single-cell tokens (size=1), the function short-circuits and returns positions directly. For multi-cell tokens, it performs O(n*m) iteration where n and m are the cell counts of each token. For the largest possible case (Gigantic 4x4 vs Gigantic 4x4), this is 16*16 = 256 comparisons, which is trivial. The closest cell pair is the correct origin/destination for LoS tracing because it represents the most favorable line of sight between the two tokens -- if even the best possible LoS is blocked, all others will be too. If the best LoS is clear, the attack can proceed.

## Issues Found

None. All mechanics are correctly implemented.

## PTU Compliance Assessment

The implementation correctly captures PTU's multi-cell token rules:

1. **Size footprints match PTU exactly:** Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4.
2. **Range from nearest cell is the correct interpretation.** PTU's adjacency rule ("any squares they occupy touch each other") establishes that multi-cell interactions consider all occupied cells. Measuring range from the nearest cell is the natural and universally-accepted extension of this principle.
3. **Chebyshev distance is correct for range.** The alternating 1/2 diagonal cost is explicitly a movement rule, not a range rule.
4. **Self-targeting overlap check is correct.** A multi-cell token's "self" includes all cells it occupies.
5. **Cardinal adjacency correctly adapted.** The nearest-cell approach with a cardinality check on the closest pair is the right method.
6. **LoS tracing from closest cells is correct.** Using the most favorable LoS line between two multi-cell tokens ensures that blocking terrain denial is applied fairly.

The only area where PTU is not explicit is range measurement for multi-cell tokens (no dedicated rulebook section). However, the implementation follows the only interpretation consistent with PTU's adjacency rules and standard TTRPG conventions. No other reading of the rules would produce a different result.

## Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

## Rulings

1. **Range from nearest occupied cell is correct.** PTU's adjacency definition ("any squares they occupy touch each other") establishes that multi-cell interactions use all occupied cells. The natural extension for range is to measure from the nearest cell of each token.

2. **Chebyshev distance is the correct metric for range.** The alternating 1/2 diagonal cost in PTU applies only to movement (Shift Actions). Range measurement uses simple Chebyshev distance where diagonals cost 1.

3. **The O(1) rectangle-to-rectangle distance formula is mathematically correct.** It produces identical results to iterating all cell pairs but in constant time.

4. **Self-targeting with footprint overlap is correct.** A self-targeting move affects the user, and for multi-cell tokens the user occupies all cells in its footprint. Checking for overlap (distance = 0) correctly identifies self-targeting.

5. **LoS should trace from the closest cell pair.** When checking whether a multi-cell attacker can see a multi-cell target, the most favorable line of sight (between nearest cells) is the correct one to check. This matches the principle that range is measured from the nearest cell.

6. **Custom non-square footprints are a future concern.** PTU explicitly allows non-square shapes (8x2 Steelix, 2x4 Aerodactyl). The current implementation assumes NxN squares, which matches the default PTU footprints. If custom shapes are added later, `getOccupiedCells()` and `chebyshevDistanceTokens()` would need to accept arbitrary cell sets rather than rectangular footprints.

## Verdict

APPROVED -- The fix correctly implements multi-cell token range measurement per PTU rules. Size category footprints match the rulebook exactly. Range measurement from the nearest occupied cell is the only interpretation consistent with PTU's adjacency definition and standard TTRPG conventions. The O(1) distance formula is mathematically correct and efficient. Self-targeting, cardinal adjacency, and LoS tracing are all correctly adapted for multi-cell tokens. No PTU rules are violated.
