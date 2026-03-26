# Encounter Core API

REST endpoints under `/api/encounters/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/encounters` | GET | List encounters |
| `/api/encounters` | POST | Create encounter |
| `/api/encounters/:id` | GET | Read encounter |
| `/api/encounters/:id` | PUT | Update encounter |
| `/api/encounters/from-scene` | POST | Create from [[scene-to-encounter-conversion|scene]] |
| `/api/encounters/served` | GET | List served encounters |
| `.../:id/start` | POST | Start combat |
| `.../:id/end` | POST | End combat |
| `.../:id/next-turn` | POST | Advance turn |
| `.../:id/combatants` | POST | Add combatant |
| `.../:id/combatants/:combatantId` | DELETE | Remove combatant |
| `.../:id/position` | POST | Set combatant position |
| `.../:id/grid-config` | PUT | Update grid configuration |
| `.../:id/background` | POST/DELETE | Set or remove background |
| `.../:id/fog` | GET/PUT | Read or update fog of war |
| `.../:id/terrain` | GET/PUT | Read or update terrain |
| `.../:id/serve` | POST | Serve encounter to players |
| `.../:id/unserve` | POST | Unserve encounter |
| `.../:id/breather` | POST | Mid-combat rest |
| `.../:id/wild-spawn` | POST | Spawn wild Pokemon |

## See also

- [[encounter-serving-mechanics]] — serve/unserve endpoints and GroupViewState
- [[take-a-breather-mechanics]] — breather endpoint mechanics
- [[move-energy-system]] — energy cost validation on move execution
- [[api-endpoint-layout]]
- [[turn-lifecycle]]
