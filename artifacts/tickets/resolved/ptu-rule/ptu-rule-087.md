---
id: ptu-rule-087
title: Generated Pokemon start with 0 tutor points
priority: P3
severity: MEDIUM
status: in-progress
domain: pokemon-lifecycle
source: pokemon-lifecycle-audit.md (R022)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-087: Generated Pokemon start with 0 tutor points

## Summary

`generatePokemonData()` and `createPokemonRecord()` do not compute initial tutor points. All newly created Pokemon (wild spawns, template loads, manual creation) start with 0 tutor points regardless of level. A level 20 wild Pokemon should have 5 tutor points (1 initial + 4 from levels 5/10/15/20). Level-up tutor point gains via XP distribution work correctly, but there is no retroactive calculation at creation.

## Affected Files

- `app/server/services/pokemon-generator.service.ts` (`generatePokemonData`, `createPokemonRecord`)

## PTU Rule Reference

"Each Pokemon, upon hatching, starts with a single precious Tutor Point." Additional tutor points gained every 5 levels.

## Suggested Fix

Add tutor point calculation to `generatePokemonData()`: `tutorPoints = 1 + Math.floor(level / 5)` for level >= 1.

## Impact

All generated Pokemon have incorrect tutor point counts. Affects wild spawns, template loads, and manual creation.

## Fix Log

- **00b2f1f** — Added `tutorPoints` field to `GeneratedPokemonData` interface. Added calculation `tutorPoints = 1 + Math.floor(level / 5)` in `generatePokemonData()`. Passed computed value to `createPokemonRecord()` (Prisma write) and `createdPokemonToEntity()` (combatant entity). Files: `app/server/services/pokemon-generator.service.ts`.
- **7a1e409** — (code-review-194 CRITICAL-1 fix) Added missing `tutorPoints: 1 + Math.floor(pokemon.level / 5)` to the CSV import `GeneratedPokemonData` object literal. This code path builds `GeneratedPokemonData` manually (not via `generatePokemonData()`) and was missing the field after it became required. Files: `app/server/services/csv-import.service.ts`.
