Over 30 server API route handlers import broadcast helpers from `server/utils/websocket.ts` and call them after persisting state changes. This is the primary mechanism for syncing mutations to connected clients — the WebSocket layer distributes events, but does not contain business logic.

The pattern is consistent: the route handler validates input, calls a service to mutate data in Prisma, then calls a notify helper to broadcast the result. Examples:

- Encounter combat routes (`next-turn`, `switch`, `mount`, `recall`, `hold-action`, `priority`, `aoo-*`, `interrupt`, `living-weapon/*`) call `broadcastToEncounter` with the updated encounter state.
- Scene routes (`activate`, `deactivate`, `positions`, `characters`, `pokemon`, `groups`) call specialized notifiers (`notifySceneUpdate`, `notifyScenePositionsUpdated`, etc.) that target group and player clients.
- Global routes (`capture/attempt`, `characters/*/xp`, `trainer-xp-distribute`) call `broadcast` to reach all connected peers.
- The `group/tab` PUT route calls `broadcastToGroupAndPlayers` to sync [[group-view-tab-state|tab changes]].

Some routes (e.g. `next-turn`) broadcast multiple events — both `status_tick` for individual ticks and the full `encounter_update` — allowing clients to animate intermediate steps.

## See also

- [[websocket-peer-map-tracks-connected-clients]] — the broadcast functions these routes call
- [[route-handlers-delegate-to-services-for-complex-logic]] — the service layer these routes call before broadcasting
- [[gm-encounter-actions-broadcast-after-each-mutation]] — the client-side counterpart that broadcasts from the GM composable
