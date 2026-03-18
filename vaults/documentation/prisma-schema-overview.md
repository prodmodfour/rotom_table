# Prisma Schema Overview

14 models in the SQLite database:

```
HumanCharacter --1:N--> Pokemon (ownerId)
Encounter                (standalone, combatants as denormalized JSON)
Scene                    (standalone, characters/pokemon/groups as JSON refs — see scene-data-model)
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

Only one foreign key between entity models: `Pokemon.ownerId -> HumanCharacter.id`. Encounter combatants are [[denormalized-encounter-combatants|fully denormalized into JSON]].

All models use UUID primary keys (`@id @default(uuid())`) except [[singleton-models]] (`"default"` and `"singleton"`).

JSON fields use the [[json-as-text-columns]] pattern due to SQLite limitations. The database file (`ptu.db`) is gitignored — each developer generates it locally via [[schema-sync-strategy]].

## See also

- [[encounter-table-data-model]]
- [[pokemon-origin-enum]]
- [[seed-data-pipeline]]
- [[isinlibrary-archive-flag]]
- [[species-data-model]] — SpeciesData reference model for species lookup
- [[encounter-schema-normalization]] — a destructive proposal to normalize JSON columns into relational tables
