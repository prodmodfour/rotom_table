---
ticket_id: ptu-rule-031
type: ptu-rule
priority: P2
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T22:30:00
domain: pokemon-generation
severity: MEDIUM
affected_files:
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
---

## Summary

The Teleport/Teleporter capability is never parsed from pokedex data. `seed.ts` hardcodes `teleport: 0` for all species. Species with "Teleporter N" in their Capability List (e.g., Abra: Teleporter 2, Kadabra: Teleporter 5) get teleport=0 in SpeciesData. The generator's `movementCaps` also omits teleport, so the capabilities JSON never includes it.

## Details

1. **Seed parser** (`seed.ts`): Has regexes for Overland, Swim, Sky, Burrow, Levitate, Power, Jump — but no `Teleporter\s+(\d+)` regex
2. **Seed insert** (`seed.ts:493`): Hardcodes `teleport: 0` instead of reading from parsed data
3. **Generator** (`pokemon-generator.service.ts`): `movementCaps` only includes `{ overland, swim, sky, burrow, levitate }` — no teleport
4. **Type** (`character.ts:37`): `PokemonCapabilities` has `teleport?: number` (optional) — never populated

## PTU Reference

Pokedex Capability Lists include "Teleporter N" for psychic/ghost species. Examples:
- Abra: `Teleporter 2` (`pokedexes/gen1/abra.md`)
- Kadabra/Alakazam: `Teleporter 5`/`Teleporter 7`

Teleporter determines how far a Pokemon can teleport as a movement capability, analogous to Overland/Swim/Sky/Burrow/Levitate for other movement types.

## Impact

Teleporter species cannot use their teleport movement capability in the VTT or any system that reads capabilities. Narrative-only impact (teleport is not used in combat calculations), but it is an incorrect species data omission.

## Suggested Fix

1. Add teleport regex to seed parser: `const teleportMatch = capText.match(/Teleporter\s+(\d+)/i)`
2. Use parsed value in seed insert: `teleport: parseInt(teleportMatch?.[1] || '0', 10)`
3. Add `teleport` to `movementCaps` in generator (or as a separate field like power/jump)
4. Include in capabilities JSON for persistence

## Source

Found during rules-review-032 (review of refactoring-036/037). Pre-existing since initial seed implementation.

## Fix Log

- **Commit:** 49eef1d
- **Files changed:**
  - `app/prisma/seed.ts` — Added `Teleporter` regex to capability parser, added `teleport` to `SpeciesRow` interface and parsed species object, replaced hardcoded `teleport: 0` with parsed value, added `'teleporter'` to `skipWords` set to prevent duplication in `otherCapabilities`
  - `app/server/services/pokemon-generator.service.ts` — Added `teleport` to `movementCaps` type, default object, and species data read. Flows through to capabilities JSON via existing spread.
  - `app/server/services/csv-import.service.ts` — Added optional `teleport` to CSV capabilities type and `movementCaps` construction (defaults to 0 since CSV sheets don't have a dedicated teleport cell)
