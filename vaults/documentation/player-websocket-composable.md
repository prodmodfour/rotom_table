# Player WebSocket Composable

`usePlayerWebSocket` orchestrates all player-specific WebSocket behavior, layered on the [[websocket-real-time-sync|base WebSocket system]].

## Auto-Identification

When the WebSocket connects, the composable sends an `identify` event with `role='player'` and the player's `characterId`. The server stores role and characterId on the peer info and pushes the active scene and tab state.

## Event Handling

Dispatches incoming events to handlers:
- `scene_sync` — applies scene data to [[player-scene-view|usePlayerScene]].
- `scene_deactivated` — clears scene state.
- `scene_activated` + 8 granular scene events — triggers `fetchActiveScene()` REST fallback rather than incremental patching.
- `character_update` — if the updated entity matches the player's character or Pokemon, triggers `refreshCharacterData()`.
- `damage_applied` — if the target matches the player's entities, triggers [[haptic-feedback-patterns|vibrateOnDamageTaken]].
- `move_executed` — if the executing entity matches, triggers [[haptic-feedback-patterns|vibrateOnMoveExecute]].
- `player_action_ack` — resolves the matching pending action promise, sets `lastActionAck` for toast display (auto-clears after 4s).
- `player_turn_notify` — sets `turnNotification` (auto-clears after 5s), triggers [[haptic-feedback-patterns|vibrateOnTurnStart]].

## Pending Action Tracking

`sendAction()` sends a player action request with a generated `requestId` and returns a Promise. Pending actions are tracked in a Map. The promise resolves when the GM sends `player_action_ack`, or rejects after a 60-second timeout.

## See also

- [[player-websocket-events]] — the full event catalog
- [[pending-request-routing]] — server-side request-to-player routing
- [[player-reconnection-sync]] — reconnection recovery
- [[player-combat-composable]] — consumes the send function
