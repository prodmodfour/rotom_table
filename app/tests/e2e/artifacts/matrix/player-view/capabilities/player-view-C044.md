---
cap_id: player-view-C044
name: player-view-C044
type: —
domain: player-view
---

### player-view-C044
- **name:** usePlayerCombat.canBeCommanded
- **type:** composable-function
- **location:** `app/composables/usePlayerCombat.ts` — canBeCommanded computed
- **game_concept:** PTU league battle newly-switched Pokemon restriction
- **description:** In league battles, a newly switched-in Pokemon cannot be commanded on the turn it enters (PTU p.227). This computed returns false in that case. Shift and pass actions remain available. Uses turnState.canBeCommanded field.
- **inputs:** turnState from active combatant
- **outputs:** boolean
- **accessible_from:** player
