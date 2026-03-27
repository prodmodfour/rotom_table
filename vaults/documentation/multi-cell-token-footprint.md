# Multi-Cell Token Footprint

Tokens with `size > 1` occupy NxN grid cells on the [[vtt-rendering-pipeline|VTT]].

- Pathfinding iterates the full footprint at each step.
- Blocking checks must account for all occupied cells.
- Edge-to-edge distance uses `ptuDistanceTokensBBox()` per decree-002.
- The grid-placement service maps entity size to token size for auto-placement.

## See also

- [[three-coordinate-spaces]]
