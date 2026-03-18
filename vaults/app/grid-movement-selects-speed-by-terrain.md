# Grid Movement Selects Speed by Terrain

`useGridMovement` is the central movement composable shared by both rendering modes. When a token moves, it selects the appropriate PTU speed capability based on the terrain along the path: overland for normal/elevated cells, swim for water cells, burrow for earth cells. If a combatant lacks the required speed (e.g. no Swim capability on a water cell), the cell is impassable.

The composable also applies PTU speed averaging: when a path crosses multiple terrain types, the final speed is the average of applicable speeds. Movement modifiers (Stuck, Slowed, Sprint, Thermosensitive weather halving, combat stages) are applied on top.

For mounted pairs and Living Weapons, the movement pool is shared — both entities consume from the same budget.

## See also

- [[pathfinding-uses-flood-fill-with-ptu-diagonal-costs]] — the algorithm that calculates reachable cells
- [[terrain-cells-combine-base-type-and-movement-flags]] — the terrain data that drives speed selection
- [[elevation-cost-charges-per-level-change]] — the Z-axis cost added to XY movement
