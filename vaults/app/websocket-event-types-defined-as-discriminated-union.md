All WebSocket message types are defined as a TypeScript discriminated union `WebSocketEvent` in `app/types/api.ts`, keyed on the `type` field. The union covers roughly 35 event types spanning connection lifecycle, encounter state, combat actions, scene management, VTT visuals, player protocol, and keepalive.

A companion file `app/types/player-sync.ts` defines the player-specific protocol types: `PlayerActionRequest` (with action type and details), `PlayerActionAck` (accepted/rejected/pending), `PlayerTurnNotification` (available actions), `PlayerMoveRequest`/`PlayerMoveResponse` (grid movement), `GroupViewRequest`/`GroupViewResponse` (tab change requests), and `SceneSyncPayload` (stripped scene data for players).

The `PlayerActionType` union enumerates all actions a player can request: `use_move`, `shift`, `struggle`, `pass`, `use_item`, `switch_pokemon`, `maneuver`, `move_token`, `capture`, `breather`, and `use_healing_item`.

## See also

- [[websocket-handler-routes-messages-by-type]] -- the server switch statement that dispatches on these types
- [[player-websocket-wraps-actions-as-promises]] -- the client composable that constructs and sends these typed messages
