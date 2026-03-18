# Scene WebSocket Events

Thirteen [[websocket-real-time-sync|WebSocket events]] for scene synchronization, grouped by trigger.

## Entity Change Broadcasts

Nine functions in `server/utils/websocket.ts` using `broadcastToGroupAndPlayers`:

- `scene_update` — any scene field change
- `scene_pokemon_added` / `scene_pokemon_removed`
- `scene_character_added` / `scene_character_removed`
- `scene_positions_updated` — batch position change
- `scene_group_created` / `scene_group_updated` / `scene_group_deleted`

Each is triggered by the corresponding [[scene-api-endpoints|API endpoint]].

## Activation Broadcasts

Called directly in the [[scene-activation-lifecycle|activate/deactivate]] API handlers:

- `scene_activated` — full scene data payload
- `scene_deactivated` — scene ID only

## Player Sync Events

- `scene_sync` — server-to-player: enriched scene data with `isPlayerCharacter` and `ownerId` flags. Sent on player `identify` and on `scene_request`.
- `scene_request` — player-to-server: requests current active scene for [[player-reconnection-sync|reconnection recovery]]. Server responds with `scene_sync`.

## See also

- [[websocket-store-sync]] — how these events update Pinia stores
- [[player-scene-view]] — player-side consumption of scene_sync
- [[group-view-scene-interaction]] — group-side event routing
