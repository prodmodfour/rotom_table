# Pokemon Sheet Page

`pages/gm/pokemon/[id].vue` — the GM's full Pokemon character sheet at `/gm/pokemon/:id`.

Loads a single Pokemon by route param ID. Supports an `edit=true` query param for immediate edit mode.

## Composed Elements

- **PokemonEditForm** — header with sprite (via [[pokemon-sprite-resolution-chain|usePokemonSprite]]), species, nickname, level, experience, gender, shiny flag, location, type badges. Fields become editable inputs in edit mode.
- **PokemonLevelUpPanel** — shown in edit mode when target level exceeds current level. Fetches [[pokemon-api-endpoints|POST /api/pokemon/:id/level-up-check]] and displays stat points, new traits, and evolution reminder.

## Tabs

Stats, Moves, Traits, Skills, Healing, Notes. Mapped to tab components:

- **PokemonStatsTab** — base/current stats grid, status conditions, injuries, stage modifiers
- **PokemonMovesTab** — move cards with inline [[pokemon-sheet-dice-rolls|attack/damage rolling]]
- **PokemonTraitsTab** — innate/learned/emergent traits, [[movement-trait-types|movement traits]], jump, power, weight, size
- **PokemonSkillsTab** — skill grid with dice rolling, training exp, egg groups

## Save Flow

Edit mode saves via the [[library-store|library.updatePokemon]] store action, which calls [[pokemon-api-endpoints|PUT /api/pokemon/:id]].

## See also

- [[character-sheet-modal]] — alternative modal-based sheet access
- [[library-store]] — store actions for CRUD
