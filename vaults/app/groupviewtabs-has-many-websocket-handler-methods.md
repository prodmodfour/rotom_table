# GroupViewTabs Has Many WebSocket Handler Methods

The `groupViewTabs` store exposes over ten `handle*` methods designed to be called from an external WebSocket listener: `handleTabChange`, `handleSceneUpdate`, `handleSceneActivated`, `handleSceneDeactivated`, `handleScenePositionsUpdated`, `handleSceneCharacterAdded`, `handleSceneCharacterRemoved`, `handleScenePokemonAdded`, `handleScenePokemonRemoved`, `handleSceneGroupCreated`, `handleSceneGroupUpdated`, and `handleSceneGroupDeleted`.

This granular approach contrasts with the [[encounter-store-merges-websocket-updates-surgically|encounter store]], which receives the full encounter object through a single `updateFromWebSocket` method and merges it field-by-field. The groupViewTabs store instead receives individual events and applies targeted mutations — adding a single character to the scene's array, removing a single Pokemon, updating only positions.

The store does not listen for WebSocket messages itself. An external composable or page-level handler receives the messages and dispatches to the appropriate `handle*` method based on event type.

## See also

- [[groupviewtabs-uses-broadcast-channel-for-cross-tab-sync]] — the other sync mechanism in this store
- [[gm-is-single-writer-for-encounter-state]] — the single-writer model that makes this granular approach safe
- [[group-view-tabs-store-is-present-on-every-gm-page]] — why this store is always available to receive these events