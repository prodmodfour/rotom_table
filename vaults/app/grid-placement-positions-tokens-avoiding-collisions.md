The grid placement service (`app/server/services/grid-placement.service.ts`) auto-places combatant tokens on the encounter grid when adding combatants, spawning wild Pokemon, or generating encounters from scenes.

Tokens are placed into side-specific columns: players get columns 1-4, allies get 5-8, and enemies get the rightmost columns (calculated as offsets from `gridWidth`). The service maintains a set of occupied cells and checks every candidate position for collisions.

Multi-tile tokens (Large, Huge, Gigantic) occupy NxN cells. The `sizeToTokenSize()` function maps PTU size capabilities to grid cell counts: Small and Medium are 1, Large is 2, Huge is 3, Gigantic is 4. The `canFit()` check verifies that all cells in the NxN area are within bounds and unoccupied.

Placement uses a two-pass strategy: first try the side's designated columns, then fall back to anywhere on the grid. The `occupiedCells` set is mutated after each placement so successive calls correctly avoid already-placed tokens.

## See also

- [[encounter-api-has-50-plus-combat-endpoints]] — combatants.post uses this for auto-placement
- [[token-size-maps-to-ptu-size-capability]] — the UI rendering of multi-tile tokens
