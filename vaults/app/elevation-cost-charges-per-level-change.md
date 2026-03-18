# Elevation Cost Charges per Level Change

`calculateElevationCost` in `useGridMovement` charges 1 movement point per level of elevation change (absolute value of `fromZ - toZ`), additive to the XY movement cost. This applies to both token elevation and terrain elevation in isometric mode.

Flying Pokemon (those with Sky speed > 0) are exempt from elevation cost up to their Sky speed value. If the elevation change exceeds Sky speed, they pay only for the excess.

`useElevation` manages per-token elevation state (default elevation for flying Pokemon is based on Sky speed) and terrain elevation (settable via the elevation brush in [[terrain-painter-supports-four-tool-modes]]). Elevation data is imported/exported alongside terrain for persistence.

## See also

- [[grid-movement-selects-speed-by-terrain]] — elevation cost is added on top of terrain-based movement
- [[pathfinding-uses-flood-fill-with-ptu-diagonal-costs]] — the flood-fill includes elevation cost in its budget
- [[battle-grid-coordinate-display]] — shows Z elevation in isometric mode
