---
ticket_id: refactoring-010
priority: P1
categories:
  - FEATURE_GAP
  - PTU-INCORRECT
affected_files:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/grid-placement.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/from-scene.post.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-16T22:00:00
---

## Summary

Pokemon size capability (Small/Medium/Large/Huge/Gigantic) is never seeded, stored, or used for grid token sizing. All Pokemon get `tokenSize=1` on the VTT grid regardless of their PTU size class. A Steelix (Gigantic, should occupy 4x4 cells) renders the same as a Pikachu (Small, 1x1 cell).

## Findings

### Finding 1: FEATURE_GAP — Size data not in the pipeline

The size data exists in the pokedex source files:
- `books/markdown/pokedexes/gen1/onix.md`: "Height: 28' 10" / 8.8m (Huge)"
- `books/markdown/pokedexes/gen2/steelix.md`: "Height: 30' 2" / 9.2m (Gigantic)"
- `books/markdown/pokedexes/gen1/pikachu.md`: "Height: 1' 4" / 0.4m (Small)"

But it's never captured:
- **SpeciesData** (schema.prisma:235) has no `size` column
- **seed.ts** does not parse the "Size Information" section from pokedex markdown
- **generatePokemonData()** (pokemon-generator.service.ts:80-146) has no size in its return type
- **createPokemonRecord()** stores capabilities as `{ overland, swim, sky, burrow, levitate, other: [...] }` — no `size` field

### Finding 2: PTU-INCORRECT — Dead code in combatants.post.ts

`combatants.post.ts:38-39` reads `capabilities.size` and calls `sizeToTokenSize()`:
```typescript
const capabilities = entity.capabilities ? JSON.parse(entity.capabilities) : {}
tokenSize = sizeToTokenSize(capabilities.size)
```

Since `capabilities.size` is always `undefined` (never stored by the generator), `sizeToTokenSize(undefined)` always returns `1` via the default case. This code looks correct but has zero effect.

### Finding 3: PTU-INCORRECT — Token sizing inconsistency now moot

refactoring-002 Finding 2 noted that `combatants.post.ts` derives `tokenSize` from capabilities while `wild-spawn.post.ts` hardcodes `tokenSize = 1`. Both paths produce identical results because size is never populated. The inconsistency is cosmetic, but the underlying bug (no size data at all) is real.

## Suggested Fix

1. **Add `size` column to SpeciesData** — `size String @default("Medium")` (enum values: Small, Medium, Large, Huge, Gigantic)
2. **Update seed.ts** — Parse "Size Information" section from pokedex markdown, extract the size class from the parenthetical after height (e.g., "(Huge)")
3. **Run migration** — `npx prisma migrate dev`
4. **Update `GeneratedPokemonData`** — Add `size: string` field
5. **Update `generatePokemonData()`** — Read `speciesData.size` (default 'Medium')
6. **Update `createPokemonRecord()`** — Include `size` in capabilities JSON
7. **Update `buildPokemonCombatant()`** — Derive `tokenSize` from `data.size` via `sizeToTokenSize()` instead of accepting it as a parameter
8. **Update callers** — `wild-spawn.post.ts`, `from-scene.post.ts`, `combatants.post.ts` no longer need to pass `tokenSize` manually

Estimated commits: 4-5

## PTU Reference

PTU 1.05 Size Classes (Chapter 9 — Pokemon Size):
- Small: 1x1 cell
- Medium: 1x1 cell
- Large: 2x2 cells
- Huge: 3x3 cells
- Gigantic: 4x4 cells

These directly map to the existing `sizeToTokenSize()` function in `grid-placement.service.ts`.

## Related

- refactoring-002: Extracted `grid-placement.service.ts` with `sizeToTokenSize()` — the function is correct, just never receives real data
- code-review-007: Identified this gap during review of refactoring-002

## Resolution Log

**Resolved**: 2026-02-16

### Commits

1. `96fd6e2` — `feat: add size column to SpeciesData and parse from pokedex`
   - `app/prisma/schema.prisma`: added `size String @default("Medium")` to SpeciesData
   - `app/prisma/seed.ts`: added `size` to SpeciesRow, parsed from Height line regex, included in upsert

2. `11ad0ff` — `feat: include size in GeneratedPokemonData and capabilities JSON`
   - `app/server/services/pokemon-generator.service.ts`: added `size` to interface, read from speciesData, stored in capabilities JSON

3. `0a5d6ba` — `refactor: derive tokenSize from species size in buildPokemonCombatant`
   - `app/server/services/pokemon-generator.service.ts`: removed `tokenSize` param, derived internally via `sizeToTokenSize(data.size)`

4. `6d67ac4` — `refactor: remove manual tokenSize from combatant creation callers`
   - `app/server/api/encounters/[id]/wild-spawn.post.ts`: derive tokenSize from `created.data.size` for placement, drop 4th arg
   - `app/server/api/encounters/from-scene.post.ts`: same pattern
   - `app/server/api/encounter-templates/[id]/load.post.ts`: drop 4th arg (templates use stored positions)

### Verification

- DB seeded with correct sizes: Pikachu→Small, Onix→Huge, Steelix→Gigantic, Snorlax→Large
- Size distribution: 403 Small, 348 Medium, 96 Large, 28 Huge, 14 Gigantic
- All 446 unit tests pass (1 pre-existing settings default failure unrelated)
- `combatants.post.ts` path works automatically — already calls `sizeToTokenSize(capabilities.size)`, now receives real data
