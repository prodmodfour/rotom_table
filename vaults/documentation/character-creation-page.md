# Character Creation Page

`pages/gm/create.vue` — the `/gm/create` route for creating characters and Pokemon. Part of [[gm-view-routes]].

## Human Creation Modes

**Quick Create** — minimal NPC scaffolding: name, character type, location, and [[trainer-sprites|sprite picker]]. Trainers [[only-pokemon-have-levels|have no levels]] and [[starting-stat-allocation|start with 10 in each stat]].

**Full Create** — multi-section form with progress indicators. Uses [[character-creation-composable]] for all state management. Sections:

1. Basic Info (name, type, location, sprite)
2. Skills ([[ptr-skill-list|18 PTR skills]])
3. Traits
4. Combat Stats ([[trainer-stat-budget|stat allocation]], HP preview)
5. Biography (collapsible)
6. Notes
7. Validation Summary ([[character-creation-validation]] warnings)

A human/Pokemon toggle switches between the two creation forms. Pokemon creation uses a simpler form: species, nickname, level, gender, shiny, types, base stats.

## See also

- [[character-creation-composable]]
- [[character-creation-validation]]
- [[library-store]]
