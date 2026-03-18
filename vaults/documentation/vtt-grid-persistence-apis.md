# VTT Grid Persistence APIs

Server endpoints under `app/server/api/encounters/[id]/` for persisting VTT grid state:

**Position** (`position.post.ts`) — Updates a token's grid position. Also handles [[mounting-system|mounted]] partner movement (both tokens move together, decrementing `movementRemaining`).

**Grid config** (`grid-config.put.ts`) — Updates grid dimensions, cell size, and grid mode (2D/isometric).

**Background** (`background.post.ts`, `background.delete.ts`) — Upload or remove the grid background image.

**Fog of war** (`fog.get.ts`, `fog.put.ts`) — Get/put [[fog-of-war-system|fog state]] as a 2D array of FogState values. Persisted on the Encounter model.

**Terrain** (`terrain.get.ts`, `terrain.put.ts`) — Get/put [[terrain-type-system|terrain state]] as a 2D array of terrain types and elevations. Persisted on the Encounter model.

Fog and terrain writes use the [[debounced-persistence|debounced save pattern]] on the client to batch rapid brush strokes.

## See also

- [[encounter-grid-state]] — the client stores these endpoints serve
- [[movement-preview-sync]] — real-time position sync via WebSocket (not REST)
