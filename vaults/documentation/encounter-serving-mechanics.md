Serving controls which encounter is displayed on the group and player views. Only one encounter can be served at a time.

## Serve

`POST /api/encounters/:id/serve` marks the encounter as served and updates the `GroupViewState` to display it. A WebSocket `serve_encounter` event broadcasts to all connected group and player clients so they load the encounter.

## Unserve

`POST /api/encounters/:id/unserve` marks the encounter as no longer served and resets the `GroupViewState` to the lobby. A WebSocket `encounter_unserved` event notifies clients.

## Get Served

`GET /api/encounters/served` returns the currently served encounter or null. Accessible to GM, group, and player views. Used on initial page load to detect if an encounter is already being displayed.

## Store Actions

The encounter store exposes `serve`, `unserve`, and `loadServedEncounter` actions that call these endpoints and update local state.

## See also

- [[triple-view-system]] — the GM/Group/Player view architecture that serving controls
- [[websocket-real-time-sync]] — serve/unserve events broadcast via WebSocket
