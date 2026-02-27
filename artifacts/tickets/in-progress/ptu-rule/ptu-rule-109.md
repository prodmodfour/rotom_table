---
ticket_id: ptu-rule-109
ticket_type: ptu-rule
priority: P3
status: in-progress
domain: capture
topic: legendary-species-list-incomplete
source: rules-review-161 M1
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/constants/legendarySpecies.ts
---

## Summary

The `LEGENDARY_SPECIES` constant in `legendarySpecies.ts` is missing several mythical/legendary Pokemon that exist in the PTU pokedex data.

## Missing Species

- **Meltan** (Gen 8 mythical, `books/markdown/pokedexes/gen8/meltan.md`)
- **Melmetal** (Gen 8 mythical, `books/markdown/pokedexes/gen8/melmetal.md`)
- **Zarude** (Gen 8 mythical, `books/markdown/pokedexes/gen8/zarude.md`)
- **Enamorus** (Hisui legendary, Force of Nature alongside Tornadus/Thundurus/Landorus)

## Impact

These Pokemon would not get the -30 capture rate modifier per PTU p.214. The GM override (`isLegendary` param on rate endpoint) provides a workaround.

## Required Fix

Add the missing species to `LEGENDARY_SPECIES` in `app/constants/legendarySpecies.ts`.

## Resolution Log

**Branch:** slave/3-dev-combat-cs-fix-20260226

**Commit:** `bddd907` fix: add missing legendary species Meltan, Melmetal, Zarude, Enamorus

**Files changed:**
- `app/constants/legendarySpecies.ts` — Added Meltan, Melmetal (Gen 8 section), Zarude (Gen 8 section), Enamorus (new Hisui section)
