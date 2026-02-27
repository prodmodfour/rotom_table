---
id: ptu-rule-087
title: Generated Pokemon start with 0 tutor points
priority: P3
severity: MEDIUM
status: open
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
