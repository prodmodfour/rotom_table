# Group View Tab State

The group/player view is controlled by a singleton database record (`GroupViewState`) that tracks which tab is shown (`activeTab`: lobby, scene, encounter, or map) and the `activeSceneId`.

The GM switches tabs using the Lobby/Scene/Encounter/Map toggle buttons in the [[gm-navigation-bar]]. The selected tab determines what the [[group-view-page]] and player view (`/player`) display. Each tab value maps to a specific view: [[group-view-lobby-tab]], [[group-view-scene-display]], [[group-view-encounter-tab]], or [[group-view-map-tab]].

The store managing this state (`useGroupViewTabsStore`) also holds all scene CRUD operations, scene activation/deactivation, and WebSocket handlers for scene events. It uses a `BroadcastChannel('ptu-scene-sync')` to keep multiple browser tabs in sync.

Tab state persists in the database (as a `GroupViewState` Prisma model), unlike [[wild-spawn-and-map-use-server-in-memory-singletons]]. Players can request tab changes via the [[player-group-view-tab-request]] component, subject to GM approval.

## See also

- [[gm-tab-switch-propagates-instantly-to-group-view]] — observed behavior of the tab switch
- [[api-routes-broadcast-mutations-via-websocket]] — the tab PUT route broadcasts the change


- [[group-view-tabs-store-is-present-on-every-gm-page]] — runtime instantiation ubiquity
- [[stores-instantiate-lazily-per-page]]