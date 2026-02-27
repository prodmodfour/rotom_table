---
review_id: rules-review-036
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-031
domain: pokemon-generation
commits_reviewed:
  - 49eef1d
mechanics_verified:
  - teleporter-capability-parsing
  - movement-capability-data-flow
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - pokedexes/gen1/abra.md#Capability-List
  - pokedexes/gen1/kadabra.md#Capability-List
  - pokedexes/gen1/alakazam.md#Capability-List
  - pokedexes/gen4/palkia.md#Capability-List
  - pokedexes/gen6/hoopa-confined.md#Capability-List
  - pokedexes/gen6/hoopa-unbound.md#Capability-List
  - pokedexes/hisui/palkia-origin.md#Capability-List
reviewed_at: 2026-02-18T23:00:00
---

## Review Scope

Reviewing commit 49eef1d (fix: parse Teleporter capability from pokedex data) for ptu-rule-031. The fix adds parsing of the "Teleporter N" capability from pokedex Capability List text in the seed parser, and threads the parsed value through the pokemon-generator service and CSV import service.

Files changed:
- `app/prisma/seed.ts` — Teleporter regex, SpeciesRow interface, skipWords, DB insert
- `app/server/services/pokemon-generator.service.ts` — movementCaps type, default, species data read
- `app/server/services/csv-import.service.ts` — capabilities type, movementCaps construction

## Mechanics Verified

### Teleporter Capability Parsing

- **Rule:** Pokedex Capability Lists include "Teleporter N" for species with teleport movement. Seven species have this capability in the PTU 1.05 pokedex data: Abra (Teleporter 2), Kadabra (Teleporter 2), Alakazam (Teleporter 3), Palkia (Teleporter 4), Palkia-Origin (Teleporter 4), Hoopa-Confined (Teleporter 10), Hoopa-Unbound (Teleporter 8).
- **Implementation:** Regex `/Teleporter\s+(\d+)/i` extracts the numeric value from capability text. Defaults to 0 via `parseInt(teleportMatch?.[1] || '0', 10)` when no match. "teleporter" added to `skipWords` set to prevent duplication in `otherCapabilities` array.
- **Status:** CORRECT
- **Notes:** Regex correctly matches the exact format used across all 7 species files. Case-insensitive flag handles any casing variation. Default 0 correctly handles the 987 species without Teleporter (e.g., Ralts has Telekinetic/Telepath but no Teleporter — correctly yields 0). The `skipWords` addition prevents "Teleporter" from also appearing as a text capability in `otherCapabilities`.

### Movement Capability Data Flow

- **Rule:** Teleporter is a movement capability analogous to Overland/Swim/Sky/Burrow/Levitate — it should be stored as a numeric value and flow through to the Pokemon record's capabilities JSON.
- **Implementation:** Three-site data flow verified:
  1. **Seed → SpeciesData:** `teleport: s.teleport` replaces hardcoded `teleport: 0` in DB insert. SpeciesData schema has `teleport Int @default(0)`.
  2. **Generator → Pokemon:** `movementCaps` type includes `teleport: number`, reads `speciesData.teleport`, defaults to 0 for unknown species. `createPokemonRecord` spreads `...data.movementCaps` into capabilities JSON (line 210), so teleport is persisted.
  3. **CSV Import → Pokemon:** `teleport?: number` (optional) in `ParsedPokemon.capabilities`, constructed as `teleport: pokemon.capabilities.teleport ?? 0` in `movementCaps`. Nullish coalescing handles CSV sheets that lack a teleport column.
- **Status:** CORRECT
- **Notes:** Consistent with how all other movement capabilities (overland, swim, sky, burrow, levitate) are handled. The `PokemonCapabilities` type in `character.ts:37` already had `teleport?: number` — it was just never populated until this fix.

## Summary

- Mechanics checked: 2
- Correct: 2
- Incorrect: 0
- Needs review: 0

## Ticket Documentation Note

The ticket (ptu-rule-031) listed example values "Kadabra: Teleporter 5" and "Alakazam: Teleporter 7" — the actual pokedex values are Kadabra: Teleporter 2 and Alakazam: Teleporter 3. This is a minor ticket documentation error only; the code fix correctly parses actual values from source files and is not affected.

## Rulings

No ambiguous rules. Teleporter is a standard numeric movement capability with the same data shape as Overland/Swim/Sky/Burrow/Levitate.

## Verdict

APPROVED — Fix correctly parses Teleporter capability from all 7 species that have it, defaults to 0 for the remaining ~987 species, and threads the value through all three Pokemon creation paths (seed, generator, CSV import) consistent with existing movement capability patterns.

## Required Changes

None.
