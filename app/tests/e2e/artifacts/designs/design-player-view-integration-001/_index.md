---
design_id: design-player-view-integration-001
ticket_id: feature-003
track: C (Integration)
category: FEATURE
scope: FULL
domain: player-view
status: designed
depends_on:
  - design-player-view-core-001 (Track A)
  - design-player-view-infra-001 (Track B)
affected_files:
  - app/server/routes/ws.ts
  - app/server/utils/websocket.ts
  - app/composables/useWebSocket.ts
  - app/types/api.ts
  - app/pages/player/index.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/player/PlayerEncounterView.vue
new_files:
  - app/composables/usePlayerWebSocket.ts
  - app/composables/usePlayerGridView.ts
  - app/composables/usePlayerScene.ts
  - app/composables/useStateSync.ts
  - app/components/player/PlayerGridView.vue
  - app/components/player/PlayerSceneView.vue
  - app/components/player/PlayerGroupControl.vue
  - app/components/player/PlayerMoveRequest.vue
  - app/types/player-sync.ts
  - app/server/api/player/action-request.post.ts
---


# Design: Player View Integration (Track C) -- feature-003

## Overview

Track C integrates Track A (core player identity/combat) with Track B (tunnel/PWA infrastructure). It defines how GM, Group, and Player views communicate in real time, how players interact with the shared Group View, how players see/move tokens on a simplified VTT grid, and how scene state propagates to player devices.

### Scope

1. **WebSocket protocol expansion** -- New message types for player-GM communication and multi-client sync.
2. **Group View control** -- Permission model for players influencing the shared TV/projector.
3. **VTT grid for players** -- Mobile-friendly simplified grid with GM-approved token movement.
4. **Scene view for players** -- Read-only scene display on player devices.
5. **State synchronization** -- Consistency model across GM, Group, and N Player connections.
6. **Cross-track integration** -- Track A hooks, Track B PWA interaction, keepalive for tunnels.

---

## 8. Summary

**New files: 10** (~1,490 lines total). **Modified files: 10.** Organized into P0 (protocol + scene), P1 (grid + group control + ack), P2 (polish + offline).

---


## Atomized Files

- [_index.md](_index.md)
- [spec.md](spec.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
