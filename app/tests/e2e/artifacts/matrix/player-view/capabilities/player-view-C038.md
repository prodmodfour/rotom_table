---
cap_id: player-view-C038
name: player-view-C038
type: —
domain: player-view
---

### player-view-C038
- **name:** usePlayerCombat.requestUseItem
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — requestUseItem()
- **game_concept:** Request to use an inventory item (requires GM approval)
- **description:** Sends a player_action WebSocket message with action 'use_item', itemId, and itemName. Includes a generated requestId for response tracking. The GM sees the request and can accept/reject it.
- **inputs:** itemId: string, itemName: string
- **outputs:** void (side effect: WebSocket message sent)
- **accessible_from:** player
