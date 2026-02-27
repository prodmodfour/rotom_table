---
cap_id: player-view-C077
name: player-view-C077
type: —
domain: player-view
---

### player-view-C077
- **name:** PlayerGroupControl component
- **type:** component
- **location:** `app/components/player/PlayerGroupControl.vue`
- **game_concept:** Player requesting changes to the shared Group View (TV/projector)
- **description:** Allows a player to request tab changes on the shared Group View. Shows the current tab, request buttons (Request Scene / Request Lobby), pending state while waiting for GM, cooldown timer (30 seconds after each request), and response feedback (approved/rejected auto-dismisses after 3 seconds). Sends group_view_request WebSocket events and listens for group_view_response. Auto-times out requests after 30 seconds.
- **inputs:** currentTab, send, onMessage (WebSocket functions)
- **outputs:** Sends WebSocket events; visual feedback
- **accessible_from:** player

---

## Connection Status
