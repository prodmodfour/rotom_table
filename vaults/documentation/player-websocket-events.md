# Player WebSocket Events

Player-specific events layered on top of the [[websocket-event-union]].

| Event | Direction | Purpose |
|---|---|---|
| `keepalive` / `keepalive_ack` | both | 45s interval heartbeat to prevent tunnel idle timeout |
| `scene_sync` | server → player | Full scene data pushed on connect |
| `scene_request` | player → server | Player requests current active scene |
| `player_action` | player → GM | Player submits action to GM |
| `player_action_ack` | GM → player | GM acknowledges action (routed via `pendingRequests` map) |
| `player_turn_notify` | server → player | Turn notification (P1) |
| `player_move_request` / `player_move_response` | player ↔ GM | Token movement request/response (P1) |
| `group_view_request` / `group_view_response` | player ↔ GM | Tab change requests (P1) |

## GM League Battle events

- **`trainer_declared`** — GM broadcasts after a trainer declaration.
- **`declaration_update`** — Updated declarations array sent to encounter room for Group View sync.

## See also

- [[websocket-event-union]]
- [[websocket-real-time-sync]]
- [[player-view-architecture]]
- [[player-websocket-composable]] — client-side composable handling these events
- [[pending-request-routing]] — server-side requestId routing for action acks
- [[haptic-feedback-patterns]] — vibration triggered by turn/damage/move events
