# Pokemon Sheet Page

`pages/gm/pokemon/[id].vue` — the GM's full Pokemon character sheet at `/gm/pokemon/:id`.

Loads a single Pokemon by route param ID. Supports an `edit=true` query param for immediate edit mode.

## Composed Elements

- **PokemonEditForm** — header with sprite (via [[pokemon-sprite-resolution-chain|usePokemonSprite]]), species, nickname, level, experience, gender, shiny flag, location, type badges. Fields become editable inputs in edit mode.
- **PokemonLevelUpPanel** — shown in edit mode when target level exceeds current level. Fetches [[pokemon-api-endpoints|POST /api/pokemon/:id/level-up-check]] and displays stat points, tutor points, new moves, ability milestones, and evolution reminder.

## Tabs

Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes. Mapped to tab components:

- **PokemonStatsTab** — base/current stats grid, status conditions, injuries, stage modifiers, [[pokemon-nature-system|nature]] indicators
- **PokemonMovesTab** — move cards with inline [[pokemon-sheet-dice-rolls|attack/damage rolling]]
- **PokemonCapabilitiesTab** — movement capabilities, jump, power, weight, size, other capabilities as tags
- **PokemonSkillsTab** — skill grid with dice rolling, [[pokemon-tutor-points|tutor points]], training exp, egg groups

## Save Flow

Edit mode saves via the [[library-store|library.updatePokemon]] store action, which calls [[pokemon-api-endpoints|PUT /api/pokemon/:id]].

## See also

- [[character-sheet-modal]] — alternative modal-based sheet access
- [[library-store]] — store actions for CRUD
