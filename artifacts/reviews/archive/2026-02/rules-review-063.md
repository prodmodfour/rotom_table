---
review_id: rules-review-063
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-018, bug-019
domain: vtt-grid, scenes
commits_reviewed:
  - be63a3f
  - ef080be
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/MoveTargetModal.vue
mechanics_verified:
  - blocking-terrain-los-wiring
  - multi-cell-token-range-wiring
  - self-targeting
  - adjacency
  - gm-visibility
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#blocking-terrain (p.487, lines 487-489)
  - core/07-combat.md#token-sizes (p.231, lines 400-410)
  - core/07-combat.md#adjacency (p.231, lines 429-432)
reviewed_at: 2026-02-20T17:30:00
follows_up: rules-review-061
---

## Review Scope

Reviewing the **wiring commits** for bug-018 and bug-019. The core functions (`hasLineOfSight`, `isInRange` with multi-cell support, `chebyshevDistanceTokens`, `closestCellPair`) were already rules-reviewed and APPROVED in rules-review-061 and rules-review-062 respectively. This review covers how those approved functions are **connected to the targeting flow** in `useMoveCalculation.ts` and `MoveTargetModal.vue`.

Specifically:
- **Commit `be63a3f`** (bug-018): Wires `isBlockingTerrain` helper and `targetRangeStatus` computed into the move targeting modal, disabling targets blocked by terrain.
- **Commit `ef080be`** (bug-019): Passes `Combatant.tokenSize` as `attackerSize`/`targetSize` to `isInRange()` calls.

## PTU Rulebook Reference

### Blocking Terrain (Ch. 7, p.231, lines 487-489)

> **Blocking Terrain:** Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions.

### Token Sizes (Ch. 7, p.231, lines 400-402)

> A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. **Large is 2x2, Huge is 3x3, and Gigantic is 4x4**.

### Adjacency (Ch. 7, p.231, lines 429-432)

> Two combatants are **Adjacent** to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. **Cardinally Adjacent**, however, does not count diagonal squares.

## Mechanics Verified

### 1. Blocking Terrain / Line of Sight Wiring

- **PTU Rule:** "Terrain that cannot be Shifted or Targeted through" (`core/07-combat.md`, p.487).
- **Implementation:** `useMoveCalculation.ts` creates an `isBlockingTerrain` helper:
  ```typescript
  const isBlockingTerrain = (x: number, y: number): boolean => {
    return terrainStore.getTerrainAt(x, y) === 'blocking'
  }
  ```
  This is passed as the `isBlockingFn` parameter to `isInRange()` in the `targetRangeStatus` computed. The terrain store's `getTerrainAt()` returns the `TerrainType` at a grid position, and the comparison against `'blocking'` correctly isolates blocking terrain.
- **Status:** CORRECT
- **Notes:** The wiring correctly delegates the blocking-terrain identification to the terrain store (single source of truth) and passes the predicate into the already-approved `isInRange()` function. The `'blocking'` string matches the terrain type enum used throughout the codebase. No PTU mechanics are bypassed or misapplied in the wiring layer.

### 2. Multi-cell Token Range Wiring

- **PTU Rule:** Range measured from nearest occupied cell (inferred from adjacency definition: "any squares they occupy touch each other"). Reviewed and established as correct in rules-review-062.
- **Implementation:** Commit `ef080be` adds:
  ```typescript
  const attackerSize = actor.value.tokenSize || 1
  const targetSize = target.tokenSize || 1
  ```
  These are passed to both the primary `isInRange()` call (with `isBlockingFn`) and the fallback call (without `isBlockingFn`, for distinguishing "out of range" vs "blocked by terrain").
- **Status:** CORRECT
- **Notes:**
  1. **Source of tokenSize is correct.** `Combatant.tokenSize` is defined in the type as `tokenSize: number` (1 = 1x1, 2 = 2x2 Large, 3 = 3x3 Huge, 4 = 4x4 Gigantic). This maps directly to the `size` parameter in `isInRange()`.
  2. **Default of 1 via `|| 1` is correct.** If `tokenSize` is falsy (0 or undefined), defaulting to 1 (1x1) matches the PTU default for Small/Medium combatants.
  3. **Both isInRange calls use token sizes.** The primary call (line 114-121) and the diagnostic fallback call (line 128-135) both pass `attackerSize` and `targetSize`. This ensures the "out of range vs blocked" distinction is computed with correct multi-cell distances.

### 3. Self-targeting

- **PTU Rule:** Self-targeting moves affect only the user.
- **Implementation:** The `isInRange()` function (reviewed in rules-review-062) handles `parsedRange.type === 'self'` by checking footprint overlap via `chebyshevDistanceTokens() === 0`. The wiring in `useMoveCalculation.ts` passes the actor's own `tokenSize` as `attackerSize`. If the actor targets itself, the positions match and the overlap check returns true regardless of token size.
- **Status:** CORRECT
- **Notes:** For self-targeting, `actor.value.position === target.position` (same reference if targeting self) and `attackerSize === targetSize` (same combatant), so `chebyshevDistanceTokens` returns 0. For single-cell tokens, the fast path `attacker.x === target.x && attacker.y === target.y` fires. Both paths are correct.

### 4. Adjacency

- **PTU Rule:** "Adjacent to one another if any squares they occupy touch each other" (p.231).
- **Implementation:** Adjacency is handled by the `isInRange()` function for melee and cardinally-adjacent range types. The wiring passes `attackerSize` and `targetSize`, so `chebyshevDistanceTokens()` computes the minimum distance between all occupied cells of both tokens. For melee (range 1), a distance of 0 (overlapping) or 1 (adjacent) satisfies the range check. For cardinally-adjacent, the additional cardinality check on the closest cell pair ensures only edge-sharing (not corner-sharing) cells count.
- **Status:** CORRECT
- **Notes:** The wiring does not add any adjacency logic itself -- it correctly delegates to the already-approved functions by passing the correct token sizes. A 2x2 Large token adjacent to a 3x3 Huge token will have `chebyshevDistanceTokens()` return 1 if any of their cells touch, which is the correct PTU adjacency definition.

### 5. GM Visibility (Disabled vs Hidden)

- **Rule concern:** The GM should be able to see all targets, even those out of range, to maintain situational awareness.
- **Implementation:** In `MoveTargetModal.vue`, out-of-range targets are rendered in the target list with `:disabled="!isTargetInRange(target.id)"` and the CSS class `target-btn--out-of-range` (opacity 0.4, cursor not-allowed). The target buttons are **disabled, not hidden** -- they remain visible in the list with a reason text ("Out of range" or "Blocked by terrain (no line of sight)").
- **Status:** CORRECT
- **Notes:** This is the right UX approach for a GM tool. The GM can see all combatants and their range/LoS status at a glance. Clicking a disabled target is a no-op (both the `:disabled` attribute and the `handleToggleTarget` guard prevent selection). The reason text provides actionable information about *why* a target is unavailable.

## Graceful Degradation Check

The `targetRangeStatus` computed correctly handles two edge cases:
1. **No actor position** (`!actorPos`): All targets marked as in-range. Correct for non-VTT encounters where grid positions are not used.
2. **No target position** (`!target.position`): Target marked as in-range. Correct for combatants not yet placed on the grid.

These are not PTU rule concerns (PTU assumes a grid), but they ensure the app does not break when the VTT grid is not in use. No PTU rules are violated by this permissive fallback.

## Cross-Reference with Previous Reviews

- **rules-review-061 (bug-018 core):** APPROVED_WITH_NOTES. The `hasLineOfSight()` and `isInRange()` with `isBlockingFn` were verified correct. This review confirms the wiring passes the correct predicate (`terrainStore.getTerrainAt(x, y) === 'blocking'`) to those approved functions.
- **rules-review-062 (bug-019 core):** APPROVED. The `chebyshevDistanceTokens()`, `closestCellPair()`, and extended `isInRange()` with `attackerSize`/`targetSize` were verified correct. This review confirms the wiring sources `tokenSize` from the correct field (`Combatant.tokenSize`) and passes it consistently to both `isInRange()` call sites.

No discrepancies between the approved core functions and how they are wired.

## Summary

- Mechanics checked: 5
- Correct: 5
- Incorrect: 0
- Needs review: 0

## Rulings

1. **Blocking terrain wiring is correct.** The `isBlockingTerrain` predicate correctly reads from the terrain store and compares against `'blocking'`. This is faithfully passed to the already-approved `isInRange()` function.

2. **Token size wiring is correct.** `Combatant.tokenSize` is the authoritative source for a combatant's grid footprint size. Defaulting to 1 via `|| 1` matches PTU's Small/Medium default. Both `isInRange()` call sites (primary and diagnostic fallback) receive the correct sizes.

3. **Self-targeting is unaffected.** The wiring passes the actor's own `tokenSize` consistently, so self-targeting checks work correctly for all size categories.

4. **Adjacency is correctly delegated.** The wiring does not implement custom adjacency logic -- it passes token sizes to the already-approved nearest-cell distance functions, which correctly handle PTU's adjacency definition.

5. **GM visibility is preserved.** Out-of-range targets are disabled (not hidden) with clear reason text, giving the GM full situational awareness.

## Verdict

APPROVED -- The wiring commits correctly connect the previously-approved LoS and multi-cell range functions to the move targeting flow. The `isBlockingTerrain` predicate correctly reads from the terrain store. Token sizes are correctly sourced from `Combatant.tokenSize` and passed to both `isInRange()` call sites. The MoveTargetModal UI correctly disables (not hides) out-of-range targets with actionable reason text. No PTU rules are violated. No code changes required.

## Required Changes

None.
