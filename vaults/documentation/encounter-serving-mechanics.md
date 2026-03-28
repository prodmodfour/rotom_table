Serving controls which encounter is displayed on the group and player views. Only one encounter can be served at a time.

## Serve

Marking an encounter as served updates the group view state to display it. A WebSocket event broadcasts to all connected group and player clients so they load the encounter.

## Unserve

Marking an encounter as unserved resets the group view state to the lobby. A WebSocket event notifies clients.

## Initial Load

On page load, group and player views query for the currently served encounter (if any) to detect if an encounter is already being displayed.

## See also

- [[triple-view-system]] — the GM/Group/Player view architecture that serving controls
- [[websocket-real-time-sync]] — serve/unserve events broadcast via WebSocket
