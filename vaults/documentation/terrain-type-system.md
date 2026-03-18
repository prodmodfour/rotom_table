# Terrain Type System

Six terrain types on the VTT grid, each with a movement cost multiplier:

| Type | Effect |
|---|---|
| Normal | Standard movement cost |
| Rough | Increased movement cost |
| Water | Specific cost per [[ptu-movement-rules-in-vtt|decree-008]] |
| Ice | Slippery terrain cost |
| Lava | Hazardous terrain cost |
| Blocked | Impassable; blocks [[pathfinding-algorithm|pathfinding]] |

Each cell stores a terrain type and, in isometric mode, a terrain elevation value for vertical ground height. The [[encounter-grid-state|terrain store]] uses `Map<string, TerrainCell>` per cell.

Multi-tag terrain (decree-010) allows cells with multiple terrain types. Mixed-terrain cells average their costs (decree-011).

Terrain state is persisted via encounter terrain GET/PUT endpoints (see [[vtt-grid-persistence-apis]]). The [[debounced-persistence|debounced save pattern]] handles frequent brush strokes. Legacy `difficult`/`rough` types are migrated on import (see [[terrain-legacy-migration]]).

## See also

- [[isometric-projection-math]] — terrain rendered as isometric diamonds
- [[elevation-system]] — terrain elevation brush for isometric mode
- [[depth-sorting-layers]] — terrain renders at the lowest depth layer
