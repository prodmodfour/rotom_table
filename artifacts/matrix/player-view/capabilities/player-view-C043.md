---
cap_id: player-view-C043
name: player-view-C043
type: —
domain: player-view
---

### player-view-C043
- **name:** usePlayerCombat.trainerInventory
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — trainerInventory computed
- **game_concept:** Available items for use in combat
- **description:** Returns the trainer's inventory items with quantity > 0. Used by the Use Item panel.
- **inputs:** playerStore.character.inventory
- **outputs:** InventoryItem[] (quantity > 0 only)
- **accessible_from:** player
