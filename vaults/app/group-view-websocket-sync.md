# Group View WebSocket Sync

The [[group-view-page]] sets up a WebSocket connection that listens for real-time events from the server. On connect, it sends a `tab_sync_request` to get the current state.

The composable routes incoming messages to the [[group-view-tab-state]] store based on event type:
- `tab_change` / `tab_state` — switches the active tab
- `scene_activated` / `scene_deactivated` / `scene_update` / `scene_positions_updated` — updates the scene display
- `scene_character_added` / `scene_character_removed` / `scene_pokemon_added` / `scene_pokemon_removed` — modifies scene entities
- `scene_group_created` / `scene_group_updated` / `scene_group_deleted` — manages scene groups

The [[group-view-encounter-tab]] additionally joins the encounter WebSocket room as `'group'` to receive movement previews and flanking data.

The WebSocket also carries [[player-group-view-tab-request]] messages: player requests are forwarded to the GM, and GM responses are routed back to the requesting player.

## See also

- [[group-view-polls-as-websocket-fallback]] — polling that supplements these events
- [[scene-real-time-sync]] — the server-side broadcast that feeds these events
- [[websocket-handler-routes-messages-by-type]] — the server-side switch statement that dispatches these messages
- [[websocket-peer-map-tracks-connected-clients]] — the peer tracking that targets group-role clients
- [[use-websocket-composable-is-client-foundation]] — the composable this wraps
- [[gm-tab-switch-propagates-instantly-to-group-view]] — observed behavior of tab sync
