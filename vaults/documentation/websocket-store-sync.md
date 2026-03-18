# WebSocket Store Sync

How [[websocket-real-time-sync|WebSocket events]] update [[pinia-store-classification|Pinia stores]]:

- **Encounter store** `updateFromWebSocket()` — Surgical property-by-property update to avoid full reactivity cascade. Updates top-level fields individually, then iterates combatants by ID to patch in-place.
- **GroupViewTabs store** — BroadcastChannel (`ptu-scene-sync`) for cross-tab sync. Handlers: `handleTabChange`, `handleSceneUpdate`, `handleSceneActivated/Deactivated`, `handleScenePositionsUpdated`, plus granular entity add/remove events.
- **GroupView store** — Direct setters `setWildSpawnPreview()`, `setServedMap()` called from WebSocket handlers.

**Flow:** Server broadcasts WS event -> WS composable receives -> calls store handler method.

The `betweenTurns` flag on encounter state is local-only: not persisted to server or synced via WebSocket. It resets on page reload.
