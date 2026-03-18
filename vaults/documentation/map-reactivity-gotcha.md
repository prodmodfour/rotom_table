# Map Reactivity Gotcha

The `fogOfWar` and `terrain` stores in [[pinia-store-classification]] use `Map<string, T>` for cell state. Vue tracks the Map reference but not individual entries.

Mutations via `.set()` / `.delete()` work because Pinia's reactive proxy intercepts them. However, replacing the entire Map (e.g., during `importState`) triggers a full re-render of all dependent components.

## See also

- [[fog-of-war-system]] — uses `Map<string, FogState>`
- [[terrain-type-system]] — uses `Map<string, TerrainCell>`
