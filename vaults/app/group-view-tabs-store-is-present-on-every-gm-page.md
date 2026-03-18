The `groupViewTabs` store is instantiated on every GM route observed at runtime — `/gm`, `/gm/sheets`, `/gm/encounters`, `/gm/encounter-tables`, `/gm/map`, and `/group`. It is the only store with this level of ubiquity across GM pages.

This happens because the GM layout shell (shared across all `/gm/*` routes) uses the store to display the tab-switching controls in the navigation bar. The group view also instantiates it because it needs to know the active tab to render the correct content.

The player view (`/player`) is the only route that does not instantiate this store, using [[player-identity-store-is-populated-externally|playerIdentity]] as its identity backbone instead.

## See also

- [[group-view-tab-state]] — details of the tab state model and BroadcastChannel sync
- [[stores-instantiate-lazily-per-page]]
- [[groupviewtabs-uses-broadcast-channel-for-cross-tab-sync]] — the cross-tab sync mechanism
- [[groupviewtabs-has-many-websocket-handler-methods]] — the granular WebSocket event handlers