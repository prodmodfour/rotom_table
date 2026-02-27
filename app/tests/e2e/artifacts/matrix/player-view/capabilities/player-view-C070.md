---
cap_id: player-view-C070
name: player-view-C070
type: —
domain: player-view
---

### player-view-C070
- **name:** usePlayerGridView.visibleTokens
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` — visibleTokens computed
- **game_concept:** Fog of war token visibility filtering
- **description:** Filters combatant tokens based on fog of war state. Own tokens (trainer + Pokemon) are always visible regardless of fog. Other tokens are only visible on 'revealed' cells; hidden and explored cells hide tokens. When fog is disabled, all tokens with positions are visible.
- **inputs:** encounterStore combatants, fogStore state, isOwnCombatant check
- **outputs:** TokenInfo[] (combatantId, position, size)
- **accessible_from:** player
