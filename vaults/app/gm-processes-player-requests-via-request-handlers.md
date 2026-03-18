The `usePlayerRequestHandlers` composable in `app/composables/usePlayerRequestHandlers.ts` handles incoming player action requests on the GM side. When a `player_action` message arrives (forwarded by the [[websocket-handler-routes-messages-by-type|WebSocket handler]]), the GM UI presents it for approval or denial.

Specialized handlers exist for specific action types:
- **Capture** -- rolls accuracy, attempts capture via the capture service, sends ack with capture result
- **Breather** -- executes the breather action (HP recovery), sends ack
- **Healing item** -- uses the healing item from inventory, sends ack
- **Generic** -- sends an acceptance ack and lets the GM execute the action manually

Each handler persists the result to the database, sends a `player_action_ack` back to the originating player (routed via the [[pending-requests-map-routes-gm-responses-to-players|pending requests map]]), and broadcasts an `encounter_update` so all clients see the new state.

The `handleDenyRequest()` function sends a rejection ack without modifying encounter state.

## See also

- [[player-websocket-wraps-actions-as-promises]] -- the player-side promise that resolves when the ack arrives
- [[gm-is-single-writer-for-encounter-state]] -- the authority model these handlers enforce
