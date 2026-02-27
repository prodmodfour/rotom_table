---
cap_id: player-view-C024
name: player-view-C024
type: —
domain: player-view
---

### player-view-C024
- **name:** PlayerPokemonTeam component
- **type:** component
- **location:** `app/components/player/PlayerPokemonTeam.vue`
- **game_concept:** Pokemon team roster display
- **description:** Container component for the Team tab. Renders a list of PlayerPokemonCard components for each Pokemon in the player's team. Shows an empty state with PawPrint icon when no Pokemon exist. Highlights the active Pokemon via the activePokemonId prop.
- **inputs:** pokemon: Pokemon[], activePokemonId?: string
- **outputs:** Visual display of Pokemon cards
- **accessible_from:** player
