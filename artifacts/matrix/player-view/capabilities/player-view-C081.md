---
cap_id: player-view-C081
name: player-view-C081
type: —
domain: player-view
---

### player-view-C081
- **name:** Player page (index.vue)
- **type:** component
- **location:** `app/pages/player/index.vue`
- **game_concept:** Player view orchestrator page
- **description:** Main player page that orchestrates the entire player experience. Manages tab state (character/team/encounter/scene) with directional slide transitions. Integrates all subsystems: identity management, WebSocket connection, encounter polling, turn notifications, action acknowledgment toasts, reconnection recovery, and tab-based content switching. Provides the WebSocket send function to child components via provide/inject pattern.
- **inputs:** URL route (player layout)
- **outputs:** Full player view UI with all tabs
- **accessible_from:** player
