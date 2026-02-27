---
review_id: rules-review-150
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-002
domain: vtt
commits_reviewed:
  - 52ca518
mechanics_verified:
  - terrain-painting-elevation
  - terrain-movement-costs
  - terrain-type-definitions
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Terrain
reviewed_at: 2026-02-25T03:06:41Z
follows_up: rules-review-147
---

## Mechanics Verified

### 1. Terrain Painting Elevation (Fix Target)
- **Rule:** Terrain elevation is a VTT display feature (isometric 3D rendering). No direct PTU rulebook mechanic governs grid cell elevation values. The elevation parameter flows through `applyTool` -> `setTerrain` -> `TerrainCell.elevation` for visual rendering only.
- **Implementation:** Commit 52ca518 changes line 477 of `useIsometricInteraction.ts` from `terrainStore.applyTool(gridPos.x, gridPos.y)` to `terrainStore.applyTool(gridPos.x, gridPos.y, options.terrainPaintElevation?.value ?? 0)`. This makes the drag painting handler (`handleMouseMove`) pass the same elevation parameter as the initial click handler (`handleMouseDown`, line 338).
- **Status:** CORRECT -- The fix is a one-line change that makes drag-painted cells receive the same elevation value as the initial click cell. No game logic formulas are affected.

### 2. Terrain Movement Costs (Regression Check)
- **Rule:** "Slow Terrain [...] treat every square meter as two square meters instead." (`core/07-combat.md#Terrain`). "Earth Terrain [...] You may only Shift through Earth Terrain if you have a Burrow Capability." "Underwater [...] You may not move through Underwater Terrain during battle if you do not have a Swim Capability." "Blocking Terrain [...] cannot be Shifted or Targeted through."
- **Implementation:** `TERRAIN_COSTS` in `app/stores/terrain.ts` (lines 17-26): `normal: 1`, `difficult: 2` (slow terrain), `blocking: Infinity`, `water: 2` (with swim check), `earth: Infinity` (with burrow check), `rough: 1`, `hazard: 1`, `elevated: 1`. The `getMovementCost` getter (lines 71-82) checks swim/burrow capabilities before returning costs.
- **Status:** CORRECT -- Movement costs match PTU rules. Slow terrain = 2x cost. Blocking = impassable. Water/earth require capabilities. The commit does not modify any of these values.

### 3. Terrain Type Definitions (Regression Check)
- **Rule:** PTU defines Regular, Earth, Underwater, Slow, Rough, and Blocking terrain types (`core/07-combat.md#Terrain`).
- **Implementation:** The `TerrainType` includes: `normal` (Regular), `difficult` (Slow), `blocking`, `water` (Underwater), `earth`, `rough`, `hazard`, `elevated`. The app extends PTU types with `hazard` and `elevated` as VTT-specific additions.
- **Status:** CORRECT -- All PTU terrain types are represented. Additional types (`hazard`, `elevated`) are VTT extensions that do not conflict with PTU rules.

## Summary

The fix commit (52ca518) addresses exactly one issue: the drag painting handler in `useIsometricInteraction.ts` was not passing the `terrainPaintElevation` value to `terrainStore.applyTool()`, causing drag-painted cells to default to elevation 0 while the initial click correctly passed the elevation. This is now consistent -- both handlers pass `options.terrainPaintElevation?.value ?? 0`.

**Scope of change:** One line in one file. The change passes an existing parameter to an existing function with a matching default. No game formulas, combat mechanics, movement costs, or PTU rule implementations are modified.

**Regression risk:** None. The `applyTool` function signature (`x, y, elevation = 0`) was already accepting elevation since the P2 implementation. The fix simply ensures the drag handler passes the value instead of relying on the default. All existing terrain mechanics (movement costs, passability checks, capability requirements) are untouched.

**Note on non-isometric grid:** `useGridInteraction.ts` (legacy 2D grid) calls `applyTool` without elevation at lines 183 and 327. This is expected -- the 2D grid does not have elevation controls, and the default value of 0 is correct for flat grid rendering.

## Rulings

No new rulings required. RULING-1 (Chebyshev measurement) from rules-review-147 remains unchanged and is tracked as ptu-rule-083.

## Verdict

**APPROVED** -- The fix correctly resolves H-NEW from code-review-157. No PTU game logic is affected by this VTT display fix. Zero issues found.

## Required Changes

None.
