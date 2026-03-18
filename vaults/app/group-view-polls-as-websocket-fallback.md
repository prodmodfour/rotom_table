# Group View Polls as WebSocket Fallback

The [[group-view-page]] primarily receives state changes through [[group-view-websocket-sync]], but each tab also polls as a fallback:

- The page itself polls the tab state (`/api/group/tab`) every **5 seconds**.
- The [[group-view-lobby-tab]] polls for wild spawn previews every **1 second**.
- The [[group-view-encounter-tab]] polls for served encounters every **2 seconds** and for wild spawn previews every **1 second**.
- The [[group-view-map-tab]] polls for a served map every **1 second**.

All polling intervals are cleaned up when their respective components unmount.

## See also

- [[player-encounter-polling-supplements-websocket]] — the player view's equivalent polling mechanism
- [[group-view-websocket-sync]] — the primary WebSocket channel these polls supplement
