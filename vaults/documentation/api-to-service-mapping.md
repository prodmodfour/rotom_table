# API-to-Service Mapping

Each [[api-endpoint-layout|API directory]] delegates to specific services per the [[service-delegation-rule]]:

| API Directory | Primary Service(s) |
|---|---|
| `encounters/` | encounter, combatant, out-of-turn, intercept, switching, status-automation, weather-automation, mounting, living-weapon |
| `pokemon/` | pokemon-generator, evolution, entity-update |
| `characters/` | entity-update, rest-healing, csv-import |
| `capture/` | ball-condition, utility functions in `utils/captureRate` |
| `scenes/` | scene |
| `encounter-tables/` | Direct Prisma (CRUD) + encounter-generation (generate endpoint) |
| `encounter-templates/` | pokemon-generator, combatant (load endpoint) |
| `group/` | Direct Prisma + WebSocket broadcast |
| `settings/` | Direct Prisma |
| `abilities/`, `moves/`, `species/` | Direct Prisma (reference data lookup) |
| `game/` | rest-healing |
| `player/` | Direct Prisma + csv-import |

## See also

- [[service-inventory]]
