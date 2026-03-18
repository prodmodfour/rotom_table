# Scene API Endpoints

REST endpoints under `/api/scenes` for [[scene-data-model|scene]] management. All mutating endpoints on active scenes broadcast [[scene-websocket-events|WebSocket events]] to group and player clients.

**CRUD:** GET/POST `/api/scenes` (list, create). GET/PUT/DELETE `/api/scenes/:id` (read, update, delete). GET `/api/scenes/active` returns the active scene enriched with `isPlayerCharacter` and `ownerId` flags.

**Serve:** POST `.../activate`, `.../deactivate` — triggers [[scene-activation-lifecycle|full activation lifecycle]] including [[scene-end-ap-restoration|AP restoration]].

**Entity management:** POST/DELETE `.../characters/:charId`, `.../pokemon/:pokemonId`. Validates uniqueness on add. Manipulates JSON arrays in the Scene record.

**Groups:** POST `.../groups` (create with auto-offset), PUT/DELETE `.../groups/:groupId` (update, delete). See [[scene-group-system]].

**Positions:** PUT `.../positions` — batch update positions and `groupId` assignments for pokemon, characters, and groups.

## See also

- [[api-endpoint-layout]]
- [[scene-components]]
- [[scene-websocket-events]]
- [[scene-data-model]]
