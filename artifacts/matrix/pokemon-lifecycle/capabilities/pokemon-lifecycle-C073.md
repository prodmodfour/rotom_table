---
cap_id: pokemon-lifecycle-C073
name: PokemonLevelUpPanel
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C073: PokemonLevelUpPanel
- **cap_id**: pokemon-lifecycle-C073
- **name**: Level-Up Info Panel
- **type**: component
- **location**: `app/components/pokemon/PokemonLevelUpPanel.vue`
- **game_concept**: Preview level-up effects when editing level
- **description**: Shown in edit mode when targetLevel > currentLevel. Watches targetLevel and fetches POST /api/pokemon/:id/level-up-check. Displays stat points, tutor points, new moves, ability milestones, and evolution reminder. Animated slide-down appearance.
- **inputs**: pokemonId, currentLevel, targetLevel props
- **outputs**: Visual-only (fetches data internally)
- **accessible_from**: gm
