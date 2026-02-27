---
cap_id: pokemon-lifecycle-C072
name: PokemonEditForm
type: component
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C072: PokemonEditForm
- **cap_id**: pokemon-lifecycle-C072
- **name**: Pokemon Header/Edit Form
- **type**: component
- **location**: `app/components/pokemon/PokemonEditForm.vue`
- **game_concept**: Pokemon identity display and editing
- **description**: Displays sprite (with shiny badge), species, nickname, level, experience, gender, shiny checkbox, location, and type badges. In edit mode, fields become editable inputs. Emits update:editData with immutable spread.
- **inputs**: pokemon, editData, isEditing, spriteUrl props
- **outputs**: Emits update:editData
- **accessible_from**: gm
