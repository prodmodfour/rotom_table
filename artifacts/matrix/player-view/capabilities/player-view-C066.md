---
cap_id: player-view-C066
name: player-view-C066
type: —
domain: player-view
---

### player-view-C066
- **name:** usePlayerScene composable
- **type:** composable-function
- **location:** `app/composables/usePlayerScene.ts`
- **game_concept:** Player scene state management (WebSocket + REST fallback)
- **description:** Manages the player's view of the active scene. Handles scene_sync WebSocket events (maps payload to PlayerSceneData shape), scene deactivation (clears state), and provides a REST fallback via GET /api/scenes/active for reconnection recovery. Strips scene data to player-visible fields only (no terrains, modifiers, or GM metadata).
- **inputs:** SceneSyncPayload from WebSocket, or REST response from /api/scenes/active
- **outputs:** activeScene (readonly ref of PlayerSceneData | null)
- **accessible_from:** player
