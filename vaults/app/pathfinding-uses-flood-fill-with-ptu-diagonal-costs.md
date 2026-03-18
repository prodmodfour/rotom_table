# Pathfinding Uses Flood-Fill with PTU Diagonal Costs

`usePathfinding` provides the movement range calculation used to highlight reachable cells on the [[battle-grid]]. It uses a Dijkstra-like flood-fill from the token's position, expanding outward until the movement budget is exhausted.

Each step's cost follows the [[ptu-diagonal-distance-formula]]: diagonal moves alternate between 1m and 2m cost. The flood-fill tracks diagonal parity per path so the alternation is correct. Terrain costs from [[terrain-cells-combine-base-type-and-movement-flags]] (slow terrain doubles cost) and elevation costs from [[elevation-cost-charges-per-level-change]] are additive.

For multi-tile tokens ([[token-size-maps-to-grid-footprint]]), each candidate step checks all NxN cells in the footprint for blocked/out-of-bounds conditions.

The composable also provides A* pathfinding for computing optimal paths and `getMovementRangeCellsWithAveraging` for PTU speed averaging across terrain types.
