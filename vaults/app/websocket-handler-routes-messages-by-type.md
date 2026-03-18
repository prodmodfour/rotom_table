A single WebSocket endpoint at `app/server/routes/ws.ts` handles all real-time communication. It uses Nitro's `defineWebSocketHandler` backed by the `crossws` library, enabled via `nitro.experimental.websocket` in nuxt config.

On connect, a peer receives a `connected` message with its `peerId` and defaults to the `group` role. After identifying, group and player clients receive current tab state; player clients also receive the active scene.

The handler's `message` callback contains a switch statement with 30+ message types. Messages fall into categories:

- **Identity**: `identify`, `keepalive`
- **Encounter room**: `join_encounter`, `leave_encounter`, `sync_request`
- **State sync**: `tab_sync_request`, `scene_request`
- **GM broadcasts**: `encounter_update`, `turn_change`, `damage_applied`, `heal_applied`, `status_change`, `move_executed`, `combatant_added`, `combatant_removed`, `status_tick`, `declaration_update`, `movement_preview`, `flanking_update`, `scene_update`
- **Player-to-GM forwarding**: `player_action`, `player_move_request`, `group_view_request`
- **GM-to-player routing**: `player_action_ack`, `player_move_response`, `group_view_response`, `player_turn_notify`
- **Encounter serving**: `serve_encounter`, `encounter_unserved`
- **Combat subsystems**: `aoo_triggered`, `aoo_resolved`, `priority_declared`, `hold_action`, `hold_released`, `interrupt_triggered`, `mount_change`, `living_weapon_engage`, `living_weapon_disengage`
- **Global broadcasts**: `character_update`, `pokemon_evolved`

The WebSocket layer is purely for event distribution — it does not contain business logic. All state mutations happen in [[route-handlers-delegate-to-services-for-complex-logic]] which then call notify helpers from the [[websocket-peer-map-tracks-connected-clients]].

## See also

- [[pending-requests-map-routes-gm-responses-to-players]]
- [[player-api-provides-rest-fallback-for-actions]] — the REST alternative to WebSocket player-GM communication
- [[group-view-websocket-sync]]
- [[websocket-identity-is-role-based]] — how clients identify their role on connect
- [[api-routes-broadcast-mutations-via-websocket]] — how API routes call into the broadcast helpers
- [[websocket-event-types-defined-as-discriminated-union]] — the TypeScript types for all message types in the switch statement
- [[gm-processes-player-requests-via-request-handlers]] — the GM-side handlers for forwarded player actions
