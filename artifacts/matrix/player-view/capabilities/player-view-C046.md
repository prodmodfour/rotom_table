---
cap_id: player-view-C046
name: player-view-C046
type: —
domain: player-view
---

### player-view-C046
- **name:** Target selection overlay
- **type:** component
- **location:** `app/components/player/PlayerCombatActions.vue` — target-selector template section
- **game_concept:** Multi-target selection for move execution
- **description:** Overlay that shows all valid (non-fainted) targets grouped by side. Player can select multiple targets by toggling buttons. Shows target name and side label. Confirm button sends the move execution with selected target IDs. Cancel button dismisses the overlay.
- **inputs:** validTargets (from usePlayerCombat), pendingMoveId, pendingAction
- **outputs:** Calls executeMove or useStruggle with selected targetIds
- **accessible_from:** player
