---
review_id: code-review-187
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-103
domain: vtt-grid
commits_reviewed:
  - 8998549
  - e8ac904
  - 26964bd
  - e49685e
  - 6120220
  - f8d6f66
  - 9a36a0c
  - ff9dd1b
files_reviewed:
  - app/utils/combatantCapabilities.ts
  - app/composables/usePathfinding.ts
  - app/composables/useGridMovement.ts
  - app/composables/useRangeParser.ts
  - app/composables/useGridRendering.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 2
  high: 0
  medium: 2
reviewed_at: 2026-02-26T20:30:00Z
follows_up: null
---

## Review Scope

Review of ptu-rule-103 (P1): mixed-terrain speed averaging per PTU p.231 and decree-011. 8 commits across 7 source files implementing path-based speed averaging when movement crosses terrain boundaries. Verified against decree-008 (water cost 1), decree-010 (multi-tag terrain), and decree-011 (speed averaging ruling).

## Decree Compliance

- **decree-011**: Correctly implemented. Averaging logic detects terrain types along A* path and averages applicable movement capabilities. The averaging formula (floor of mean) matches PTU convention. Applies to both movement validation (`isValidMove`) and range display (`getMovementRangeCellsWithAveraging`).
- **decree-008**: Respected. Water terrain cost remains 1 in `TERRAIN_COSTS`. Swim speed selection is handled separately from cost.
- **decree-010**: Respected. Multi-tag system is untouched. Slow flag doubles cost independently of terrain type for speed selection.

## Issues

### CRITICAL

#### C1: Undefined `speed` variable in `drawExternalMovementPreview` (useGridRendering.ts:574)

**File:** `app/composables/useGridRendering.ts`, line 574
**Commit:** f8d6f66

In `drawExternalMovementPreview`, the refactoring moved `const speed = options.getSpeed(token.combatantId)` into the `else` branch (line 549), but line 574 still references `speed` unconditionally for the speed badge display:

```typescript
drawSpeedBadge(ctx, badgeX, badgeY, speed)  // line 574
```

When `canUseAveraging` is `true`, the code takes the `if` branch (lines 539-547) and never declares `speed`. Line 574 then references an undefined variable, which will either crash at runtime or display `NaN`/`undefined` on the badge.

**Fix:** Add `let displaySpeed: number` before the branch (same pattern used in `drawMovementRange` on lines 391-418) and set it in both branches. Use `displaySpeed` on line 574 instead of `speed`.

#### C2: `Set<number>` in `calculateAveragedSpeed` silently drops duplicate speed values (combatantCapabilities.ts:133)

**File:** `app/utils/combatantCapabilities.ts`, lines 133-168
**Commit:** 8998549

`capabilitySpeeds` is declared as `Set<number>`, which deduplicates by value. If two distinct capabilities have the same speed value, the Set collapses them into one entry, producing an incorrect average.

Example: A Pokemon with Overland 7, Swim 3, Burrow 3.
- PTU correct: (7 + 3 + 3) / 3 = 4.33 -> floor -> **4**
- Code produces: Set {7, 3}, (7 + 3) / 2 = 5 -> **5** (incorrect, 25% too high)

The `seenCapabilities` Set already correctly prevents the same capability key from being counted twice. `capabilitySpeeds` should be an array, not a Set:

```typescript
const capabilitySpeeds: number[] = []
// ...
capabilitySpeeds.push(speed)
// ...
if (capabilitySpeeds.length <= 1) { ... }
```

The `capabilitySpeeds.size <= 1` check and the average calculation both need to use `.length` instead of `.size`.

### MEDIUM

#### M1: `getMaxPossibleSpeed` duplicates capability access instead of using existing utilities (useGridMovement.ts:176-182)

**File:** `app/composables/useGridMovement.ts`, lines 176-182
**Commit:** 6120220

`getMaxPossibleSpeed` accesses `pokemon.capabilities?.swim` and `pokemon.capabilities?.burrow` directly, but `getSwimSpeed` and `getBurrowSpeed` are already imported from `combatantCapabilities.ts` and perform the same operation. The direct access creates a duplicate code path that could diverge if the utility functions are updated (e.g., to handle human characters differently).

**Fix:** Replace:
```typescript
if (combatantCanSwim(combatant)) {
  const pokemon = combatant.entity as Pokemon
  speeds.push(pokemon.capabilities?.swim ?? 0)
}
```
with:
```typescript
if (combatantCanSwim(combatant)) {
  speeds.push(getSwimSpeed(combatant))
}
```

Same for `getBurrowSpeed`. `getSwimSpeed` and `getBurrowSpeed` are already imported on line 6.

#### M2: Flood-fill cost map may under-report reachable cells in edge cases (usePathfinding.ts:422-554)

**File:** `app/composables/usePathfinding.ts`, `getMovementRangeCellsWithAveraging`
**Commit:** 26964bd

The flood-fill tracks terrain types per path but only stores the cheapest-cost path to each cell. A higher-cost path with fewer terrain types might yield a higher averaged speed, enabling further exploration from that cell. This means some cells that are technically reachable may not appear in the movement range display.

Example: Cell X reachable via Path A (cost 4, terrains {normal, water}, averaged speed 6) and Path B (cost 5, terrains {normal}, speed 7). Path B is discarded because its cost exceeds Path A's. But from X onward, Path B allows 2 more meters of movement (7-5=2) vs Path A (6-4=2) -- same here, but in other configurations the discrepancy is larger.

The correct solution would require multi-state exploration keyed by (position, terrain-type-set), which is significantly more complex. The current approach is a reasonable approximation because:
1. It errs conservatively (shows fewer cells, never shows unreachable cells)
2. Actual move validation in `isValidMove` uses A* with full path analysis, so no invalid moves can be executed
3. The edge case requires specific terrain layouts unlikely in typical play

**Recommendation:** Document this limitation in a code comment on `getMovementRangeCellsWithAveraging`. No code change required now.

## What Looks Good

1. **Architecture**: Clean separation of concerns. Pure utility functions in `combatantCapabilities.ts`, pathfinding algorithm in `usePathfinding.ts`, game-logic integration in `useGridMovement.ts`, and rendering wiring in `useGridRendering.ts` / canvas components. Follows the project's SRP pattern well.

2. **Decree compliance**: The implementation faithfully follows decree-011's ruling. Speed averaging is correctly applied at both validation time (A* path analysis in `isValidMove`) and display time (flood-fill in `getMovementRangeCellsWithAveraging`). The PTU p.231 rule is cited in all relevant JSDoc comments.

3. **Backward compatibility**: The new functions are additive. `getMovementRangeCells` (non-averaging) is preserved. The rendering options (`getMaxPossibleSpeed`, `buildSpeedAveragingFn`, `getTerrainTypeAt`) are optional in `UseGridRenderingOptions`, so existing consumers that don't provide them fall back to the old behavior.

4. **Elevation support**: `getMovementRangeCellsWithAveraging` correctly accepts optional elevation cost/getter parameters and IsometricCanvas correctly passes them through, including combatant-specific elevation cost (flying Pokemon get reduced cost).

5. **Movement modifier chain**: `buildSpeedAveragingFn` correctly applies `applyMovementModifiers` after `calculateAveragedSpeed`, so Stuck/Slowed/SpeedCS/Sprint all interact correctly with averaged speeds.

6. **Commit granularity**: 8 well-scoped commits, each touching a logical unit. Path reconstruction (e8ac904) and flood-fill variant (26964bd) are separate commits in the pathfinding file, which is good.

7. **File sizes**: All files remain under 800 lines (largest: useGridRendering.ts at 618).

8. **A* path reconstruction** (e8ac904): The `closedNodes` map correctly stores parent pointers for path tracing, and the reconstruction handles the edge case where the parent is still in `openSet` (the start node).

## Verdict

**CHANGES_REQUIRED** -- two critical issues must be fixed before merge.

## Required Changes

1. **[C1]** Fix the undefined `speed` variable in `drawExternalMovementPreview` (useGridRendering.ts:574). Add a `displaySpeed` variable following the same pattern as `drawMovementRange`.

2. **[C2]** Change `capabilitySpeeds` from `Set<number>` to `number[]` in `calculateAveragedSpeed` (combatantCapabilities.ts:133). Update `.size` references to `.length`. This fixes incorrect averaging when two distinct capabilities share the same speed value.

3. **[M1]** Use `getSwimSpeed(combatant)` and `getBurrowSpeed(combatant)` in `getMaxPossibleSpeed` instead of direct property access.

4. **[M2]** Add a code comment to `getMovementRangeCellsWithAveraging` documenting the conservative approximation limitation.
