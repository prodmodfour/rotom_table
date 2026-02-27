---
review_id: rules-review-162
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-001+ptu-rule-101
domain: vtt-grid
commits_reviewed:
  - 75fb072
  - 2279851
  - 0f00d30
  - b56dba8
  - 9e3d08a
  - 1e8837d
  - 96fad60
  - 0cb762d
  - 1aa6cc4
  - 0ca001a
mechanics_verified:
  - terrain-movement-costs
  - water-terrain-cost
  - rough-terrain-cost
  - slow-terrain-cost
  - multi-tag-terrain-stacking
  - blocking-terrain
  - earth-terrain
  - legacy-migration
  - elevation-terrain-flag-preservation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#terrain (p.438-489)
  - core/07-combat.md#movement (p.433-437)
  - core/05-pokemon.md#movement-capabilities
reviewed_at: 2026-02-26T21:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Slow Terrain Movement Cost

- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md`, p.471-474)
- **Implementation:** `stores/terrain.ts:162` — `if (flags.slow) { cost = cost * 2 }` in the `getMovementCost` getter. The base cost is retrieved from `TERRAIN_COSTS[terrain]` first (1 for normal, 1 for water, etc.), then doubled if the slow flag is set. In the pathfinding code (`usePathfinding.ts:104,338`), the terrain cost is used as a multiplier: `baseCost * terrainMultiplier`, where `baseCost` is the PTU diagonal step cost (1 or 2).
- **Status:** CORRECT. The cost doubling correctly models PTU's "treat every square meter as two square meters." The interaction with A* pathfinding is also correct: the returned cost from `getMovementCost` is 2 for slow terrain on a normal base, which multiplies the per-step base cost appropriately.

### 2. Water Terrain Default Cost

- **Rule:** PTU p.456-459 defines "Underwater" as a Basic Terrain Type requiring Swim capability. It is NOT listed under "Slow Terrain" or "Rough Terrain" — it is basic terrain. Per decree-008: "water terrain defaults to movement cost 1; the GM can mark specific water cells as slow terrain via the terrain painter."
- **Implementation:** `stores/terrain.ts:27` — `water: 1` in `TERRAIN_COSTS`. The previous value was 2 (double-dipping with Swim speed reduction). The `getMovementCost` getter at line 155 correctly returns `Infinity` for non-swimmers: `if (terrain === 'water' && !canSwim) return Infinity`. For swimmers, the base cost of 1 applies, and the GM can additionally set the slow flag on water cells to make specific areas cost 2 (for rapids, deep currents, etc.).
- **Status:** CORRECT. Faithfully implements decree-008. Water is basic terrain (cost 1). Non-swimmers are blocked (Infinity). Slow water is an explicit GM choice via multi-tag flags, not a default.

### 3. Rough Terrain Accuracy Penalty

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md`, p.476-485). Note: rough terrain affects ACCURACY only, not movement cost. "Most Rough Terrain is also Slow Terrain, but not always."
- **Implementation:** The `TerrainFlags` interface at `types/spatial.ts:67` correctly defines: `rough: boolean; // -2 accuracy penalty`. The terrain store provides `isRoughAt` getter at `stores/terrain.ts:182-185` for checking the rough flag at any cell. The `getMovementCost` getter correctly does NOT add any cost for the rough flag — only the slow flag doubles cost. The rough flag is visually distinct in rendering (jagged line pattern in 2D, colored diamond overlay in isometric).
- **Status:** CORRECT. Rough terrain correctly separated from movement cost calculation. The rough flag only affects accuracy, not movement, matching PTU exactly. The comment at `types/spatial.ts:65` explicitly notes this: "rough affects accuracy only, slow affects movement cost only."

### 4. Multi-Tag Terrain Stacking (decree-010)

- **Rule:** PTU p.476: "Most Rough Terrain is also Slow Terrain, but not always." Per decree-010: "Use multi-tag terrain system where cells can have multiple terrain flags simultaneously."
- **Implementation:** The `TerrainFlags` interface (`types/spatial.ts:66-69`) has independent `rough` and `slow` booleans. Each `TerrainCell` (`types/spatial.ts:73-79`) has a base `type` (TerrainType) plus `flags` (TerrainFlags). The terrain store's `applyTool` action (`stores/terrain.ts:264-275`) passes both `paintMode` and `paintFlags` independently. The `TerrainPainter.vue` component has a separate "Movement Flags" section with independent toggle buttons for rough and slow (lines 36-63), separate from the base terrain type selector (lines 17-33).
- **Status:** CORRECT. A cell can be water + rough + slow simultaneously. A cell can be normal + rough (rough without slow). This correctly models PTU's distinction between rough and slow as independent properties.

### 5. Blocking Terrain

- **Rule:** "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions." (`core/07-combat.md`, p.487-489)
- **Implementation:** `stores/terrain.ts:26` — `blocking: Infinity` in `TERRAIN_COSTS`. The `getMovementCost` getter early-returns `Infinity` at line 154: `if (terrain === 'blocking') return Infinity`. The `isPassable` getter returns `false` at line 174. Pathfinding code in `usePathfinding.ts:89` skips cells with `!isFinite(terrainMultiplier)`.
- **Status:** CORRECT. Blocking terrain is completely impassable.

### 6. Earth Terrain

- **Rule:** "Earth Terrain is underground terrain that has no existing tunnel that you are trying to Shift through. You may only Shift through Earth Terrain if you have a Burrow Capability." (`core/07-combat.md`, p.451-454)
- **Implementation:** `stores/terrain.ts:28` — `earth: Infinity` in `TERRAIN_COSTS` (blocking by default). The `getMovementCost` getter at line 156 checks: `if (terrain === 'earth') return canBurrow ? 1 : Infinity`. The `isPassable` getter at line 176 similarly checks burrow capability.
- **Status:** CORRECT. Earth terrain requires burrow capability, otherwise impassable. Cost is 1 for burrowers, matching basic terrain behavior.

### 7. Legacy Migration

- **Rule:** No PTU rule — this is a data migration concern. The old single-type system used 'difficult' (= slow) and 'rough' (= rough flag) as terrain types. The new system uses 'normal' base type + flags.
- **Implementation:** The `migrateLegacyCell` function (`stores/terrain.ts:59-114`) handles three cases:
  1. Cell with existing flags + legacy type: migrates `'difficult'` to `normal + slow:true`, `'rough'` to `normal + rough:true`, preserving existing flags.
  2. Cell without flags + legacy type: migrates with appropriate flags set.
  3. Non-legacy type without flags: adds `DEFAULT_FLAGS` (both false).
  The `importState` action at line 356-361 calls `migrateLegacyCell` for every cell during import. The persistence layer (`useTerrainPersistence.ts:10`) accepts `flags?: TerrainFlags` as optional, allowing backward compat with legacy data.
- **Status:** CORRECT. Migration preserves game state correctly. Legacy 'difficult' becomes normal+slow (same movement cost behavior). Legacy 'rough' becomes normal+rough (same accuracy penalty behavior). No data loss.

### 8. Elevation + Terrain Flag Preservation

- **Rule:** No direct PTU rule — this is an implementation correctness concern. When terrain elevation changes, the terrain type and flags must be preserved.
- **Implementation:** `useElevation.ts:121-128` — `setTerrainElevation` reads the existing cell, extracts `type`, `flags`, and `note`, then calls `terrainStore.setTerrain(x, y, terrainType, flags, clamped, note)`. This correctly preserves all cell properties when only changing elevation.
- **Status:** CORRECT. Commit `1aa6cc4` specifically fixed this — the previous implementation likely lost flags when setting elevation. Now all cell properties (type, flags, note) are read and passed through.

### 9. Cost Stacking: Slow Flag on Water

- **Rule:** Per decree-008, water has base cost 1. Per PTU p.468-469, slow terrain "treats every square meter as two square meters." If a GM marks a water cell as slow, the cost should be 2 (1 * 2).
- **Implementation:** `stores/terrain.ts:149-166` — The `getMovementCost` getter first handles blocking/water/earth special cases, then applies the base cost from `TERRAIN_COSTS`, and finally doubles it if `flags.slow` is true. For water with slow flag: base cost = 1 (from TERRAIN_COSTS.water), then doubled to 2 by slow flag. This matches the intended behavior from decree-008: "For rough currents, rapids, or whirlpools, the GM uses the terrain painter to overlay slow terrain on water cells."
- **Status:** CORRECT. The cost stacking works as intended. Water defaults to 1, but GM can make it 2 by adding slow flag.

### 10. Rendering: Visual Distinction Between Flags and Base Types

- **Rule:** No direct PTU rule — UI/UX concern. Players must be able to distinguish rough terrain from slow terrain and base types visually.
- **Implementation:**
  - 2D rendering (`useGridRendering.ts:193-252`): Base terrain drawn first with `TERRAIN_COLORS` fill + terrain-specific patterns. Then flag overlays drawn on top: slow flag gets semi-transparent brown overlay + dot indicators in bottom-left corner; rough flag gets semi-transparent khaki overlay + jagged line indicator in top-right corner.
  - Isometric rendering (`useIsometricOverlays.ts:203-257`): Same layering — base terrain diamond + pattern drawn first, then flag overlay diamonds on top (slow: brown fill, rough: khaki fill).
  - Legend in TerrainPainter (`TerrainPainter.vue:253-262`): Shows rough as "-2 acc" and slow as "2x cost", correctly reflecting their PTU effects.
- **Status:** CORRECT. Players can visually identify which cells have which flags. The overlay system supports seeing both flags simultaneously on any base terrain type.

## Summary

The multi-tag terrain refactoring correctly implements PTU 1.05 terrain mechanics per decree-008 and decree-010. The key changes are:

1. **Water cost 1** (decree-008): Correctly changed from 2 to 1. Non-swimmers are still blocked. Slow flag can be added for rough water.
2. **Multi-tag flags** (decree-010): Cells correctly support independent rough and slow flags on top of any base terrain type. Rough affects accuracy only, slow affects movement cost only.
3. **Cost calculation**: The `getMovementCost` getter correctly applies base cost first, then doubles for slow flag. Rough flag has zero effect on movement cost.
4. **Legacy migration**: Old 'difficult' and 'rough' terrain types correctly converted to normal+flags equivalents.
5. **Elevation preservation**: Terrain flags preserved when elevation changes.
6. **Pathfinding integration**: A* and flood-fill algorithms correctly use the new cost calculation through `getTerrainCostForCombatant` and `getTerrainCostGetter`.

## Rulings

1. **Rough terrain accuracy penalty scope**: The `isRoughAt` getter in the terrain store correctly exposes the rough flag for accuracy checking. However, the current `getRoughTerrainPenalty` function in `useMoveCalculation.ts` only checks enemy-occupied squares for the rough penalty — it does NOT check the terrain store's rough flag for cells along the line of sight. This means painting a cell as "rough" in the terrain painter does not currently apply the -2 accuracy penalty when targeting through it. This is a pre-existing limitation (not a regression from this refactoring) and is tracked as a P2 gap in the VTT grid matrix (`R015`). **Not a blocker for this review** since the refactoring correctly provides the `isRoughAt` API needed for future implementation.

2. **Slow flag on non-normal base types**: The cost doubling applies universally to any base terrain type with the slow flag. For example, a hazard cell with slow flag would cost 2 instead of 1. This is reasonable and consistent — PTU's slow terrain modifier can logically apply to any surface type.

## Verdict

**APPROVED** — All terrain mechanics are correctly implemented per PTU 1.05 and the applicable decrees. No critical or high issues found. Two medium observations noted below but neither blocks approval.

## Medium Observations

### M1: Rough terrain accuracy penalty not integrated with terrain store (pre-existing, not regression)

- **Severity:** MEDIUM
- **File:** `app/composables/useMoveCalculation.ts:149-226`
- **Detail:** `getRoughTerrainPenalty` only checks enemy-occupied squares, not terrain-store rough cells. When a cell is painted as rough via TerrainPainter, targeting through it should incur a -2 accuracy penalty per PTU p.476-478. This is a pre-existing gap, not introduced by this refactoring. The refactoring correctly provides `isRoughAt()` in the terrain store for future integration. Tracked as P2 in `vtt-grid-matrix.md` (R015).
- **Action:** No action required for this review. Future ticket should integrate `terrainStore.isRoughAt` into the accuracy penalty calculation.

### M2: Naturewalk capability not checked against terrain flags (pre-existing, not regression)

- **Severity:** MEDIUM
- **File:** `app/stores/terrain.ts`, `app/composables/useGridMovement.ts`
- **Detail:** PTU p.209 (errata p.479-480): "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." This means Naturewalk should bypass rough/slow penalties for specific terrain types (Forest, Grassland, etc.). The movement system does not check Naturewalk capabilities. This is a pre-existing limitation tracked in `vtt-grid-matrix.md` (R017, P2). The multi-tag refactoring does not make this worse and actually makes future implementation easier since the flags are now discrete and checkable.
- **Action:** No action required for this review. Future ticket should add per-Pokemon Naturewalk checking against terrain flags.
