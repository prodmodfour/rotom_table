The group API at `/api/group/` manages the shared Group View display state.

`tab.get` and `tab.put` read and update the active tab on the Group View. The tab state is persisted in the [[group-view-state-persisted-as-singleton-row]] singleton so the Group View can recover its position after a page refresh.

`map.get`, `map.post`, and `map.delete` manage the served map data. The map is held in the [[wild-spawn-and-map-use-server-in-memory-singletons]] — it is transient and does not survive server restarts. `map.post` accepts location data and connections to render on the Group View's map display.

`wild-spawn.get`, `wild-spawn.post`, and `wild-spawn.delete` manage the wild spawn preview overlay shown on the Group View. Like the map, wild spawn state is transient in-memory data. The GM posts generated Pokemon data that the Group View renders as an encounter preview.

## See also

- [[group-view-page]] — the display that consumes this API
- [[websocket-handler-routes-messages-by-type]] — Group View also receives real-time updates via WebSocket
