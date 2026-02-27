---
ticket_id: feature-002
title: "3D Isometric Rotatable Grid for VTT"
category: FEATURE
priority: P2
status: in-progress
domain: vtt-grid
design_spec: design-isometric-grid-001
---

# Feature: 3D Isometric Rotatable Grid for VTT

## Description

Replace the current 2D flat Canvas grid with a 3D isometric grid supporting Z-axis elevation and camera rotation. Uses pure Canvas 2D with isometric projection math (no external libraries). The isometric math layer sits between the existing game logic (stores, pathfinding) and the canvas drawing code.

## Phases

- **P0: Rendering Engine + Basic Grid** (implemented)
- **P1: Token Interaction + Movement** (implemented, fix cycle complete)
- **P2: Feature Parity (Fog, Terrain, Measurement)** (implemented)

## P0 Acceptance Criteria

- [x] Isometric grid renders with diamond-shaped cells
- [x] Grid dimensions match encounter's gridWidth x gridHeight
- [x] Camera rotates 90 degrees with Q/E keys or buttons
- [x] Background map renders on ground plane
- [x] Zoom and pan work in isometric mode
- [x] Feature flag toggle between 2D and isometric in grid settings
- [ ] Performance: 60fps on a 40x30 grid with no tokens (needs live testing)

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-23 | P0 implemented | 11 commits on slave/2-dev-feature-002-p0-20260223-083000 |
| 2026-02-23 | P0 code-review-140 fixes | 8 commits on slave/2-dev-feature-002-fix-20260223-095000 |
| 2026-02-23 | P1 implemented | 10 commits on slave/2-dev-feature-002-p1 |
| 2026-02-23 | P1 code-review-148 fixes | 8 commits on slave/2-dev-feature-002-p1-fix-20260223-141341 |
| 2026-02-24 | P2 implemented | 8 commits on slave/3-dev-feature-002-p2-20260224-171710 |
| 2026-02-24 | P2 code-review-154 fixes | 7 commits on slave/3-dev-feature-002-p2-fix-20260224-173734 |
| 2026-02-25 | P2 code-review-157 fix | 1 commit on slave/1-dev-feature-002-p2-fix2-20260224-210000 |

### P2 Fix Cycle (code-review-154)

| Commit | Issue | Description |
|--------|-------|-------------|
| 2843435 | C1 | fix: use terrain elevation for 3D distance computation in isometric mode |
| 46ef2d2 | H1 | fix: wire elevation level into terrain painting flow |
| f25a625 | H2 | fix: mount TerrainPainter component in VTTContainer for isometric mode |
| e5dd935 | H3 | docs: document camera angle correctness for terrain side face rendering |
| 3a0ebc0 | M1 | docs: add useIsometricOverlays and TerrainPainter to app-surface |
| 927d5bd | M2 | perf: narrow deep watchers in IsometricCanvas to rendering-relevant state |
| e987ed5 | M3 | fix: derive side face color from terrain type instead of hardcoded black |

### P2 Fix Cycle Files Changed

**Modified files (5):**
- `app/components/vtt/VTTContainer.vue` (C1: terrain elevation 3D distance; H2: mount TerrainPainter)
- `app/components/vtt/IsometricCanvas.vue` (C1: expose getTerrainElevation; H1: pass brushElevation to interaction; M2: narrow watchers)
- `app/stores/terrain.ts` (H1: applyTool accepts elevation parameter)
- `app/composables/useIsometricInteraction.ts` (H1: pass terrain paint elevation to applyTool)
- `app/composables/useIsometricOverlays.ts` (H3: camera angle doc comment; M3: terrain-derived side face colors)
- `.claude/skills/references/app-surface.md` (M1: add useIsometricOverlays and TerrainPainter)

### P2 Fix Cycle 2 (code-review-157)

| Commit | Issue | Description |
|--------|-------|-------------|
| 52ca518 | H-NEW | fix: pass terrain paint elevation to drag painting handler |

### P2 Fix Cycle 2 Files Changed

**Modified files (1):**
- `app/composables/useIsometricInteraction.ts` (H-NEW: pass terrainPaintElevation to applyTool during drag painting)

### P1 Fix Cycle (code-review-148)

| Commit | Issue | Description |
|--------|-------|-------------|
| b79aa84 | H2 | refactor: extract combatantCanFly and getSkySpeed to shared utility |
| 5c5fe68 | M2+C1 | refactor: extract pathfinding from useRangeParser into usePathfinding (fixes admissible heuristic) |
| d3cbb0e | C2 | fix: pass elevation cost to A* pathfinding in isValidMove |
| 5d71f46 | H1+H3 | fix: sprite cache re-render on load and bounded memory growth |
| 3a4d6fd | M3 | perf: watch combatant IDs only for default elevation assignment |
| d19e3bb | M4 | fix: use diamond-shaped hit detection for isometric token picking |
| f593a32 | M5 | fix: movement preview arrow uses terrain elevation at destination |
| 65f41b3 | M1 | docs: add VTT grid composables, components, and utilities to app-surface |

### P1 Fix Cycle Files Changed

**New files (2):**
- `app/utils/combatantCapabilities.ts` (H2: shared combatant capability functions)
- `app/composables/usePathfinding.ts` (M2: extracted pathfinding with admissible heuristic fix)

**Modified files (6):**
- `app/composables/useGridMovement.ts` (C2: elevation-aware A* calls; H2: import shared utils)
- `app/composables/useElevation.ts` (H2: import shared utils)
- `app/composables/useRangeParser.ts` (M2: delegate to usePathfinding, re-export for compat)
- `app/composables/useIsometricRendering.ts` (H1: scheduleRender on sprite load; H3: cache eviction; M5: terrain elevation for preview arrow)
- `app/composables/useIsometricInteraction.ts` (M4: diamond-shaped point-in-polygon hit test)
- `app/components/vtt/IsometricCanvas.vue` (H3: clearSpriteCache on unmount; M3: shallow combatant watcher; M5: pass getTerrainElevation)

### P0 Fix Cycle (code-review-140)

| Commit | Issue | Description |
|--------|-------|-------------|
| 91ae123 | C1 | fix: add isometric fields to EncounterRecord interface, remove all as-any casts |
| 5ff32c8 | H1 | fix: add server-side validation for isometric grid fields |
| 0e60ba6 | H2 | fix: propagate isometric fields through encounter template endpoints |
| d64341b | H3 | fix: replace anonymous contextmenu listener with Vue template directive |
| 07a7319 | H4 | fix: correct bounding box off-by-one in getGridOriginOffset |
| d4b5948 | M1 | refactor: remove dead rotation animation infrastructure |
| aaa3b7c | M2 | perf: cache depth-sorted cell array in useIsometricRendering |
| e87c5e5 | M3 | perf: combine fill and stroke into single canvas path in drawDiamondCell |

### P0 Fix Cycle Files Changed

- `app/server/services/encounter.service.ts` (C1: added fields to EncounterRecord, removed as-any casts)
- `app/server/api/encounters/[id]/grid-config.put.ts` (C1: removed as-any casts; H1: added validation)
- `app/server/api/encounter-templates/from-encounter.post.ts` (H2: copy isometric fields to template)
- `app/server/api/encounter-templates/[id]/load.post.ts` (H2: include isometric fields from template)
- `app/components/vtt/IsometricCanvas.vue` (H3: contextmenu directive; M1: removed rotationProgress watcher)
- `app/composables/useIsometricProjection.ts` (H4: fixed bounding box corners)
- `app/composables/useIsometricCamera.ts` (M1: removed animation infrastructure)
- `app/composables/useIsometricRendering.ts` (M1: removed rotationProgress option; M2: cached sorted cells; M3: single path fill+stroke)

### P2 Commits

| Commit | Description |
|--------|-------------|
| 382e681 | feat: add isometric overlay rendering for fog, terrain, and measurement |
| 6bd433b | feat: add R key for measurement direction cycling in isometric mode |
| 364db48 | feat: add isometric rendering to GroupGridCanvas with camera sync |
| 29c7ac2 | feat: show full elevation and measurement info in isometric coordinate display |
| 297e433 | feat: add 3D distance display to MeasurementToolbar in isometric mode |
| 25886fc | feat: add camera angle selector to isometric grid settings |
| 30f0325 | feat: add elevation brush option to TerrainPainter for isometric mode |
| 8392597 | feat: add terrain elevation rendering with 3D side faces |

### P2 Files Changed

**New files (1):**
- `app/composables/useIsometricOverlays.ts` (478 lines) — fog, terrain, measurement rendering as isometric diamond overlays

**Modified files (8):**
- `app/composables/useIsometricRendering.ts` — delegated P2 overlays to useIsometricOverlays, added overlay options interface
- `app/composables/useIsometricInteraction.ts` — added R key for measurement direction cycling
- `app/components/vtt/IsometricCanvas.vue` — wired fog/terrain/measurement stores, added state change watchers
- `app/components/vtt/GroupGridCanvas.vue` — added IsometricCanvas for isometric group view with camera sync
- `app/components/vtt/CoordinateDisplay.vue` — added isIsometric prop for full elevation display
- `app/components/vtt/MeasurementToolbar.vue` — added 3D distance and elevation delta display
- `app/components/vtt/GridSettingsPanel.vue` — added camera angle selector dropdown
- `app/components/vtt/TerrainPainter.vue` — added elevation brush option for isometric mode
- `app/components/vtt/VTTContainer.vue` — wired 3D distance props to MeasurementToolbar

### P0 Commits

| Commit | Description |
|--------|-------------|
| 57fbe6c | feat: add CameraAngle type and isometric fields to GridConfig |
| f0f096d | feat: add isometric grid columns to Prisma schema and server endpoints |
| d11af9c | feat: add useIsometricProjection composable with projection math |
| 98fb80e | feat: add isometricCamera Pinia store for shared camera state |
| 2bf4501 | feat: add useIsometricCamera composable for camera control |
| 64232d7 | feat: add useIsometricRendering composable for grid render loop |
| 1ceb1f4 | feat: add CameraControls component for isometric rotation |
| f3fb768 | feat: add IsometricCanvas component with camera controls and pan/zoom |
| 5398162 | feat: wire isometric feature flag in VTTContainer and GridSettingsPanel |
| aa5b15e | fix: correct diamond tile geometry and rendering performance |
| abb8dd4 | fix: reuse projection composable instance in IsometricCanvas |

### P0 Files Changed

**New files (6):**
- `app/composables/useIsometricProjection.ts` (206 lines)
- `app/composables/useIsometricCamera.ts` (148 lines)
- `app/composables/useIsometricRendering.ts` (256 lines)
- `app/stores/isometricCamera.ts` (64 lines)
- `app/components/vtt/IsometricCanvas.vue` (298 lines)
- `app/components/vtt/CameraControls.vue` (105 lines)

**Modified files (6):**
- `app/types/spatial.ts` (+8 lines)
- `app/prisma/schema.prisma` (+10 lines)
- `app/server/services/encounter.service.ts` (+5 lines)
- `app/server/api/encounters/[id]/grid-config.put.ts` (+6 lines)
- `app/components/vtt/VTTContainer.vue` (+39 lines)
- `app/components/vtt/GridSettingsPanel.vue` (+45 lines)
