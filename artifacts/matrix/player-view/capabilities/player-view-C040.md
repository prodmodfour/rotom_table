---
cap_id: player-view-C040
name: player-view-C040
type: —
domain: player-view
---

### player-view-C040
- **name:** usePlayerCombat.requestManeuver
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestManeuver()
- **game_concept:** Request to perform a combat maneuver (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'maneuver', maneuverId, and maneuverName. PTU maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather) require GM adjudication.
- **inputs:** maneuverId: string, maneuverName: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player
