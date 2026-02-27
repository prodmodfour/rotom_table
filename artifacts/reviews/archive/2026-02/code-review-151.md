---
review_id: code-review-151
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-002
domain: vtt-grid
commits_reviewed:
  - 4d5e4e5
  - 23c0f8c
  - f0c7a3e
  - b3abc63
  - 0ff5557
  - 1cf2bb8
  - 724e18e
  - c758286
  - 36ead67
files_reviewed:
  - app/composables/usePathfinding.ts
  - app/composables/useRangeParser.ts
  - app/composables/useGridMovement.ts
  - app/composables/useElevation.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useIsometricInteraction.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/utils/combatantCapabilities.ts
  - .claude/skills/references/app-surface.md
  - app/tests/e2e/artifacts/tickets/feature/feature-002.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T16:30:00Z
follows_up: code-review-148
---

## Review Scope

Re-review of the feature-002 P1 fix cycle. The previous code-review-148 found 10 issues (2 CRITICAL, 3 HIGH, 5 MEDIUM) and returned CHANGES_REQUIRED. The previous rules-review-138 found 2 MEDIUM issues that overlapped with C1 and C2. The developer applied fixes across 9 commits. This review verifies every issue is fully resolved and no regressions were introduced.

## Issue Verification

### C1: A* heuristic inadmissible for flying Pokemon (FIXED)

**Previous issue:** The A* heuristic in `calculatePathCost` used `Math.abs(toZ - fromZ)` as the elevation component, which overestimates the true cost for flying Pokemon (who pay 0 elevation cost within their Sky speed range). An inadmissible heuristic breaks A* optimality guarantees.

**Fix (23c0f8c):** The heuristic now uses `getElevationCost(z, toElev)` when an elevation cost getter is provided, falling back to 0 when not. The `getElevationCost` function calls `calculateElevationCost` which returns 0 for flying Pokemon within Sky speed range and `dz - sky` for excess. This is always <= the actual per-step cost, making the heuristic admissible.

**Verified:** Read `usePathfinding.ts:259-266`. The heuristic correctly delegates to the same cost function used by the step calculations, ensuring it never overestimates. For grounded combatants, `getElevationCost(z, toElev)` returns `Math.abs(toZ - fromZ)` which equals the minimum possible elevation cost (still admissible). For flying Pokemon, it correctly returns 0 or the excess above Sky speed. Also addresses MEDIUM-1 from rules-review-138.

### C2: isValidMove doesn't pass elevation to A* (FIXED)

**Previous issue:** `isValidMove` computed elevation cost as a flat `elevCost = calculateElevationCost(fromZ, toZ)` and added it post-hoc to the A* path cost. This missed intermediate elevation changes and the flying Pokemon Sky speed discount on per-step transitions.

**Fix (f0c7a3e):** Both `isValidMove` and `calculateTerrainAwarePathCost` now build `elevCostGetter`, `terrainElevGetter`, and `fromElev` parameters and pass them into `calculatePathCost`. The post-hoc elevation cost addition is completely removed. The A* condition was broadened to `if (terrainCostGetter || elevCostGetter)` so elevation-only grids still get proper pathfinding.

**Verified:** Read `useGridMovement.ts:258-292` (calculateTerrainAwarePathCost) and `useGridMovement.ts:330-358` (isValidMove). Both correctly construct and pass all three elevation parameters. The old `elevCost` variable and post-hoc addition are gone. The fallback path (no terrain, no elevation) only triggers when both getters are undefined. Also addresses MEDIUM-2 from rules-review-138.

### H1: Sprite cache no re-render on load (FIXED)

**Previous issue:** `loadSprite` was a standalone function outside the composable closure, so it had no access to `scheduleRender`. When sprites finished loading asynchronously, the canvas didn't redraw, leaving tokens as fallback circles until the next unrelated event.

**Fix (b3abc63):** `loadSprite` is now inside the `useIsometricRendering` composable closure. Its `onload` callback calls `scheduleRender()`, triggering a re-render when the image finishes loading. The sprite cache itself remains module-level for cross-instance sharing.

**Verified:** Read `useIsometricRendering.ts:151-173`. The `img.onload` callback at line 164 calls `scheduleRender()`. The function correctly marks the URL as loading (line 170) before starting the load, and sets the loaded image into the cache (line 164) before triggering the render.

### H2: Duplicate combatantCanFly/getSkySpeed (FIXED)

**Previous issue:** `combatantCanFly`, `getSkySpeed`, `combatantCanSwim`, and `combatantCanBurrow` were defined identically in both `useGridMovement.ts` and `useElevation.ts`.

**Fix (4d5e4e5):** All four functions extracted to `app/utils/combatantCapabilities.ts`. Both `useGridMovement.ts` and `useElevation.ts` now import from the shared utility.

**Verified:** Grep for `function combatantCanFly|function getSkySpeed|function combatantCanSwim|function combatantCanBurrow` returns only `combatantCapabilities.ts`. Both consumer files import from `~/utils/combatantCapabilities`. No duplicates remain. `useElevation.ts` re-exports `combatantCanFly` and `getSkySpeed` in its return object for convenience -- this is acceptable since it's re-exporting, not redefining.

### H3: Unbounded sprite cache (FIXED)

**Previous issue:** The sprite cache `Map` grew without bound as new Pokemon sprites were loaded across encounter changes.

**Fix (b3abc63):** Two mitigations: (1) FIFO eviction at 200 entries (`SPRITE_CACHE_MAX`) in `loadSprite`, and (2) `clearSpriteCache()` called from `IsometricCanvas.vue`'s `onUnmounted` hook.

**Verified:** Read `useIsometricRendering.ts:67-75` (SPRITE_CACHE_MAX constant and clearSpriteCache function), lines 155-159 (eviction logic), and `IsometricCanvas.vue:288` (`clearSpriteCache()` in `onUnmounted`). The 200 entry cap is reasonable for typical encounter sizes (10-20 combatants with at most a few sprite variants each).

### M1: app-surface.md not updated (FIXED)

**Fix (c758286):** Added `usePathfinding.ts`, `useIsometricInteraction.ts`, `useDepthSorting.ts`, `useElevation.ts`, `ElevationToolbar.vue`, and `combatantCapabilities.ts` to the app-surface.md.

**Verified:** Read `.claude/skills/references/app-surface.md` lines 125-129. All new composables, components, and utilities are listed under the VTT Grid section. The descriptions accurately reflect their purposes.

### M2: useRangeParser 830L > 800L limit (FIXED)

**Fix (23c0f8c):** Pathfinding functions (`calculatePathCost`, `getMovementRangeCells`, `calculateMoveCost`, `validateMovement`) and elevation types extracted to `usePathfinding.ts` (375 lines). `useRangeParser.ts` re-exports them for backwards compatibility.

**Verified:** `wc -l` shows `useRangeParser.ts` at 479 lines, `usePathfinding.ts` at 375 lines. Both well under the 800 line limit. The re-exports at `useRangeParser.ts:474-477` ensure all existing callers (useGridMovement, useGridRendering, IsometricCanvas, tests) continue to work without import changes.

**Note:** There is a circular type dependency: `usePathfinding.ts` imports `type TerrainCostGetter` from `useRangeParser.ts`, while `useRangeParser.ts` imports the `usePathfinding` function. Because the `usePathfinding` import is a type-only import (erased at compile time), this does not create a runtime circular dependency. The cleaner fix would be to move `TerrainCostGetter` to a shared types file, but this is cosmetic and not blocking.

### M3: Deep combatants watcher (FIXED)

**Fix (0ff5557):** Replaced `watch(() => props.combatants, ..., { deep: true })` with `watch(() => props.combatants.map(c => c.id), ...)` using `{ immediate: true }` (no `deep`).

**Verified:** Read `IsometricCanvas.vue:259-267`. The watcher computes a new array of IDs on each reactive tick. Vue's default equality check will detect additions/removals (array length or content changes) without deep-watching every combatant field. `applyDefaultElevation` only runs when combatant IDs change (add/remove), not on HP/status updates.

### M4: Rectangular hit test for isometric (FIXED)

**Fix (1cf2bb8):** Replaced rectangular bounding box check with a `pointInPolygon` ray-casting test against the actual isometric diamond vertices from `getTileDiamondPoints`. For multi-cell tokens, the diamond is expanded to cover the full NxN footprint. The hit area extends upward from the diamond by `cellSize * token.size * 1.1` to cover the billboarded sprite.

**Verified:** Read `useIsometricInteraction.ts:134-153` (pointInPolygon), `199-239` (getTokenAtScreenPosition). The ray-casting algorithm is a standard implementation. Diamond vertices come from the isometric projection's own geometry, ensuring consistency with rendering. The sprite height extension matches `tokenH` in the rendering code (`useIsometricRendering.ts:442`).

### M5: Movement preview Z=0 (FIXED)

**Fix (724e18e):** Replaced hardcoded `toElev = 0` with `options.getTerrainElevation(preview.toPosition.x, preview.toPosition.y)`. Added `getTerrainElevation` to `UseIsometricRenderingOptions` and wired it through from `IsometricCanvas.vue`.

**Verified:** Read `useIsometricRendering.ts:619-621` (toElev calculation) and `IsometricCanvas.vue:170` (getTerrainElevation wiring). The arrow now correctly projects to the destination cell's actual terrain elevation.

## Regression Check

1. **Backwards compatibility:** `useRangeParser` re-exports all four pathfinding functions at lines 474-477. Existing callers (useGridMovement, useGridRendering, IsometricCanvas, unit tests) continue to work through the same `useRangeParser()` interface.

2. **validateMovement elevation gap:** The `validateMovement` function in `usePathfinding.ts:171-208` does not accept elevation parameters. However, this function is only called from unit tests, not from the main application code path. The main code path uses `isValidMove` in `useGridMovement`, which correctly integrates elevation. Not a regression.

3. **File sizes:** All files are within the 800 line limit. Largest is `useIsometricRendering.ts` at 726 lines.

4. **Immutability:** `setTokenElevation` in `useElevation.ts:53-59` creates a new `Map` instead of mutating the existing one. `tokenElevations.value = newMap` is a reactive replacement. No mutation violations found.

5. **Cleanup:** `onUnmounted` in `IsometricCanvas.vue:285-289` removes both event listeners and clears the sprite cache.

6. **Commit granularity:** 9 commits, each addressing a specific issue with a clear message. The H2 extraction (4d5e4e5) preceded the C1/M2 extraction (23c0f8c) correctly, avoiding merge conflicts.

## What Looks Good

- **Admissible heuristic design.** Using the same `getElevationCost` function for both the heuristic and the step cost guarantees admissibility by construction. This is the right architectural pattern -- the heuristic can never overestimate because it uses the exact cost function that determines the true cost.

- **Clean SRP extraction.** `usePathfinding.ts` has a single, well-defined responsibility (graph search algorithms). `combatantCapabilities.ts` similarly groups pure capability queries. Both extractions reduce coupling and improve testability.

- **Elevation integration through dependency injection.** The `getElevationCostGetter` pattern in `useGridMovement.ts:258-262` binds the combatant context once and returns a pure `(fromZ, toZ) => number` function. This keeps the pathfinding code combatant-agnostic while enabling Sky speed discounts.

- **Diamond hit detection.** The point-in-polygon approach matches the rendered diamond geometry, eliminating the false-positive corners inherent in bounding-box approximations.

- **Sprite cache bounded and cleared.** The combination of FIFO eviction (200 cap) and `onUnmounted` clearing prevents both within-encounter and across-encounter memory growth.

## Verdict

**APPROVED.** All 10 issues from code-review-148 are verified fixed. Both MEDIUM issues from rules-review-138 are covered by the C1 and C2 fixes. No regressions found. No new issues identified. The fix cycle is complete and the P1 tier can proceed.
