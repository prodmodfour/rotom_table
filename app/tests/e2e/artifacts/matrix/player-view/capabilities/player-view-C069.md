---
cap_id: player-view-C069
name: player-view-C069
type: —
domain: player-view
---

### player-view-C069
- **name:** usePlayerGridView composable
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts`
- **game_concept:** Player grid state management with fog and movement
- **description:** Manages player-specific grid state: token ownership detection, fog-filtered visible tokens, move request flow (select token -> tap destination -> confirm -> pending), pending move tracking with 30s timeout and server response handling, and information asymmetry levels (full/allied/enemy). Listens for player_move_response WebSocket events.
- **inputs:** characterId, pokemonIds, send, onMessage
- **outputs:** visibleTokens, isOwnCombatant, selectedCombatantId, moveConfirmTarget, pendingMove, selectToken, clearSelection, setMoveTarget, confirmMove, cancelMoveConfirm, primaryTokenPosition, getInfoLevel, ownCombatants
- **accessible_from:** player
