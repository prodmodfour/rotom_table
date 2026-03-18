# Group View Store Manages Wild Spawn and Map

The `useGroupViewStore` Pinia store manages two pieces of transient group view state: the wild spawn preview and the served map. This is separate from the [[group-view-tab-state]] store which handles tab switching and scene management.

The store holds `wildSpawnPreview` (a `WildSpawnPreview` or null) and `servedMap` (a `ServedMap` or null), plus shared `loading` and `error` state.

Wild spawn actions:
- `fetchWildSpawnPreview()` — GET from `/api/group/wild-spawn`
- `serveWildSpawn(pokemon, tableName)` — POST to create a preview
- `clearWildSpawnPreview()` — DELETE to dismiss

Map actions:
- `fetchServedMap()` — GET from `/api/group/map`
- `serveMap(map)` — POST to serve a map
- `clearServedMap()` — DELETE to dismiss

Both also have direct setters (`setWildSpawnPreview`, `setServedMap`) for local updates without API calls.

The `ServedMap` interface defines locations with typed markers (town, forest, castle, path, river, landmark) and connections between them (road, path, river, aqueduct). Both wild spawn and map state are [[wild-spawn-and-map-use-server-in-memory-singletons]].

## See also

- [[group-view-wild-spawn-overlay]] — the UI that renders the wild spawn preview
- [[group-view-map-tab]] — the UI that renders the served map

- [[all-stores-use-pinia-options-api]]
- [[stores-instantiate-lazily-per-page]]