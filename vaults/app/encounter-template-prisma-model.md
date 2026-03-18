# Encounter Template Prisma Model

The `EncounterTemplate` model in `app/prisma/schema.prisma` defines the database table for templates.

Fields: `id` (UUID), `name`, `description` (nullable), `battleType` (defaults to "trainer"), `combatants` (TEXT, defaults to "[]"), `tags` (TEXT, defaults to "[]"), `category` (nullable), `createdAt`, `updatedAt`.

Grid configuration is stored as [[encounter-template-grid-config-uses-separate-columns|six separate nullable columns]] rather than a JSON blob: `gridWidth`, `gridHeight`, `gridCellSize`, `gridIsometric`, `gridCameraAngle`, `gridMaxElevation`.

The model has no foreign keys to other tables. Templates are fully self-contained snapshots with no runtime references to Pokemon or character records.

## See also

- [[encounter-template-combatants-stored-as-json-text]] — how combatants and tags are serialized
- [[encounter-template-stores-combatant-snapshots]] — what the combatant snapshot data contains
