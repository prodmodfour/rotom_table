---
ticket_id: refactoring-037
priority: P1
categories:
  - PTU-INCORRECT
  - EXT-DUPLICATE
affected_files:
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/csv-import.service.ts
estimated_scope: medium
status: resolved
source: code-review-034
created_at: 2026-02-18T21:00:00
---

## Summary

`GeneratedPokemonData.movementCaps` only includes `overland/swim/sky/burrow/levitate`, but the canonical `PokemonCapabilities` type (`app/types/character.ts:31-44`) also defines `power`, `jump` (high/long), and `weightClass`. The `createPokemonRecord` function stores capabilities as `{ ...movementCaps, other, size }` — missing `power`, `jump`, and `weightClass`.

This affects ALL Pokemon creation paths (wild spawn, template load, scene spawn, CSV import). The UI reads these fields (`PokemonCapabilitiesTab.vue:26-30`, `gm/pokemon/[id].vue:344-348`) and displays 0 for all Pokemon.

## Findings

### Finding 1: PTU-INCORRECT
- **Metric:** Power and Jump are PTU capability stats parsed from species data and CSV sheets but never persisted
- **Impact:** All Pokemon display 0 for Power and 0/0 for Jump in the capabilities tab
- **Evidence:**
  - `PokemonCapabilities` type defines `power: number` and `jump: { high: number; long: number }` (character.ts:38-39)
  - `GeneratedPokemonData.movementCaps` omits both (pokemon-generator.service.ts:54)
  - `createPokemonRecord` stores `{ ...movementCaps, other, size }` (pokemon-generator.service.ts:196-200)
  - CSV import parses power/jump (csv-import.service.ts:251-260) but drops them in mapping (lines 368-373)
  - SpeciesData Prisma model may need `power`/`jump` columns or these may need to come from parsed species data

### Finding 2: EXT-DUPLICATE
- **Metric:** Capabilities shape differs between type definition and generator output
- **Impact:** Type says `PokemonCapabilities`, generator produces a different shape. TypeScript won't catch this because capabilities is stored as JSON string.
- **Evidence:** The `createdPokemonToEntity` function (pokemon-generator.service.ts:265-269) casts capabilities via `as unknown as Pokemon['capabilities']` to work around the shape mismatch

## Suggested Refactoring

1. Check if `SpeciesData` Prisma model has power/jump/weightClass columns. If not, check if they can be derived from the parsed species data in seed.ts
2. Add `power`, `jump`, `weightClass` to `GeneratedPokemonData.movementCaps` (or create a separate `capabilities` field matching `PokemonCapabilities`)
3. Update `generatePokemonData` to populate these fields from species data
4. Update `createPokemonRecord` to persist the full capabilities shape
5. Update `createPokemonFromCSV` to pass power/jump from parsed CSV data
6. Remove the `as unknown` cast in `createdPokemonToEntity`

Estimated commits: 2-3

## Related

- refactoring-028: Parent refactoring that routed CSV import through generator service
- refactoring-036: Related size hardcoding issue in CSV import
- code-review-034: Surfaced this issue during review

## Resolution Log
- Commits: 68912b1, f18ccf3, 8cbfee1
- Files changed: app/prisma/schema.prisma (added power, jumpHigh, jumpLong, weightClass to SpeciesData), app/prisma/seed.ts (parse Power/Jump/weightClass from pokedex), app/server/services/pokemon-generator.service.ts (extend GeneratedPokemonData, persist full capabilities shape, remove as unknown cast), app/server/services/csv-import.service.ts (pass power/jump/weightClass, fix size hardcoding)
- New columns: SpeciesData.power, SpeciesData.jumpHigh, SpeciesData.jumpLong, SpeciesData.weightClass
- Stored capabilities JSON now matches PokemonCapabilities type: includes power, jump {high, long}, weightClass, renamed 'other' to 'otherCapabilities'
- Tests passing: typecheck and vitest confirm no regressions
