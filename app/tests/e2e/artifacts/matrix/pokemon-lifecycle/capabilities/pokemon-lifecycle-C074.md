---
cap_id: pokemon-lifecycle-C074
name: PokemonStatsTab
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C074: PokemonStatsTab
- **cap_id**: pokemon-lifecycle-C074
- **name**: Pokemon Stats Display/Edit Tab
- **type**: component
- **location**: `app/components/pokemon/PokemonStatsTab.vue`
- **game_concept**: Pokemon stat sheet with combat state
- **description**: 3-column grid showing base stats and current stats. HP editable in edit mode. Displays status conditions (color-coded badges), injuries (count badge), combat stage modifiers (positive/negative styling), and nature with raised/lowered stat indicators.
- **inputs**: pokemon, editData, isEditing props
- **outputs**: Emits update:editData for HP changes
- **accessible_from**: gm
