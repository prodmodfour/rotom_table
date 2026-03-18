The [[rest-healing-system]] exposes 11 API endpoints across three base paths.

## Character endpoints (`/api/characters/[id]/`)

| Method | Path | Action |
|--------|------|--------|
| POST | `rest` | [[thirty-minute-rest]] |
| POST | `extended-rest` | [[extended-rest]] |
| POST | `pokemon-center` | [[pokemon-center-healing]] |
| POST | `heal-injury` | [[natural-injury-healing]] or [[ap-drain-injury-healing]] |
| POST | `new-day` | [[new-day-reset]] (cascades to owned Pokemon) |

## Pokemon endpoints (`/api/pokemon/[id]/`)

| Method | Path | Action |
|--------|------|--------|
| POST | `rest` | [[thirty-minute-rest]] |
| POST | `extended-rest` | [[extended-rest]] |
| POST | `pokemon-center` | [[pokemon-center-healing]] |
| POST | `heal-injury` | [[natural-injury-healing]] only |
| POST | `new-day` | [[new-day-reset]] |

## Global endpoint

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/game/new-day` | [[new-day-reset]] for all entities |

All endpoints are GM-only. The [[rest-healing-composable]] wraps each endpoint for client-side use.

## See also

- [[character-api-endpoints]]
- [[pokemon-api-endpoints]]
- [[api-endpoint-layout]]
