---
id: docs-006
title: "Add CLAUDE.md for app/prisma/"
priority: P0
severity: HIGH
status: open
domain: database
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 2
affected_files:
  - app/prisma/CLAUDE.md (new)
---

# docs-006: Add CLAUDE.md for app/prisma/

## Summary

Create a descendant CLAUDE.md in `app/prisma/` to document the 14 Prisma models, their relationships, JSON field conventions, seed sources, and the origin enum. Agents working on schema changes or seed data need to understand that SQLite stores all JSON as TEXT strings, that `isInLibrary` is an archive flag (not what it sounds like), and that there's no migrations directory.

## Target File

`app/prisma/CLAUDE.md` (~55 lines)

## Required Content

### Schema Overview (14 models)
Compact relationship diagram:
```
HumanCharacter 1──N Pokemon (via ownerId)
EncounterTable 1──N EncounterTableEntry N──1 SpeciesData
EncounterTable 1──N TableModification 1──N ModificationEntry
Encounter (combatants stored as JSON, not FK relations)
Scene (characters/pokemon/groups stored as JSON, not FK relations)
AppSettings (singleton, id="default")
GroupViewState (singleton, id="singleton")
EncounterTemplate (standalone, combatants as JSON)
MoveData, AbilityData, SpeciesData (reference data, seeded from PTU books)
```

### Origin Enum
`Pokemon.origin` is a String with 5 possible values:
- `'manual'` — Created manually in the library (default)
- `'wild'` — Generated from encounter table / wild spawn
- `'template'` — Loaded from an encounter template
- `'import'` — Imported via JSON import
- `'captured'` — Captured during an encounter (auto-linked to trainer)

### JSON Fields (TEXT columns parsed at app layer)
SQLite has no native JSON type. These columns store serialized JSON as TEXT:

**HumanCharacter:** trainerClasses, skills, features, edges, capabilities, equipment, inventory, statusConditions, stageModifiers, capturedSpecies

**Pokemon:** moves, abilities, statusConditions, stageModifiers, baseRelations

**Encounter:** combatants (full `Combatant[]`), turnOrder, moveLog, gridConfig, tokenStates, fogOfWarState, terrainState, declarations, switchActions

**Scene:** characters, pokemon, groups

### Seed Sources
- `seed.ts` reads from three sources:
  1. Move data from CSV file
  2. Ability data (parsed from abilities section)
  3. Species data from `books/markdown/pokedexes/gen1..gen8+hisui/` — per-species markdown files via `parsePokedexContent()`
- `seed-encounter-tables.ts` — Habitat-based encounter tables
- `seed-hassan-chompy.ts`, `seed-ilaria-iris.ts` — Sample player characters with starter Pokemon

### Schema Sync & Migrations
- **No migrations directory** — project uses `npx prisma db push` for direct schema sync
- One-time data migration scripts (run manually with `npx tsx prisma/<script>.ts`):
  - `backfill-origin.ts` — Retroactively set `origin` field on existing Pokemon
  - `migrate-capabilities-key.ts` — Rename JSON key in capabilities column
  - `migrate-phantom-conditions.ts` — Convert invalid status conditions to PTU-correct equivalents

### Directory Contents
```
app/prisma/
  schema.prisma             # 14 models, SQLite database
  seed.ts                   # Main seed: moves CSV, species from pokedex markdown, abilities
  seed-encounter-tables.ts  # Habitat encounter tables
  seed-hassan-chompy.ts     # Player character: Hassan + Chompy (Totodile)
  seed-ilaria-iris.ts       # Player character: Ilaria + Iris (Bulbasaur)
  backfill-origin.ts        # One-time: set origin field + flip isInLibrary
  migrate-capabilities-key.ts    # One-time: rename JSON key
  migrate-phantom-conditions.ts  # One-time: convert phantom conditions
  ptu.db                    # Live SQLite database (8.8MB)
```

### Gotchas
- **SQLite JSON = TEXT**: All JSON stored as TEXT strings, parsed at application layer via `JSON.parse()`. No JSON path queries.
- **`isInLibrary` is an archive flag**: `false` = archived (hidden from sheets but still in DB). Name is misleading — it doesn't mean "in the library view."
- **UUID primary keys** on all models via `@default(uuid())`
- **Encounter combatants are denormalized JSON**: No FK to Pokemon/HumanCharacter tables. Entity state is serialized into the encounter for snapshot isolation.
- **`ptu.db` is the live database file** — committed to repo for development convenience. Do not `.gitignore` it.

## Verification

- File is 30-80 lines
- Model count matches schema.prisma (14 models)
- Origin enum values verified against actual schema + pokemon-generator.service.ts
- JSON field list verified against schema.prisma column definitions
