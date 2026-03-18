The `playerIdentity` store holds the player's assigned character and their pokemon roster. All its setters are synchronous — it makes no API calls and does not fetch its own data. External code (a page-level composable or the player view page itself) fetches character data and injects it via `setIdentity()` and `setCharacterData()`.

At runtime on the player view (`/player`), the store starts with all fields null/empty until the player identifies themselves. Once set, the `isIdentified` getter becomes true and the view renders character-specific content.

This is one of only two stores instantiated on the player view (the other being the [[encounter-store-merges-websocket-updates-surgically|encounter store]]). The player view does not instantiate [[group-view-tab-state|groupViewTabs]] — it operates independently.

## See also

- [[player-identity-persists-via-local-storage]] — the composable that wraps this store with localStorage persistence and server fetching
- [[stores-instantiate-lazily-per-page]]
- [[websocket-identity-is-role-based]] — player identity feeds into WebSocket role identification