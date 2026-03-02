# Services CLAUDE.md

Context for working within the server services layer (`app/server/services/`).

## Entry Point Rule

ALL Pokemon creation MUST go through `pokemon-generator.service.ts`. Four graduated functions:

1. `generatePokemonData(input)` — Pure function. Looks up SpeciesData, rolls nature/gender, selects moves + abilities, calculates stats. Returns `GeneratedPokemonData` (no DB write).
2. `createPokemonRecord(data, origin, ownerId?)` — DB writer. Takes pre-built data and persists a Pokemon row. Returns `CreatedPokemon` with DB id.
3. `generateAndCreatePokemon(input)` — Convenience combo of (1) + (2). Single call from species name to DB record.
4. `buildPokemonCombatant(pokemon, side, ...)` — Wraps a Pokemon entity into a `Combatant` struct for encounter use. Delegates to `combatant.service.buildCombatantFromEntity`.

If you need Pokemon, call one of these. Never build Pokemon records ad-hoc in API routes.

## Service Patterns

| Pattern | Services |
|---|---|
| **Pure functions** (no DB, no side effects) | encounter-generation, status-automation, grid-placement, ball-condition |
| **DB writers** (read/write Prisma) | pokemon-generator, entity-update, entity-builder, rest-healing, scene, csv-import, evolution |
| **Hybrid** (pure logic + DB persist) | combatant, switching, healing-item, out-of-turn, intercept, mounting |
| **Orchestrators** (coordinate other services) | encounter |

## Service Inventory

| File | Lines | Description |
|---|---|---|
| `combatant.service.ts` | ~686 | Damage calc, healing, status conditions, stage mods, combatant construction |
| `csv-import.service.ts` | ~405 | Parse PTU character sheet CSVs, create trainer + Pokemon DB records |
| `encounter-generation.service.ts` | ~125 | Weighted random species selection with diversity enforcement for spawn tables |
| `encounter.service.ts` | ~471 | Encounter CRUD, initiative sorting, turn management, response building |
| `entity-builder.service.ts` | ~127 | Transform Prisma records into typed Pokemon/HumanCharacter entities |
| `entity-update.service.ts` | ~141 | Sync combatant state changes back to Pokemon/HumanCharacter DB rows |
| `evolution.service.ts` | ~715 | Species evolution: stat recalc, Base Relations validation, full execution |
| `grid-placement.service.ts` | ~147 | Auto-place combatant tokens on VTT grid by side, size-to-token mapping |
| `healing-item.service.ts` | ~372 | Healing item validation and application (HP restore, status cure, revive, combat action economy) |
| `intercept.service.ts` | ~732 | Intercept Melee/Ranged (PTU p.242) — eligibility, detection, resolution |
| `out-of-turn.service.ts` | ~752 | AoO, Hold Action, Priority Actions, Interrupt framework |
| `pokemon-generator.service.ts` | ~524 | Canonical Pokemon creation: generate data, persist, build combatants |
| `rest-healing.service.ts` | ~130 | Daily move refresh for Extended Rest (rolling window rule) |
| `scene.service.ts` | ~74 | Scene-end AP restoration for characters |
| `status-automation.service.ts` | ~151 | Tick damage at turn end (Burn, Poison, Badly Poisoned, Cursed) |
| `switching.service.ts` | ~812 | Pokemon switch validation, recall range, initiative insertion, action tracking |
| `ball-condition.service.ts` | ~185 | Build Poke Ball condition context from encounter state for conditional ball modifiers |
| `mounting.service.ts` | ~454 | Trainer-Pokemon mount/dismount logic, movement sharing, faint auto-dismount |

## Dependency Map

```
pokemon-generator --> combatant (buildCombatantFromEntity)
pokemon-generator --> grid-placement (sizeToTokenSize)
csv-import --------> pokemon-generator (createPokemonRecord)
encounter ---------> combatant (calculateCurrentInitiative)
switching ---------> encounter (sortByInitiativeWithRollOff)
switching ---------> grid-placement (findPlacementPosition)
healing-item ------> combatant (applyHealingToEntity, updateStatusConditions)
intercept ---------> out-of-turn (getDefaultOutOfTurnUsage)
out-of-turn -------> intercept (detect/resolve intercept functions)
ball-condition ----> encounter (encounter state for context building)
mounting ----------> combatant (mount state on combatants)
```

## Gotchas

- **encounter-generation != pokemon-generator**: `encounter-generation` does weighted random species selection from spawn tables. `pokemon-generator` creates individual Pokemon with full character sheets. They serve different stages of the pipeline.
- **Template combatants have no entityId**: Combatants loaded from EncounterTemplate have `entityId: null` until the encounter starts and real DB records are created. `entity-update` skips them silently.
- **combatant.service is the largest hybrid file** (~686 lines): Contains damage calc, healing, status, stages, and combatant construction. Read the section headers before diving in.
- **Pure services must stay pure**: `encounter-generation`, `status-automation`, and `grid-placement` have zero DB imports. Keep them that way for testability.
- **out-of-turn and intercept are circular**: They import from each other. `intercept` was extracted from `out-of-turn` for file size compliance; they share types via `~/types/combat`.
