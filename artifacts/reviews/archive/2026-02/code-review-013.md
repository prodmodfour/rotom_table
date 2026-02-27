---
review_id: code-review-013
target: refactoring-010
type: plan-review
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16T23:00:00
reviewed_files:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/grid-placement.service.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
  - books/markdown/pokedexes/gen1/onix.md
  - books/markdown/pokedexes/gen1/pikachu.md
  - books/markdown/pokedexes/gen2/steelix.md
scenarios_to_rerun: []
---

## Summary

Plan review for refactoring-010 (seed Pokemon size capability for VTT token sizing). The plan proposes 5 commits: add `size` column to SpeciesData, parse from pokedex, include in generator output and capabilities JSON, derive tokenSize inside `buildPokemonCombatant`, and update callers to stop passing manual tokenSize.

## Verification

All plan claims verified against codebase:

1. **SpeciesData schema** — `capabilities` field at line 266, no existing `size` column. Plan's placement after `capabilities` is correct.
2. **Pokedex regex** — Validated against 3 species files: Pikachu `(Small)`, Onix `(Huge)`, Steelix `(Gigantic)`. Format consistent: `Height : <measurement> (<Size>)`.
3. **pokemon-generator.service.ts** — `GeneratedPokemonData` interface (lines 35-56), `generatePokemonData` (lines 72-147), `createPokemonRecord` (lines 153-206), `buildPokemonCombatant` (lines 275-340) all match plan's line references.
4. **3 callers confirmed** — grep shows exactly 3 call sites: `wild-spawn.post.ts:62`, `from-scene.post.ts:86`, `load.post.ts:71`.
5. **combatants.post.ts** — Uses `buildCombatantFromEntity` (not `buildPokemonCombatant`), already reads `capabilities.size` at line 44-45. Will work automatically once capabilities JSON is populated.
6. **findPlacementPosition** — Mutates `occupiedCells` via `markOccupied()` (line 142). Multi-cell tokens in batch spawns will not overlap.

## Issues

### MEDIUM #1: TypeScript type error — `size` in combatant entity capabilities

**Location:** Commit 2, bullet: "Add size: data.size in buildPokemonCombatant() entity capabilities (line ~330-333)"

**Problem:** `CombatantData.entity.capabilities` type (pokemon-generator.service.ts:263) is:
```typescript
capabilities: { overland: number; swim: number; sky: number; burrow: number; levitate: number; other: string[] }
```
No `size` field. Adding `size: data.size` will fail TypeScript compilation.

**Required fix:** Remove this bullet from Commit 2. The combatant entity capabilities don't need `size` — the VTT reads `combatant.tokenSize` (derived in Commit 3), and `combatants.post.ts` reads `capabilities.size` from the DB record (populated by `createPokemonRecord`), not the combatant entity.

## What Looks Good

- Commit structure ensures each step produces a working state
- Regex is case-insensitive with safe 'Medium' default
- Template tokenSize loss is a non-issue (all existing templates have tokenSize=1)
- `combatants.post.ts` auto-fix identification is correct and saves an unnecessary code change
- Verification steps include spot-checks for known species sizes

## Verdict

**APPROVED** — Remove the `size: data.size` from combatant entity capabilities (Commit 2, last bullet). All other plan elements are correct. Proceed to implementation.
