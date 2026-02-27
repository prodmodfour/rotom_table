---
review_id: rules-review-061
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-018
domain: vtt-grid
commits_reviewed:
  - 72d383c
files_reviewed:
  - app/composables/useRangeParser.ts
mechanics_verified:
  - blocking-terrain-blocks-targeting
  - bresenham-line-of-sight-algorithm
  - origin-destination-exclusion
  - adjacent-cell-los-check
verdict: APPROVED_WITH_NOTES
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Blocking Terrain (p.487/line 487)
  - core/07-combat.md#Rough Terrain targeting penalty (p.476-485)
  - core/10-indices-and-reference.md#Inflatable capability (p.181-182)
reviewed_at: 2026-02-20T16:00:00
---

## Review Scope

Reviewing commit `72d383c` which adds a line-of-sight check for blocking terrain to the range parser. The fix introduces `hasLineOfSight()` using Bresenham's line algorithm and extends `isInRange()` with an optional `isBlockingFn` parameter.

## PTU Rulebook Reference

### Blocking Terrain Definition (Ch. 7, p.231/line 487)

> **Blocking Terrain:** Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions.

Key properties:
1. **Cannot be Shifted through** -- blocks movement.
2. **Cannot be Targeted through** -- blocks line of sight for attacks.

### Corroborating Evidence: Inflatable Capability (Ch. 10, p.181-182)

> When Inflated, Pokemon gain a -1 Penalty to Evasion, but become **Blocking Terrain**; you may not **target through** an Inflated Pokemon.

This confirms the rulebook's intent: Blocking Terrain = cannot target through it. The Inflatable capability explicitly uses "Blocking Terrain" and "may not target through" as synonymous concepts.

### Rough Terrain for Comparison (Ch. 7, p.476-478)

> **Rough Terrain:** When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls.

Rough Terrain applies an accuracy penalty for targeting through it. Blocking Terrain is the hard version -- complete denial of targeting, not a penalty. PTU has no "partial cover" or "grazing shots" mechanic for Blocking Terrain.

### Diagonal Movement Rules (Ch. 7, p.425-428)

> Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth.

This alternating 1/2 cost applies to **movement**, not to range measurement. PTU does not specify a separate range measurement formula. The standard TTRPG convention for square grids is Chebyshev distance (diagonal = 1) for range/targeting, with the alternating rule only for movement. The existing `isInRange()` already uses Chebyshev distance and this commit does not change that -- only adds the LoS check on top.

## Mechanics Verified

### 1. Blocking Terrain Blocks Targeting

- **PTU Rule:** "Terrain that cannot be Shifted or Targeted through" (p.487, line 487).
- **Implementation:** When `isBlockingFn` is provided, `isInRange()` calls `hasLineOfSight()` after confirming the target is within range. If any intermediate cell between attacker and target is blocking, targeting is denied.
- **Status:** CORRECT
- **Notes:** The implementation correctly interprets "cannot be Targeted through" as a hard denial of line of sight. There is no partial cover or reduced accuracy -- it is binary (blocked or not), matching the rulebook's "straightforwardly" language.

### 2. Bresenham's Line Algorithm for LoS

- **PTU Rule:** PTU does not prescribe a specific algorithm for LoS calculation. The rule states you cannot "target through" blocking terrain. On a square grid, this requires tracing a line from attacker to target and checking for obstructions.
- **Implementation:** Uses Bresenham's line algorithm (center-of-cell to center-of-cell) to enumerate all intermediate cells along the line.
- **Status:** CORRECT with a note (see MEDIUM issue below)
- **Notes:** Bresenham's line is a standard and widely-used algorithm for grid-based LoS in TTRPGs. It produces a deterministic, thin line of cells. This is a reasonable approximation. However, Bresenham's produces a single-pixel-wide line, which means that for diagonal LoS where the line passes exactly between two cells (e.g., attacker at (0,0), target at (2,2), the line passes through (1,1) only -- not (1,0) or (0,1)). Some TTRPG systems use "symmetric" LoS where if A can see B, B can also see A. Bresenham's is inherently symmetric (same cells traced in both directions), which is good. The main concern is corner-touching diagonal cases -- see issue M1 below.

### 3. Origin and Destination Cell Exclusion

- **PTU Rule:** The rule says terrain that cannot be "Targeted through." The attacker's cell and the target's cell are not "through" cells -- they are the endpoints.
- **Implementation:** The algorithm explicitly skips the origin `(from.x, from.y)` and destination `(to.x, to.y)` cells when checking for blocking terrain.
- **Status:** CORRECT
- **Notes:** This is the correct interpretation. Consider the scenario: a Pokemon is standing on top of a wall (blocking terrain). It should still be able to attack and be attacked. The blocking terrain blocks what passes *through* it, not what originates from or terminates at it. The Inflatable capability confirms this interpretation -- the inflated Pokemon *becomes* blocking terrain, but can still be targeted directly (it gains -1 Evasion, implying it can still be attacked).

### 4. Adjacent Cell LoS Check

- **PTU Rule:** Blocking terrain blocks targeting. No exception is given for adjacent cells.
- **Implementation:** For cardinally-adjacent range type, the code checks LoS even for adjacent targets: `if (isBlockingFn) { return hasLineOfSight(attacker, target, isBlockingFn) }`.
- **Status:** CORRECT
- **Notes:** Since the origin and destination are excluded from the blocking check, and cardinally-adjacent cells have no intermediate cells, the LoS check will always pass for truly adjacent cells (there are no cells between two cardinally-adjacent cells to be blocking). This is correct behavior -- a wall cell would need to be *between* attacker and target to block, and for adjacent cells there is nothing between them. If the attacker IS on blocking terrain or the target IS on blocking terrain, the endpoints are excluded, so targeting still works.

## Issues Found

### M1: Diagonal LoS through corner-touching blocking cells (MEDIUM)

**Description:** Bresenham's line algorithm traces a thin line through the grid. When the line passes diagonally between two blocking cells that share only a corner, Bresenham's will NOT flag this as blocked -- it traces through the gap between them. For example:

```
. B .       B = Blocking terrain
B . .       A = Attacker at (0,2), T = Target at (2,0)
. . .       Bresenham traces: (0,2) -> (1,1) -> (2,0)
A . T       Cell (1,1) is open, so LoS passes.
```

But visually, the line passes between two blocking cells at (0,1) and (1,2) that share a corner. Some GMs and TTRPG systems would rule this as blocked (the "wall" formed by two diagonal blocking cells should block LoS).

**PTU Rule:** PTU does not address this edge case. The rulebook says "cannot be Targeted through" blocking terrain but does not define what "through" means for diagonal corner-touching cases.

**Impact:** This is a GM-judgment edge case. The current implementation is permissive (allows LoS through diagonal gaps), which is a defensible interpretation. Many digital TTRPG implementations use this same approach. This is not a PTU rule violation -- it is an ambiguity the rules do not resolve.

**Recommendation:** No code change required. Document this as a known edge case. If a stricter interpretation is desired later, a "fat line" LoS algorithm could be added as an option.

## PTU Compliance Assessment

The implementation correctly captures the core PTU rule: Blocking Terrain prevents targeting through it. The key rulebook text is unambiguous:

1. **"Terrain that cannot be Shifted or Targeted through"** (Ch. 7) -- the fix correctly blocks targeting.
2. **"you may not target through an Inflated Pokemon"** (Inflatable capability) -- corroborates the rule.
3. **No partial cover for Blocking Terrain** -- only Rough Terrain has an accuracy penalty. Blocking is binary denial.
4. **Endpoint exclusion is correct** -- "through" means intermediate cells, not the origin/destination.

The choice of Bresenham's algorithm is a reasonable implementation detail for a rule that PTU does not prescribe an algorithm for. The only ambiguity is the corner-touching diagonal case (M1), which PTU does not address.

## Summary

- Mechanics checked: 4
- Correct: 4
- Incorrect: 0
- Needs review: 0 (M1 is an ambiguity, not a rule violation)

## Rulings

1. **Blocking terrain correctly denies targeting.** The PTU rule is explicit and unambiguous: "cannot be Targeted through." The implementation matches this as a binary LoS check.

2. **Endpoint exclusion is correct.** The attacker and target cells are not "through" cells. A combatant standing on blocking terrain can still attack and be attacked. The Inflatable capability confirms blocking terrain entities can still be targeted directly.

3. **Bresenham's line is a valid LoS algorithm.** PTU does not prescribe an algorithm. Bresenham's is symmetric, deterministic, and widely used in grid-based TTRPG implementations.

4. **No partial cover mechanic exists for Blocking Terrain.** Only Rough Terrain applies an accuracy penalty (-2). Blocking Terrain is all-or-nothing.

5. **Adjacent-cell LoS is correctly handled.** Since endpoints are excluded and there are no intermediate cells between adjacent cells, the LoS check correctly passes for adjacent targets even when one is on blocking terrain.

## Verdict

APPROVED_WITH_NOTES -- The fix correctly implements PTU's Blocking Terrain targeting denial rule. The Bresenham's line algorithm is a reasonable LoS implementation for a square grid. Origin/destination exclusion matches the "through" semantics of the rule. One MEDIUM note (M1) documents a diagonal corner-touching ambiguity that PTU does not resolve and the current permissive behavior is a defensible default. No code changes required.
