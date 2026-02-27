---
cap_id: player-view-C025
name: player-view-C025
type: —
domain: player-view
---

### player-view-C025
- **name:** PlayerPokemonCard component
- **type:** component
- **location:** `app/components/player/PlayerPokemonCard.vue`
- **game_concept:** Individual Pokemon sheet (expandable card)
- **description:** Displays a Pokemon as a collapsible card. Summary shows sprite, nickname/species, types, level, HP bar. Expanded details show: status conditions, held item, stats grid (6 stats with stage modifiers), abilities (name + effect), moves (via PlayerMoveList), and capabilities (overland, swim, sky, burrow, levitate, jump, power). Active Pokemon is highlighted with a teal badge. Fainted Pokemon are dimmed.
- **inputs:** pokemon: Pokemon, isActive: boolean
- **outputs:** Visual display with expand/collapse interaction
- **accessible_from:** player
