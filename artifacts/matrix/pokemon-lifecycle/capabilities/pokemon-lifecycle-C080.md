---
cap_id: pokemon-lifecycle-C080
name: Pokemon Sheet Page
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C080: Pokemon Sheet Page
- **cap_id**: pokemon-lifecycle-C080
- **name**: GM Pokemon Detail Page
- **type**: component
- **location**: `app/pages/gm/pokemon/[id].vue`
- **game_concept**: Full Pokemon character sheet with editing
- **description**: Container page loading a single Pokemon by route param ID. Composes PokemonEditForm, PokemonLevelUpPanel, and tab components (Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes). Uses usePokemonSheetRolls() for dice rolling and usePokemonSprite() for sprite URL. Edit mode saves via library.updatePokemon(). Tabs: stats, moves, abilities, capabilities, skills, healing, notes.
- **inputs**: Route param: id, optional query: edit=true
- **outputs**: Full interactive Pokemon sheet
- **accessible_from**: gm
