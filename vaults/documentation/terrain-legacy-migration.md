# Terrain Legacy Migration

`migrateLegacyCell()` converts old `difficult`/`rough` terrain types to `normal` + flags (`slow`/`rough`). Import always runs migration. Runtime `setTerrain()` also converts legacy types.

The [[pinia-store-classification|terrain store]] uses `Map<string, TerrainCell>` where each cell has a base type and a `TerrainFlags` object.
