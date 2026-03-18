# Group View Tabs

The Group View route (`/group`) renders a dynamic tab shell. Part of the [[triple-view-system]].

Four tab components:

- **LobbyView.vue** — Waiting screen when nothing is served.
- **SceneView.vue** — Active scene with positioned sprites.
- **EncounterView.vue** — Served encounter with health bars, turn indicator, and VTT grid.
- **MapView.vue** — Served region map.

## See also

- [[group-view-scene-interaction]]
- [[player-group-view-control]] — players can request tab changes on this view
