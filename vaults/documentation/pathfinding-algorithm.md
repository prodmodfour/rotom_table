# Pathfinding Algorithm

A* pathfinding with PTU movement rules in `usePathfinding`.

**`getMovementRangeCells`** — Flood-fill algorithm finds all reachable cells within a speed budget. Accounts for:

- [[terrain-type-system|Terrain costs]] (6 types with multipliers)
- [[elevation-system|Elevation change costs]] (1 MP per level difference)
- Alternating diagonal cost (1m/2m pattern per [[grid-distance-calculation]])
- [[multi-cell-token-footprint]] — iterates full NxN footprint at each step
- Blocked cells (terrain type or occupied by other tokens)

Flying Pokemon (Sky > 0 via [[combatant-movement-capabilities]]) ignore elevation costs within their Sky speed.

**Inputs:** Origin position, speed budget, blocked cells set, terrain cost getter, elevation cost getter, terrain elevation getter.

**Outputs:** Set of reachable cell positions, path to any specific target.

A* terrain costs come from the Pinia terrain store — the store must be populated before pathfinding runs (see [[composable-dependency-chains]]).

## See also

- [[ptu-movement-rules-in-vtt]] — the PTU rules this algorithm enforces
- [[movement-modifiers-utility]] — Stuck/Slowed/Sprint applied to speed budget before pathfinding
