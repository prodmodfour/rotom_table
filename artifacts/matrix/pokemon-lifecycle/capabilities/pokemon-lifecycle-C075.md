---
cap_id: pokemon-lifecycle-C075
name: PokemonMovesTab
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C075: PokemonMovesTab
- **cap_id**: pokemon-lifecycle-C075
- **name**: Pokemon Moves Display with Rolls
- **type**: component
- **location**: `app/components/pokemon/PokemonMovesTab.vue`
- **game_concept**: Move cards with inline attack/damage rolling
- **description**: Lists all moves as cards showing name, type badge, class, frequency, AC, damage formula, range, and effect. Each card has Attack Roll (d20 vs AC), Damage Roll, and Crit Roll buttons. Displays last roll result with hit/miss/crit styling.
- **inputs**: pokemon, lastMoveRoll, getMoveDamageFormula props
- **outputs**: Emits roll-attack, roll-damage events
- **accessible_from**: gm
