# Pokemon API Endpoints

21 endpoint files under `app/server/api/pokemon/`, using [[nitro-file-based-routing]].

## CRUD

| Method | Path | Action |
|---|---|---|
| GET | `/api/pokemon` | List all Pokemon |
| POST | `/api/pokemon` | Create a Pokemon |
| GET | `/api/pokemon/:id` | Read one Pokemon |
| PUT | `/api/pokemon/:id` | Update one Pokemon |
| DELETE | `/api/pokemon/:id` | Delete one Pokemon |

## Link / Unlink

| Method | Path | Action |
|---|---|---|
| POST | `/api/pokemon/:id/link` | Associate Pokemon with a trainer |
| POST | `/api/pokemon/:id/unlink` | Remove trainer association |

## Healing / Rest

| Method | Path | Action |
|---|---|---|
| POST | `/api/pokemon/:id/rest` | [[thirty-minute-rest]] |
| POST | `/api/pokemon/:id/extended-rest` | [[extended-rest]] |
| POST | `/api/pokemon/:id/pokemon-center` | [[pokemon-center-healing]] |
| POST | `/api/pokemon/:id/heal-injury` | [[natural-injury-healing]] only |
| POST | `/api/pokemon/:id/new-day` | [[new-day-reset]] |

## XP

POST `/api/pokemon/:id/add-experience` — manual or training XP grant with level-up detection.

## Stats

POST `/api/pokemon/:id/allocate-stats` — allocate stat points freely. Supports incremental or batch mode. Applies PTR HP formula.

## Moves

POST `/api/pokemon/:id/learn-move` — validates MoveData, rejects duplicates. See [[pokemon-move-learning]].

## Evolution

| Method | Path | Action |
|---|---|---|
| POST | `/api/pokemon/:id/evolution-check` | Eligibility check ([[evolution-trigger-conditions|trigger conditions]]). Trait remap preview, move condition recheck, resolution options. preventedByItem (Everstone/Eviolite), requiredGender, requiredMove |
| POST | `/api/pokemon/:id/evolve` | Perform evolution — [[evolution-rebuilds-all-stats|full stat rebuild]], HP recalc, encounter-active guard. Accepts traits/moves arrays, updates skills. consumeItem stone from trainer inventory, evolution history note, undoSnapshot, atomic transaction, +1 trainer XP for new species |
| POST | `/api/pokemon/:id/evolution-undo` | Revert using pre-evolution snapshot — restores species, stats, types, traits, moves, skills, heldItem, notes. Restores consumed stone, active encounter guard. [[websocket-real-time-sync|WebSocket]] broadcast with `undone: true` |

See [[pokemon-evolution-system]].

## Bulk

POST `/api/pokemon/bulk-action` — bulk archive or delete with encounter safety check. See [[pokemon-bulk-operations]].

## See also

- [[api-endpoint-layout]]
- [[pokemon-evolution-system]]
- [[pokemon-stat-allocation]]
- [[pokemon-hp-formula]] — HP recalculated by add-experience and allocate-stats
- [[pokemon-nickname-resolution]] — nickname resolved by create and update endpoints
