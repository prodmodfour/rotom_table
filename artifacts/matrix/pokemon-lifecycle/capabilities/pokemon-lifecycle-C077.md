---
cap_id: pokemon-lifecycle-C077
name: PokemonSkillsTab
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C077: PokemonSkillsTab
- **cap_id**: pokemon-lifecycle-C077
- **name**: Pokemon Skills Display with Rolls
- **type**: component
- **location**: `app/components/pokemon/PokemonSkillsTab.vue`
- **game_concept**: Pokemon skill checks with dice rolling
- **description**: 2-column grid of skills with dice notations. Clickable rows trigger skill rolls. Shows last roll result. Also displays tutor points, training exp, and egg groups.
- **inputs**: pokemon, lastSkillRoll props
- **outputs**: Emits roll-skill event
- **accessible_from**: gm
