# Token Size Maps to Grid Footprint

`utils/sizeCategory.ts` maps PTU size categories (from the `size` field on [[species-data-model-fields]]) to NxN grid footprints: Small and Medium occupy 1×1, Large 2×2, Huge 3×3, and Gigantic 4×4. The token's `size` field on [[grid-config-type]]'s `TokenState` records this as a single number (1, 2, 3, or 4).

`getFootprintCells` enumerates all grid positions occupied by a token given its anchor position and size. `isFootprintInBounds` validates that the entire footprint fits within the grid dimensions.

Multi-tile footprints affect pathfinding ([[pathfinding-uses-flood-fill-with-ptu-diagonal-costs]]), distance measurement ([[ptu-diagonal-distance-formula]] via `ptuDistanceTokensBBox`), flanking thresholds ([[flanking-detection-scales-with-token-size]]), fog reveal ([[fog-of-war-tracks-three-cell-states]]), and marquee selection hit detection.

## See also

- [[battle-grid-token-sprites]] — tokens with `size > 1` display a size badge (e.g. "2×2")
