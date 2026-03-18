# Encounter Template Load Endpoint Generates Pokemon

The `POST /api/encounter-templates/:id/load` endpoint materializes a template into a new encounter. Pokemon and human combatants are handled differently.

**Pokemon combatants** get real database records created via `generateAndCreatePokemon()` from the pokemon-generator service. These records have `origin: 'template'` and `originLabel: "Template: <name>"`. The template's moves and abilities are preserved as overrides on the generated Pokemon. Each generated Pokemon is then wrapped into a full combatant via `buildPokemonCombatant()` with computed HP, evasion, and turn state.

**Human combatants** do not get database records. They are constructed as inline-only combatant objects with HP computed as `(level * 2) + (hp_stat * 3) + 10`, initial evasion values from `initialEvasion()` (floor of stat divided by 5, capped at +6), and default turn state.

The endpoint creates a new Encounter database row with these combatants and the template's grid config, returning the full encounter object. The encounter store sets this as the active encounter.

## See also

- [[encounter-template-from-encounter-strips-runtime-state]] — the reverse process, where live encounters are snapshotted into templates
- [[encounter-template-stores-combatant-snapshots]] — the snapshot data that gets materialized
