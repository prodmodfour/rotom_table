# API Endpoint Layout

158 endpoint files across 14 domain directories under `app/server/api/`, using [[nitro-file-based-routing]]:

| Directory | Endpoints | Domain |
|---|---|---|
| `encounters/` | 58 | CRUD + combat actions (damage, status, turns, mount/dismount, living-weapon, vision) |
| `pokemon/` | 21 | CRUD + evolution + rest/healing + bulk-action |
| `encounter-tables/` | 18 | Tables + entries + modifications (deeply nested) |
| `characters/` | 17 | CRUD + rest/healing/xp + equipment |
| `scenes/` | 16 | CRUD + characters/pokemon/groups/positions |
| `group/` | 8 | Map, tab sync, wild-spawn |
| `encounter-templates/` | 7 | CRUD + load from template |
| `settings/` | 3 | Server-info, tunnel get/put |
| `player/` | 3 | Action-request, export, import |
| `capture/` | 2 | Rate calculation, attempt |
| `species/` | 2 | Get by name, list all |
| `abilities/` | 1 | Batch ability lookup |
| `moves/` | 1 | Batch move lookup |
| `game/` | 1 | New-day reset |

All endpoints follow the [[service-delegation-rule]] and return the [[api-response-format]]. Errors use the [[api-error-handling]] pattern.

## See also

- [[api-to-service-mapping]]
- [[service-layer-pattern]]
- [[group-view-api]] — group/ endpoints: map, tab sync, wild-spawn
- [[encounter-template-api]] — encounter-templates/ endpoints: CRUD + load from template
- [[settings-api]] — settings/ endpoints: server-info, tunnel get/put
- [[utility-api-endpoints]] — species, abilities, moves, and game endpoints that share no dedicated domain service
