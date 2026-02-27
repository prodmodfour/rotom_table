---
cap_id: player-view-C036
name: player-view-C036
type: —
domain: player-view
---

### player-view-C036
- **name:** usePlayerCombat.useStruggle
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — useStruggle()
- **game_concept:** PTU Struggle attack (Normal Type, AC 4, DB 4, Melee, Physical, no STAB)
- **description:** Executes the Struggle attack as a standard action alternative. Calls encounterStore.executeMove with the special 'struggle' moveId and target IDs. Throws error if not the player's turn.
- **inputs:** targetIds: string[]
- **outputs:** void (side effect: server API call)
- **accessible_from:** player
