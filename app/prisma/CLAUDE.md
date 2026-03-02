# Prisma CLAUDE.md

Context for working with the database layer (`app/prisma/`).

## Schema Overview (14 Models)

```
HumanCharacter --1:N--> Pokemon (ownerId)
Encounter                (standalone, combatants as denormalized JSON)
Scene                    (standalone, characters/pokemon as JSON refs)
GroupViewState            (singleton: active tab + scene)
AppSettings              (singleton: damage mode, VTT defaults)
EncounterTemplate        (standalone, combatants as JSON)
MoveData                 (reference, seeded from CSV)
AbilityData              (reference, seeded — currently unused in seed)
SpeciesData --1:N------> EncounterTableEntry (speciesId)
EncounterTable --1:N---> EncounterTableEntry (tableId)
EncounterTable --1:N---> TableModification (parentTableId)
TableModification -1:N-> ModificationEntry (modificationId)
```

Only one foreign key between entity models: `Pokemon.ownerId -> HumanCharacter.id`. Encounter combatants are fully denormalized into JSON.

## Origin Enum

`Pokemon.origin` — stored as a plain `String`, not a Prisma enum. Five values:

| Value | Meaning |
|---|---|
| `manual` | Created by hand in the GM sheet editor |
| `wild` | Generated from encounter table wild spawn |
| `template` | Loaded from an EncounterTemplate |
| `import` | Imported via CSV upload |
| `captured` | Captured during encounter (auto-linked to trainer) |

## JSON Fields (TEXT Columns)

| Model | JSON-as-TEXT columns |
|---|---|
| **HumanCharacter** | trainerClasses, skills, features, edges, capabilities, equipment, inventory, statusConditions, stageModifiers, capturedSpecies |
| **Pokemon** | nature, stageModifiers, abilities, moves, capabilities, skills, statusConditions, eggGroups |
| **Encounter** | combatants, turnOrder, trainerTurnOrder, pokemonTurnOrder, declarations, switchActions, pendingActions, holdQueue, fogOfWarState, terrainState, moveLog, defeatedEnemies |
| **Scene** | pokemon, characters, groups, terrains, modifiers |
| **EncounterTemplate** | combatants, tags |
| **SpeciesData** | abilities, learnset, evolutionTriggers, skills, capabilities |

All other models use scalar columns only.

## Seed Sources

`seed.ts` runs three seed functions in order:

1. **seedMoves** — Parses `app/data/moves.csv` (PTU move database). Upserts into MoveData.
2. **seedSpecies** — Reads all `books/markdown/pokedexes/gen*/` markdown files via `parsePokedexContent()`. Upserts into SpeciesData with stats, learnsets, evolution triggers, capabilities.
3. **seedTypeEffectiveness** — No-op (type chart lives in client-side composable, not DB).

AbilityData is seeded separately or populated on demand. No encounter tables or sample characters are seeded — those are created at runtime by the GM.

## Schema Sync

- **No migrations directory** — uses `prisma db push` for schema changes (destructive sync)
- No migration scripts for DB schema exist in `scripts/`; those scripts handle artifact reorganization only
- Schema changes require re-running `prisma db push` + `prisma db seed` on the local SQLite file

## Gotchas

- **SQLite JSON = TEXT**: No native JSON type. All JSON columns are `String` with `@default("[]")` or `@default("{}")`. Parsing/serializing is manual in every service.
- **isInLibrary is an archive flag**: `false` = archived (hidden from character sheets), NOT "not in library." Default is `true`.
- **UUID primary keys**: All models use `@id @default(uuid())` except AppSettings (`"default"`) and GroupViewState (`"singleton"`).
- **Denormalized encounter combatants**: Full combatant state (HP, position, status, stages) lives in `Encounter.combatants` JSON. Entity-update service syncs critical fields back to Pokemon/HumanCharacter rows.
- **ptu.db is gitignored**: The database file is excluded via `*.db` in `.gitignore`. Each developer generates it locally with `prisma db push` + seed.
- **Scene.terrains/modifiers columns still exist**: UI was removed (deferred feature) but DB columns and API serialization remain intact.
