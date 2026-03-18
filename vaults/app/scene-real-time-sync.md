# Scene Real-Time Sync

Scene mutations broadcast WebSocket events to group and player clients when the scene is active. Nine event types cover all scene operations: `scene_update`, `scene_pokemon_added`, `scene_pokemon_removed`, `scene_character_added`, `scene_character_removed`, `scene_positions_updated`, `scene_group_created`, `scene_group_updated`, `scene_group_deleted`. Two additional events — `scene_activated` and `scene_deactivated` — broadcast directly from the activate/deactivate API routes.

Within the same browser, a `BroadcastChannel` named `ptu-scene-sync` coordinates state between GM tabs (e.g., if the GM has the [[scene-editor-page]] and the [[scene-manager-page]] open simultaneously).

The player view receives a stripped-down payload (`SceneSyncPayload`) that omits positions, terrains, and modifiers — players see entity lists but not spatial layout.

## See also

- [[group-view-websocket-sync]] — the group view's WebSocket handler that consumes these events
