---
cap_id: player-view-C068
name: player-view-C068
type: —
domain: player-view
---

### player-view-C068
- **name:** PlayerGridView component
- **type:** component
- **location:** `app/components/player/PlayerGridView.vue`
- **game_concept:** Player-mode VTT grid display
- **description:** Renders the tactical battle grid from the player's perspective. Uses the shared GridCanvas component in player mode. Shows fog-filtered tokens, pending move status bar, and move confirmation sheet. Handles cell clicks to set move targets and token selection (own tokens only). Calculates PTU diagonal distance for move requests. Auto-centers on the player's primary token on initial load.
- **inputs:** characterId, pokemonIds, send, onMessage (WebSocket functions)
- **outputs:** Visual grid with player-restricted interaction
- **accessible_from:** player
