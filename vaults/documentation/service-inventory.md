# Service Inventory

23 services in `app/server/services/`, classified by [[service-pattern-classification|pattern]]:

| File | ~Lines | Description |
|---|---|---|
| `combatant.service.ts` | 797 | Damage calc, healing, status conditions, stage mods, combatant construction, HP-loss pathway |
| `switching.service.ts` | 927 | Switch validation, recall range, initiative insertion, action tracking, terrain/weather re-apply on send-out |
| `out-of-turn.service.ts` | 752 | AoO, Hold Action, Priority Actions, Interrupt framework |
| `intercept.service.ts` | 689 | Intercept Melee/Ranged (PTU p.242) — eligibility, detection, resolution |
| `evolution.service.ts` | 715 | Species evolution: stat recalc, Base Relations validation, full execution |
| `mounting.service.ts` | 561 | Trainer-Pokemon mount/dismount logic, movement sharing, faint auto-dismount |
| `living-weapon.service.ts` | 555 | Living Weapon engage/disengage, wield state, faint penalty, equipment overlay |
| `pokemon-generator.service.ts` | 540 | Canonical Pokemon creation pipeline. See [[pokemon-generator-entry-point]] |
| `encounter.service.ts` | 514 | Encounter CRUD, initiative sorting, turn management, response building |
| `csv-import.service.ts` | 405 | Parse PTU character sheet CSVs, create trainer + Pokemon DB records. See [[csv-import-service]] |
| `healing-item.service.ts` | 372 | Healing item validation and application (HP restore, status cure, revive, combat action economy) |
| `living-weapon-abilities.service.ts` | 225 | Soulstealer (scene-frequency-tracked healing on KO), Weaponize intercept, No Guard suppression |
| `weather-automation.service.ts` | 204 | Weather damage ticks (Hail, Sandstorm) with type/ability immunities; weather ability effects (Ice Body, Rain Dish, Solar Power, Dry Skin) |
| `living-weapon-movement.service.ts` | 159 | Shared movement pool: position sync, speed calculation, modifier threading |
| `status-automation.service.ts` | 151 | Tick damage at turn end (Burn, Poison, Badly Poisoned, Cursed) |
| `grid-placement.service.ts` | 147 | Auto-place combatant tokens on VTT grid by side, size-to-token mapping |
| `scene.service.ts` | 142 | Scene-end AP restoration, scene frequency reset on transitions |
| `entity-update.service.ts` | 141 | Sync combatant state changes back to Pokemon/HumanCharacter DB rows |
| `rest-healing.service.ts` | 130 | Daily move refresh for Extended Rest (rolling window rule) |
| `entity-builder.service.ts` | 128 | Transform Prisma records into typed Pokemon/HumanCharacter entities |
| `encounter-generation.service.ts` | 125 | Weighted random species selection with diversity enforcement for spawn tables. See [[encounter-generation-service]] |
| `ball-condition.service.ts` | 185 | Build Poke Ball condition context from encounter state for conditional ball modifiers |
| `living-weapon-state.ts` | 51 | Reconstruct wieldRelationships from combatant flags for WebSocket state sync |

## See also

- [[service-dependency-map]]
- [[api-to-service-mapping]]
- [[combatant-service-mixed-domains]] — SRP analysis of the largest service
- [[game-engine-extraction]] — a destructive proposal to gut services into thin orchestrators calling a standalone engine
- [[domain-module-architecture]] — a destructive proposal to distribute services across domain modules
- [[repository-use-case-architecture]] — a destructive proposal to decompose these services into repositories and use cases
