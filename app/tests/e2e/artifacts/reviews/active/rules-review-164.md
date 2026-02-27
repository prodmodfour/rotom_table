---
review_id: rules-review-164
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - mixed-terrain-speed-averaging
  - capability-deduplication
  - movement-modifier-order
  - path-terrain-analysis
  - flood-fill-speed-constraint
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#movement-and-shifting
  - decree-011
  - decree-008
  - decree-010
reviewed_at: 2026-02-26T21:00:00Z
follows_up: null
---

## Mechanics Verified

### Mixed-Terrain Speed Averaging (PTU p.231)

- **Rule:** "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value. For example, if a Pokémon has Overland 7 and Swim 5, they can shift a maximum of 6 meters on a turn that they use both Capabilities." (`core/07-combat.md`, p.231)
- **Implementation:** `calculateAveragedSpeed` in `app/utils/combatantCapabilities.ts` collects distinct capability types along a path via `seenCapabilities` Set, averages the speed values, and floors the result. The flood-fill variant `getMovementRangeCellsWithAveraging` in `app/composables/usePathfinding.ts` tracks terrain types per path and constrains expansion to the averaged speed budget.
- **Status:** CORRECT for the 2-capability case per the PTU example (Overland 7 + Swim 5 = floor((7+5)/2) = 6). The general averaging formula `Math.floor(sum / count)` is faithful to PTU's "round down" convention. However, the speed storage data structure has a correctness issue affecting the 3+ capability edge case (see M-001 below).

### Capability Deduplication

- **Rule:** PTU says to average the Movement **Capabilities** used, not the terrain types. If a path crosses `normal` + `hazard` terrain, both use Overland — this is one capability, not two.
- **Implementation:** `calculateAveragedSpeed` uses `seenCapabilities: Set<string>` keyed on `'overland'`, `'swim'`, `'burrow'` to deduplicate. Multiple terrain types mapping to the same capability (e.g., normal + hazard + elevated all map to overland) correctly count once.
- **Status:** CORRECT — deduplication logic is sound.

### Movement Modifier Application Order

- **Rule:** PTU p.231 (Stuck), p.234 (Speed CS) — modifiers apply to the effective movement speed for the turn.
- **Implementation:** `buildSpeedAveragingFn` first computes the raw averaged capability speed via `calculateAveragedSpeed`, then applies `applyMovementModifiers` (Stuck, Slowed, Speed CS, Sprint) to the result. The exploration budget `getMaxPossibleSpeed` applies modifiers to the single highest speed for the outer flood-fill bound, while the per-path averaged speed is separately constrained.
- **Status:** CORRECT — modifiers are applied once to the averaged base, not to individual capabilities before averaging. Order: (1) raw capability speeds → (2) average → (3) apply Stuck/Slowed/Speed CS/Sprint. This matches PTU intent.

### Path Terrain Analysis (A* Reconstruction)

- **Rule:** Per decree-011, terrain types must be detected along the actual A* path, not approximated.
- **Implementation:** `calculatePathCost` in `usePathfinding.ts` (commit `e8ac904`) reconstructs the full path via `closedNodes` parent-pointer map. `isValidMove` in `useGridMovement.ts` passes the reconstructed path to `getAveragedSpeedForPath`, which collects terrain types from each cell and feeds them to `calculateAveragedSpeed`.
- **Status:** CORRECT — path reconstruction via parent pointers from destination to start, with proper fallbacks for the start node remaining in openSet.

### Flood-Fill Speed Constraint

- **Rule:** Movement range display must account for speed averaging — a cell is only reachable if the path cost to it fits within the averaged speed for the terrain types encountered along that path.
- **Implementation:** `getMovementRangeCellsWithAveraging` in `usePathfinding.ts` (commit `26964bd`) explores with `maxSpeed` as the outer budget, accumulates terrain types per-path in `pathTerrainTypes`, and checks `totalCost > getAveragedSpeed(pathTerrainTypes)` to prune unreachable cells.
- **Status:** CORRECT — the double-check pattern (outer maxSpeed budget + inner averaged speed constraint) is sound. The averaged speed can never exceed maxSpeed, so the exploration won't miss any reachable cells.

### Decree Compliance

- **decree-008** (water terrain cost = 1): Water base cost is 1 in `TERRAIN_COSTS`, swim speed selection handles the capability requirement. Speed averaging includes swim speed for water terrain. COMPLIANT.
- **decree-010** (multi-tag terrain): The terrain type lookup uses `getTerrainAt` which returns the base type (e.g., 'water'), independent of flags (rough/slow). Speed averaging operates on base terrain types, not flags. Slow flag still doubles movement cost via the terrain cost getter. COMPLIANT.
- **decree-011** (mixed-terrain speed averaging): Path-based averaging implemented per the ruling. A* path reconstruction feeds terrain analysis. Flood-fill variant tracks terrain types. Both `isValidMove` and movement range display use averaging. COMPLIANT.

## Issues

### M-001: `capabilitySpeeds` uses `Set<number>` causing incorrect averaging for 3+ capabilities with shared speed values

**File:** `app/utils/combatantCapabilities.ts`, lines 133-168
**Severity:** MEDIUM

`capabilitySpeeds` is declared as `Set<number>`. If two distinct capabilities (e.g., Overland and Swim) have the same numeric speed value, the Set deduplicates them, producing an incorrect average.

**Example:** Pokemon with Overland 6, Swim 6, Burrow 3 crossing land + water + earth terrain:
- `seenCapabilities` = `{'overland', 'swim', 'burrow'}` (3 entries, correct)
- `capabilitySpeeds` = `{6, 3}` (2 entries — 6 deduplicated)
- Code computes: `(6 + 3) / 2 = 4`
- Correct per PTU: `(6 + 6 + 3) / 3 = 5`

**Fix:** Replace `capabilitySpeeds: Set<number>` with `capabilitySpeeds: number[]` (an Array). Use `capabilitySpeeds.push(speed)` instead of `.add(speed)`. Use `.length` instead of `.size`. This preserves duplicate speed values while still deduplicating capabilities via `seenCapabilities`.

**Impact:** Only affects the rare 3+ capability scenario where two capabilities share the same speed. The common 2-capability case (Overland + Swim) is unaffected when speeds differ. Unlikely to be hit in normal play but is a correctness violation of the PTU averaging formula.

### M-002: `drawExternalMovementPreview` references undefined `speed` variable in averaging path

**File:** `app/composables/useGridRendering.ts`, line 574
**Severity:** MEDIUM

In `drawExternalMovementPreview`, the speed badge is drawn with `drawSpeedBadge(ctx, badgeX, badgeY, speed)` (line 574). However, `speed` is only declared inside the `else` block (line 549: `const speed = options.getSpeed(token.combatantId)`). When `canUseAveraging` is true (lines 539-547), no `speed` variable is in scope.

This would cause a TypeScript compile error or a runtime `ReferenceError` when terrain is present on the grid and the group view receives a movement preview via WebSocket.

**Fix:** Declare a `displaySpeed` variable before the `if/else` block, similar to how `drawMovementRange` handles it (line 413):
```typescript
let rangeCells: GridPosition[]
let displaySpeed: number
if (canUseAveraging) {
  // ... averaging path ...
  displaySpeed = options.getSpeed(token.combatantId)
} else {
  const speed = options.getSpeed(token.combatantId)
  rangeCells = getMovementRangeCells(...)
  displaySpeed = speed
}
// ...
drawSpeedBadge(ctx, badgeX, badgeY, displaySpeed)
```

## Summary

The implementation faithfully translates PTU p.231 mixed-terrain speed averaging and complies with decrees 008, 010, and 011. The core mechanic — averaging distinct Movement Capabilities when a path crosses terrain boundaries — is correctly implemented for the common 2-capability case. The A* path reconstruction, flood-fill with speed constraint, capability deduplication, and modifier application order are all sound.

Two medium-severity issues were found: (1) a data structure bug in `calculateAveragedSpeed` that produces incorrect results when 3+ capabilities share speed values, and (2) an undefined variable reference in the external movement preview rendering path.

## Rulings

1. **PTU "average the Capabilities" means arithmetic mean of distinct capability speed values, floored.** The implementation correctly uses `Math.floor(sum / count)`. The PTU example (7+5)/2 = 6 confirms this interpretation.
2. **Movement modifiers apply AFTER averaging, not before.** PTU p.231 defines the averaged value as the movement budget; p.234 modifiers (Stuck, Slowed, Speed CS) then modify that budget. The implementation correctly applies modifiers after averaging.
3. **Terrain types map to capabilities, not vice versa.** Multiple terrain types can map to the same capability (normal, hazard, elevated all use Overland). The implementation correctly deduplicates by capability key.

## Verdict

**CHANGES_REQUIRED** — Two medium issues must be resolved before approval. No critical or high-severity PTU rule violations.

## Required Changes

1. **M-001:** Change `capabilitySpeeds` from `Set<number>` to `number[]` in `calculateAveragedSpeed` to prevent numeric deduplication of distinct capabilities with the same speed value.
2. **M-002:** Fix undefined `speed` reference in `drawExternalMovementPreview` by declaring `displaySpeed` before the averaging branch, mirroring the pattern used in `drawMovementRange`.
