---
cap_id: player-view-C075
name: player-view-C075
type: —
domain: player-view
---

### player-view-C075
- **name:** Encounter polling with backoff
- **type:** composable-function
- **location:** `app/pages/player/index.vue` — checkForActiveEncounter, polling logic
- **game_concept:** Active encounter detection for player
- **description:** Polls GET /api/encounters every 3 seconds to detect active encounters. When an active encounter is found, loads it into the encounterStore and joins the encounter room via WebSocket. Implements exponential backoff on failure (doubles interval after 5 consecutive failures, capped at 30 seconds). Resets to base interval on success after backoff.
- **inputs:** None (auto-runs on mount and after character selection)
- **outputs:** Side effects: loads encounter, identifies on WebSocket
- **accessible_from:** player

---

## Haptic Feedback
