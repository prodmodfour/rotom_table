Terrain is represented as a set of flags per cell, not a single enum. Multiple terrain modifiers can coexist on the same cell. A cell can be both Rough (accuracy penalty) and Slow (double movement cost) simultaneously.

PTU explicitly defines Rough and Slow as overlapping but distinct: "Most Rough Terrain is also Slow Terrain, but not always." The multi-tag system supports this and future terrain combinations.

This affects the terrain painter UI, pathfinding cost calculation, and accuracy penalty checks.

## See also

- [[base-terrain-types]]
- [[slow-terrain-doubles-movement]]
- [[blocking-terrain-impassable]]
- [[water-is-basic-terrain]]
- [[path-speed-averaging]]
- [[raw-darkness-penalties-with-presets]]
- [[environment-modifies-encounter-difficulty]]
