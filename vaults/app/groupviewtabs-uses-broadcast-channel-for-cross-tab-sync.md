# GroupViewTabs Uses BroadcastChannel for Cross-Tab Sync

The `groupViewTabs` store is the only store that uses the browser's `BroadcastChannel` API for synchronization between multiple browser tabs. It creates a channel named `'ptu-scene-sync'` via `setupCrossTabSync()`.

When the GM activates or deactivates a scene, the store posts a message to the BroadcastChannel. Other browser tabs running the same app receive the message and update their local scene state accordingly. This runs alongside the WebSocket sync — BroadcastChannel handles same-browser tab coordination while WebSocket handles cross-device coordination.

No other store uses BroadcastChannel. The remaining cross-client sync in the codebase flows entirely through WebSocket events.

## See also

- [[group-view-tabs-store-is-present-on-every-gm-page]] — this store's ubiquity across GM routes
- [[groupviewtabs-has-many-websocket-handler-methods]] — the WebSocket side of this store's sync
- [[all-stores-use-pinia-options-api]]