---
review_id: code-review-148
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-002
domain: vtt-grid
commits_reviewed:
  - a370230
  - dac457d
  - fcad42e
  - d9b0615
  - 88c4bde
  - ea5142a
  - 08106d3
  - cc06dca
  - 05db7a4
  - 7ad643f
  - 5af1638
files_reviewed:
  - app/composables/useDepthSorting.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/useElevation.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useGridMovement.ts
  - app/composables/useRangeParser.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/ElevationToolbar.vue
  - app/components/vtt/VTTContainer.vue
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/CoordinateDisplay.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 2
  high: 3
  medium: 5
reviewed_at: 2026-02-23T13:15:00Z
follows_up: code-review-145
---

## Review Scope

P1 implementation of feature-002 (3D Isometric Rotatable Grid): Token Interaction + Movement. 11 commits adding isometric token interaction, depth sorting, elevation editing, elevation-aware movement, and 3D A* pathfinding. 4 new composables, 1 new component, 6 modified files. Total: +2151/-174 lines.

---

## Issues

### CRITICAL

#### C1: A* heuristic is inadmissible for flying Pokemon — breaks pathfinding correctness

**File:** `app/composables/useRangeParser.ts`, lines 705-713

The A* heuristic in `calculatePathCost` uses raw `Math.abs(toElev - z)` as the elevation cost estimate:

```typescript
const dz = getElevationCost ? Math.abs(toElev - z) : 0
return xyCost + dz
```

But the actual step cost uses `getElevationCost(current.node.elevation, neighborElev)` which can return **0** for flying Pokemon whose Sky speed covers the elevation difference (via `calculateElevationCost` in `useGridMovement.ts`). This means the heuristic overestimates the true cost, making it **inadmissible**. An inadmissible A* heuristic can:

1. Return suboptimal (too-expensive) paths
2. Reject valid paths by overestimating cost, causing `isValidMove` to return `{ valid: false }` when the move is actually legal

**Fix:** The heuristic must use the same cost function as the actual step cost. Replace `Math.abs(toElev - z)` with `getElevationCost(z, toElev)` (or 0 when `getElevationCost` is not provided).

The same issue exists in `getMovementRangeCells` — the Dijkstra flood-fill does not have a heuristic, so it is not affected by admissibility, but verify that the elevation cost getter is consistently applied.

#### C2: `isValidMove` does not pass elevation to A* — 3D pathfinding is incomplete

**File:** `app/composables/useGridMovement.ts`, lines 360-377

When terrain is present, `isValidMove` calls `calculatePathCost(fromPos, toPos, blockedCells, terrainCostGetter)` without passing the new elevation parameters (`getElevationCost`, `getTerrainElevation`, `fromElevation`). Then it adds a point-to-point `elevCost` on top of the 2D path cost.

This means:
1. The A* path does **not** account for elevation changes along intermediate cells
2. Elevation cost is computed as a simple origin-to-destination delta, ignoring terrain elevation at intermediate cells
3. A path that traverses a mountain ridge (high elevation cells in the middle) is costed the same as a flat path

The `calculateTerrainAwarePathCost` method at line 310 has the same gap — it calls `calculatePathCost(from, to, blockedCells, terrainCostGetter)` without elevation.

**Fix:** Both `isValidMove` and `calculateTerrainAwarePathCost` must pass elevation parameters to `calculatePathCost` when `options.getTokenElevation` and `options.getTerrainElevation` are provided. Build the `elevationCostGetter` (bound to the combatant) and pass it along with `options.getTerrainElevation` and the token's current elevation as `fromElevation`.

---

### HIGH

#### H1: Sprite cache never triggers re-render after async load — tokens show fallback until next event

**File:** `app/composables/useIsometricRendering.ts`, lines 61-76

The `spriteCache` + `loadSprite` pattern loads images asynchronously. When `img.onload` fires, the image is cached, but **no re-render is scheduled**. The token will display as a fallback circle until some other event (mouse move, zoom, etc.) triggers a render. On initial encounter load, all tokens will briefly appear as colored circles until the user interacts with the grid.

**Fix:** The `loadSprite` function needs a callback or reference to `scheduleRender` so that `img.onload` triggers a re-render. Since `loadSprite` is defined at module scope (outside the composable), one approach is to pass `scheduleRender` as a parameter, or move `loadSprite` inside the composable closure. The `img.onload` handler should call `scheduleRender()` after updating the cache.

#### H2: Duplicate `combatantCanFly` and `getSkySpeed` functions — DRY violation creates divergence risk

**Files:** `app/composables/useGridMovement.ts` (lines 51-68) and `app/composables/useElevation.ts` (lines 24-42)

Both files define identical `combatantCanFly` and `getSkySpeed` functions. Additionally, `useElevation.ts` exports these via the composable return value (lines 227-228), while `useGridMovement.ts` keeps them as module-private.

If either copy is updated (e.g., to add Levitate capability, or human Flight features), the other copy won't be updated in sync. These are pure utility functions with no dependency on composable state.

**Fix:** Extract `combatantCanFly` and `getSkySpeed` into a shared utility (e.g., `app/utils/combatantCapabilities.ts`) and import from both composables. `useElevation` should re-export from the utility rather than defining its own copy.

#### H3: `spriteCache` is module-level and never cleared — unbounded memory growth across encounters

**File:** `app/composables/useIsometricRendering.ts`, line 61

`const spriteCache = new Map<string, HTMLImageElement | null>()` is declared at module scope. Every unique Pokemon species/shiny variant and human avatar URL adds an entry that is never removed. Over a long session with many encounters involving different Pokemon, this Map grows without bound. Each `HTMLImageElement` holds the decoded image bitmap in memory.

**Fix:** Add a cache eviction strategy. Options:
- Clear the cache when the encounter changes (expose a `clearSpriteCache()` function)
- Use an LRU cache with a size limit (e.g., 100 entries)
- At minimum, provide a cleanup function called from `onUnmounted` in `IsometricCanvas.vue`

---

### MEDIUM

#### M1: `app-surface.md` not updated with new composables and component

**File:** `.claude/skills/references/app-surface.md`

4 new composables (`useDepthSorting`, `useIsometricInteraction`, `useElevation`, `useDepthSorting`) and 1 new component (`ElevationToolbar`) were added but `app-surface.md` was not updated. Per project conventions, new endpoints/components/routes/stores require surface manifest updates.

**Fix:** Update `app-surface.md` to list all 4 new composables and the `ElevationToolbar` component.

#### M2: `useRangeParser.ts` is now 830 lines — exceeds 800-line limit

**File:** `app/composables/useRangeParser.ts` — 830 lines (including the blank line at EOF)

The P1 changes added 124 lines to this file, pushing it past the 800-line project threshold. The elevation-aware pathfinding logic (`calculatePathCost`, `getMovementRangeCells`) is conceptually separable from the range parsing logic.

**Fix:** Extract the pathfinding functions (`calculatePathCost`, `getMovementRangeCells`, `calculateMoveCost`, `validateMovement`, and the new elevation types) into a dedicated `usePathfinding.ts` composable. `useRangeParser` would import and re-export them for backwards compatibility.

#### M3: Deep watcher on `combatants` array triggers unnecessary `applyDefaultElevation` calls

**File:** `app/components/vtt/IsometricCanvas.vue`, lines 256-260

```typescript
watch(() => props.combatants, (combatants) => {
  for (const combatant of combatants) {
    elevation.applyDefaultElevation(combatant.id)
  }
}, { immediate: true, deep: true })
```

This watcher uses `deep: true`, meaning any property change on any combatant (HP change, status condition, position update) will re-iterate all combatants. While `applyDefaultElevation` is a no-op for already-set elevations, the deep watcher fires on every combatant state change in combat, which is frequent. For an encounter with 10+ combatants in active combat, this runs dozens of times per turn.

**Fix:** Watch only the combatant IDs (the list of who is present), not their deep state:

```typescript
watch(
  () => props.combatants.map(c => c.id),
  () => {
    for (const combatant of props.combatants) {
      elevation.applyDefaultElevation(combatant.id)
    }
  },
  { immediate: true }
)
```

#### M4: Token hit detection uses rectangular bounding box — inaccurate for isometric diamonds

**File:** `app/composables/useIsometricInteraction.ts`, lines 186-199

The `getTokenAtScreenPosition` method uses an axis-aligned rectangular bounding box for hit testing:

```typescript
if (
  worldMX >= centerX - halfTokenW / 2 &&
  worldMX <= centerX + halfTokenW / 2 &&
  worldMY >= centerY - halfTokenH / 2 &&
  worldMY <= centerY + halfTokenH / 2
)
```

In isometric view, tokens sit on diamond-shaped tiles. A rectangular hit box will register clicks in the "corner" areas outside the diamond but inside the rectangle. This is particularly noticeable for larger tokens (2x2, 3x3) where the discrepancy between diamond and rectangle is significant. Users may click on visually empty space between adjacent tokens and select the wrong one.

**Fix:** Use a diamond-shaped (rhombus) point-in-polygon test instead of a rectangle. The `getTileDiamondPoints` function already provides the diamond vertices — use the standard cross-product test for point-in-convex-polygon.

#### M5: `movementPreview` arrow destination always assumes ground level (Z=0)

**File:** `app/composables/useIsometricRendering.ts`, lines 590-591

```typescript
const toElev = 0 // Target is ground level by default
```

The movement preview arrow always draws to elevation 0, even if the destination cell has terrain elevation > 0. This means the arrow endpoint will visually sink below elevated terrain cells, looking wrong. The renderer has access to `getTokenElevation` but not terrain elevation at a target cell.

**Fix:** Either pass a `getTerrainElevation` callback to the rendering options (like the movement system does), or compute `toElev` from the terrain elevation at `preview.toPosition`. The data is available via the `useElevation` composable already wired into `IsometricCanvas.vue`.

---

## What Looks Good

1. **useDepthSorting (154L)** — Clean, focused composable. Painter's algorithm with multi-cell token support is well-implemented. The back-most cell strategy for large tokens is correct.

2. **useElevation (230L)** — Solid immutable Map pattern (creates new Map on every mutation). Clean separation between token elevation and terrain elevation. Import/export for serialization is forward-thinking.

3. **ElevationToolbar.vue (250L)** — Properly presentational. All state management is done via props/emits. Uses SCSS variables consistently. Data-testid attributes on all interactive elements.

4. **CoordinateDisplay.vue elevation addition** — Minimal, clean 10-line change. Conditional rendering for Z > 0 is correct.

5. **VTTToken.vue changes** — Isometric positioning mode via `isometricMode` + `isoScreenX`/`isoScreenY` props is a clean extension. Elevation badge is consistent with the canvas-rendered badge style.

6. **Elevation-aware movement in useGridMovement** — The `calculateElevationCost` export as a pure function is testable and reusable. The Sky speed discount logic (dz <= sky => 0, else dz - sky) matches PTU rules.

7. **3D A* pathfinding extension** — The approach of extending `calculatePathCost` and `getMovementRangeCells` with optional elevation parameters preserves backwards compatibility. Existing 2D callers continue to work unchanged.

8. **Commit granularity** — 11 commits for 11 files, each with a clear purpose. Each commit adds one logical unit. Good.

---

## Verdict

**CHANGES_REQUIRED**

Two critical correctness issues block approval:

1. **C1** — The A* heuristic is inadmissible for flying Pokemon, which can cause pathfinding to reject valid moves or return suboptimal paths. This is a logic bug that will produce incorrect movement validation for any flying Pokemon with elevation changes.

2. **C2** — The 3D A* extension was built into `useRangeParser` but never wired into the `useGridMovement` callers. Elevation cost is computed as a crude point-to-point delta instead of being integrated into the A* traversal. This means elevation-aware pathfinding does not actually work through terrain.

Both issues affect core movement correctness and will produce wrong results in isometric encounters with elevation and terrain.

---

## Required Changes

### Must fix before re-review:

| ID | Severity | File(s) | Fix |
|----|----------|---------|-----|
| C1 | CRITICAL | `useRangeParser.ts` | Fix A* heuristic to use `getElevationCost` instead of raw `\|dz\|` |
| C2 | CRITICAL | `useGridMovement.ts` | Pass elevation params to both `calculatePathCost` call sites |
| H1 | HIGH | `useIsometricRendering.ts` | Trigger `scheduleRender` when sprite loads asynchronously |
| H2 | HIGH | `useGridMovement.ts`, `useElevation.ts` | Extract shared `combatantCanFly`/`getSkySpeed` to utility |
| H3 | HIGH | `useIsometricRendering.ts` | Add sprite cache eviction or cleanup |
| M1 | MEDIUM | `app-surface.md` | Add 4 new composables + ElevationToolbar |
| M2 | MEDIUM | `useRangeParser.ts` | Extract pathfinding into `usePathfinding.ts` (830L > 800L limit) |
| M3 | MEDIUM | `IsometricCanvas.vue` | Replace deep combatants watcher with ID-only watch |
| M4 | MEDIUM | `useIsometricInteraction.ts` | Use diamond hit test instead of rectangular |
| M5 | MEDIUM | `useIsometricRendering.ts` | Use terrain elevation for movement arrow destination |
