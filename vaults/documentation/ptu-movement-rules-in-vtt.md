# PTU Movement Rules in VTT

The [[vtt-rendering-pipeline|VTT grid code]] enforces these PTU rules (referenced by decree IDs):

- **Diagonal movement** (decree-002): Alternating 1m/2m cost pattern
- **Token blocking** (decree-003): Occupied cells block pathing for large tokens
- **Cone width** (decree-007): PTU cone shape geometry
- **Water terrain cost** (decree-008): Specific movement cost for water cells
- **Diagonal lines** (decree-009): Shortened via `maxDiagonalCells()` — line AoE diagonal limit
- **Multi-tag terrain** (decree-010): Cells with multiple terrain types
- **Mixed-terrain averaging** (decree-011): Cost averaging across multi-terrain cells
- **Burst AoE diagonal** (decree-023): Burst area calculation with diagonals
- **Diagonal cone corner** (decree-024): Corner-cell inclusion for cone shapes
- **Rough terrain endpoint exclusion** (decree-025): Accuracy penalty scope
- **Edge-to-edge distance** (decree-002): `ptuDistanceTokensBBox()` for [[multi-cell-token-footprint|multi-cell token]] distance
- **Flanking after evasion cap** (decree-040): Flanking penalty application

**Movement modifiers** (codified in `app/utils/movementModifiers.ts`): Stuck=0, Tripped=0, Slowed=half, Sprint=+50%, Disengaged=max 1m.

**AoO detection:** Shift-away trigger check in `useGridMovement` (lines 599-671).

Player mode restrictions: `playerMode` prop on GridCanvas hides enemy HP, restricts token selection to own tokens, limits movement to current-turn token only.

## See also

- [[pathfinding-algorithm]] — A* implementation of these movement rules
- [[terrain-type-system]] — the 6 terrain types with movement costs
- [[combatant-movement-capabilities]] — fly/swim/burrow capability queries
- [[elevation-system]] — vertical movement cost rules
