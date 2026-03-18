# Group View Map Tab

When the [[group-view-tab-state]] is set to "map", the [[group-view-page]] renders this tab. It polls for a served map every second.

**Waiting state** — when no map is served, a centered card shows a map-trifold icon, the heading "No Map Available", and the message "The GM will serve a map when exploration begins."

**Active state** — when a map is served, a `MapOverlay` component renders the map in fullscreen mode.

The map data is fetched from the [[group-view-store-manages-wild-spawn-and-map]], which reads from [[wild-spawn-and-map-use-server-in-memory-singletons]].

## See also

- [[region-map-serve-to-tv-controls]] — the GM controls that push a map to this tab
