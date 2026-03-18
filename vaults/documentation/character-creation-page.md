# Character Creation Page

`pages/gm/create.vue` — the `/gm/create` route for creating characters and Pokemon. Part of [[gm-view-routes]].

## Human Creation Modes

**Quick Create** — minimal NPC scaffolding: name, character type, level, location, and [[trainer-sprites|sprite picker]]. Skips PTU-compliant validation.

**Full Create** — PTU-compliant multi-section form with progress indicators. Uses [[character-creation-composable]] for all state management. Sections:

1. Basic Info (name, type, level, location, sprite)
2. Background & Skills ([[sample-backgrounds]] presets or custom, 17 skill ranks)
3. Edges
4. Classes & Features ([[trainer-class-catalog]] picker, feature list)
5. Combat Stats ([[trainer-stat-budget|stat point allocation]], HP/evasion preview)
6. Biography (collapsible)
7. Notes
8. Validation Summary ([[character-creation-validation]] warnings)

A human/Pokemon toggle switches between the two creation forms. Pokemon creation uses a simpler form: species, nickname, level, gender, shiny, types, base stats.

## See also

- [[character-creation-composable]]
- [[character-creation-validation]]
- [[library-store]]
