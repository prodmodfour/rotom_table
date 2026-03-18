# Prisma-Derived vs Hand-Written Types

Types in [[type-file-classification]] fall into two categories:

**Prisma-aligned** (shape mirrors DB model, enriched with TypeScript unions for JSON fields):
- `character.ts` — `Pokemon` and `HumanCharacter` match Prisma models
- `species.ts` — `SpeciesData` mirrors Prisma `SpeciesData` model
- `encounter.ts` — `Encounter` mirrors Prisma `Encounter` model (partial)

**Hand-written** (runtime state only, no DB backing):
- All other type files (`combat.ts`, `spatial.ts`, `scene.ts`, `habitat.ts`, `template.ts`, `api.ts`, `settings.ts`, `player.ts`, `player-sync.ts`, `vtt.ts`, `guards.ts`)

The Prisma-aligned types act as the contract between [[json-as-text-columns|JSON TEXT columns]] in the database and typed TypeScript on the client.
