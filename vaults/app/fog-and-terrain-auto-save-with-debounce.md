# Fog and Terrain Auto-Save with Debounce

`useFogPersistence` and `useTerrainPersistence` watch for changes to the fog and terrain Pinia stores and debounce-save them to the server (500ms delay). Fog persists to `GET/PUT /api/encounters/:id/fog` and terrain to `GET/PUT /api/encounters/:id/terrain`.

Both composables reload state when the active encounter changes. `useTerrainPersistence` also handles legacy cell migration — old terrain cells without the flag structure are upgraded to the current [[terrain-cells-combine-base-type-and-movement-flags]] format on load.

The [[vtt-container-orchestrates-toolbars-and-canvas]] initializes both persistence composables on mount.
