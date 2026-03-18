# Character API Endpoints

17 endpoints under `app/server/api/characters/`, part of the [[api-endpoint-layout]].

## CRUD

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/characters` | List all characters |
| POST | `/api/characters` | Create character |
| GET | `/api/characters/:id` | Read single character |
| PUT | `/api/characters/:id` | Update character |
| DELETE | `/api/characters/:id` | Delete character |

## Healing and Rest

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/characters/:id/rest` | [[thirty-minute-rest]] |
| POST | `/api/characters/:id/extended-rest` | [[extended-rest]] |
| POST | `/api/characters/:id/pokemon-center` | [[pokemon-center-healing]] |
| POST | `/api/characters/:id/heal-injury` | [[natural-injury-healing]] or [[ap-drain-injury-healing]] |
| POST | `/api/characters/:id/new-day` | [[new-day-reset]] (cascades to Pokemon) |

## XP

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/characters/:id/xp` | Award or deduct trainer XP (auto-level at 10 XP, bank clamped, level cap 50) |
| GET | `/api/characters/:id/xp-history` | Returns current bank, level, xpToNextLevel, ownedSpecies |

See [[trainer-xp-system]] for the underlying logic.

## Equipment

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/characters/:id/equipment` | Read equipment slots |
| PUT | `/api/characters/:id/equipment` | Update equipment (Zod-validated) |

See [[equipment-system]] for slot management and bonuses.

## Utility

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/characters/players` | Player characters only |
| POST | `/api/characters/import-csv` | CSV import from PTU character sheets |

Services: [[api-to-service-mapping|entity-update, rest-healing, csv-import]].

## See also

- [[api-endpoint-layout]]
- [[api-to-service-mapping]]
- [[character-creation-page]]
- [[library-store]]
- [[csv-import-service]]
