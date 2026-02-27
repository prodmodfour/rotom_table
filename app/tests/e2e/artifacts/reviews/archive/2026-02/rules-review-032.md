---
review_id: rules-review-032
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-037, refactoring-036
domain: pokemon-generation
commits_reviewed:
  - 68912b1
  - f18ccf3
  - 8cbfee1
  - 04e407b
  - 8a05afd
mechanics_verified:
  - power-capability
  - jump-capability
  - weight-class
  - size-capability
  - capabilities-json-shape
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#capabilities
  - pokedexes/how-to-read.md#capability-list
  - pokedexes/how-to-read.md#weight-class
  - core/07-combat.md#falling-damage
reviewed_at: 2026-02-18T22:30:00
---

## Review Scope

Verifying PTU correctness of Developer's fix for:
- **refactoring-037** (P1, PTU-INCORRECT + EXT-DUPLICATE): Generator capabilities data model missing power/jump/weightClass
- **refactoring-036** (P2, PTU-INCORRECT): CSV import hardcodes size as 'Medium'

Five commits reviewed: 68912b1 (schema + seed parser), f18ccf3 (generator service), 8cbfee1 (CSV import), 04e407b (ticket logs), 8a05afd (seed type fix).

Files with mechanics changes:
- `app/prisma/schema.prisma` — new SpeciesData columns
- `app/prisma/seed.ts` — pokedex parsing regexes
- `app/server/services/pokemon-generator.service.ts` — capabilities propagation
- `app/server/services/csv-import.service.ts` — CSV import capabilities + size fix

## Mechanics Verified

### Power Capability (Seed Parser)
- **Rule:** Every Pokemon species has a Power stat listed in the Capability List. "Power by +1. If Combat is at least Adept, raise Power by +1." (`core/02-character-creation.md:324-326`). Pokedex format: "Power N" in Capability List.
- **Implementation:** Regex `Power\s+(\d+)` applied to capability text, default 1. Stored as `SpeciesData.power`, propagated via `GeneratedPokemonData.power` to capabilities JSON.
- **Status:** CORRECT
- **Validation:** Bulbasaur=2, Charizard=8, Onix=10, Magikarp=1, Geodude=3 — all match pokedex entries.

### Jump Capability (Seed Parser)
- **Rule:** "High Jump determines how high a Trainer or Pokemon can jump in meters." (`core/02-character-creation.md:327-328`). "Long Jump is how much horizontal distance a Trainer or Pokemon can jump in meters." (`core/02-character-creation.md:342-343`). Pokedex format: "Jump X/Y" where X=High Jump, Y=Long Jump. Example: "Power 5, High Jump 0, Long Jump 1" (`core/02-character-creation.md:367`).
- **Implementation:** Regex `Jump\s+(\d+)\s*\/\s*(\d+)` — group 1 = high, group 2 = long. Stored as `SpeciesData.jumpHigh` / `SpeciesData.jumpLong`. Propagated as `jump: { high, long }` in capabilities JSON.
- **Status:** CORRECT
- **Validation:** Bulbasaur=0/2, Charizard=2/3, Onix=2/3, Magikarp=3/3, Abra=1/1, Geodude=0/1 — all match pokedex entries. High Jump=0 correctly parsed (not defaulting to 1).

### Weight Class (Seed Parser)
- **Rule:** "Weight Classes are used for several Abilities and Moves. They range from 1 to 6 and are labeled in the parenthesis after weights." (`pokedexes/how-to-read.md`, page 8). Pokedex format: "Weight : X lbs. / Ykg (N)" where N=Weight Class. Used for fall damage calculations (`core/07-combat.md:1761-1767`).
- **Implementation:** Regex `Weight\s*:\s*[^(]*\((\d+)\)` applied to full page text (not capability text — correct since Weight Class appears in Size Information, not Capability List). Stored as `SpeciesData.weightClass`, default 1.
- **Status:** CORRECT
- **Validation:** Bulbasaur=1, Charizard=4, Onix=6, Abra=2, Magikarp=1 — all match pokedex entries.

### Size Capability (CSV Import Fix — refactoring-036)
- **Rule:** "Pokemon sizes vary from Small, to Medium, to Large, to Huge and finally, Gigantic. On a grid, both Small and Medium Pokemon would take up one space, or a 1x1m square... Large Pokemon occupy 2x2 spaces... Huge Pokemon occupy 3x3 spaces... Gigantic Pokemon occupies 4x4 spaces." (`pokedexes/how-to-read.md`, page 8). Size is a species-level trait listed in the pokedex Size Information section.
- **Implementation:** Changed from `size: 'Medium'` (hardcoded) to `size: speciesData?.size ?? 'Medium'`. Species data is already queried in the function.
- **Status:** CORRECT
- **Validation:** Onix (Huge, 3x3), Steelix (Huge, 3x3), Wailord (Large, 2x2) will now get correct sizes when imported via CSV.

### Capabilities JSON Shape Alignment
- **Rule:** N/A (type consistency, not PTU rule)
- **Implementation:** `createPokemonRecord` now stores `{ ...movementCaps, power, jump: { high, long }, weightClass, size, otherCapabilities }`. The `as unknown as Pokemon['capabilities']` double-cast was replaced with `as Pokemon['capabilities']` single-cast. Field `other` renamed to `otherCapabilities` to match the `PokemonCapabilities` type.
- **Status:** CORRECT — stored JSON shape now matches the TypeScript interface for all PTU capability fields.

### CSV Import Power/Jump Propagation
- **Rule:** Power and Jump are species capabilities that may be present on individual character sheets.
- **Implementation:** `power: pokemon.capabilities.power` and `jump: pokemon.capabilities.jump` sourced from parsed CSV data. `weightClass: speciesData?.weightClass ?? 1` sourced from species data (correct — weightClass is not typically in CSV character sheets).
- **Status:** CORRECT

### Default Values When Species Not Found
- **Rule:** Power ranges 1-10+ per PTU pokedex entries. Jump ranges 0/1 to 6/6+. Weight Class ranges 1-6.
- **Implementation:** Defaults: power=1, jump={high:1, long:1}, weightClass=1. Schema defaults: `@default(1)` for all four columns.
- **Status:** CORRECT — minimum valid values used as fallbacks when species lookup fails.

## Summary
- Mechanics checked: 7
- Correct: 7
- Incorrect: 0
- Needs review: 0

## Pre-Existing Issues (Not Introduced by These Commits)

### 1. CSV Import swim/sky Duplicate Cell Reference
- **File:** `csv-import.service.ts:252-253`
- **Issue:** Both `swim` and `sky` read from `getCell(rows, 33, 13)`. All CSV-imported Pokemon get the same value for swim and sky capability. One of these is reading the wrong cell.
- **Severity:** MEDIUM (affects CSV-imported Pokemon only, swim/sky on flyers would be wrong)
- **Introduced:** Commit `0f2277b` (original CSV import extraction)
- **Ticket:** ptu-rule-030

### 2. Teleport Capability Never Parsed from Pokedex
- **File:** `seed.ts:493` — `teleport: 0` hardcoded
- **Issue:** Species with "Teleporter N" in capabilities (e.g., Abra: Teleporter 2) get teleport=0 in SpeciesData. The `movementCaps` object in the generator also omits teleport. `PokemonCapabilities.teleport` (optional) is never populated.
- **Severity:** MEDIUM (affects narrative movement for Teleporter species, not combat mechanics)
- **Ticket:** ptu-rule-031

### 3. `other` → `otherCapabilities` Key Rename Without Data Migration
- **File:** `pokemon-generator.service.ts` (commit f18ccf3)
- **Issue:** Existing Pokemon records in the database have capabilities JSON with key `"other": [...]`. New code writes and reads `"otherCapabilities"`. The UI (`PokemonCapabilitiesTab.vue:42`) reads `capabilities?.otherCapabilities` which will be `undefined` for existing records, silently hiding their "Other Capabilities" (Naturewalk, Underdog, etc.).
- **Severity:** HIGH (all existing Pokemon lose other-capabilities display)
- **Introduced:** Commit f18ccf3 (these commits)
- **Ticket:** bug-003

## Rulings
No ambiguous rulings required. All mechanics verified have clear rulebook definitions.

## Verdict
**APPROVED** — All PTU mechanics in the reviewed commits are correctly implemented. Power, Jump (High/Long), and Weight Class are correctly parsed from pokedex entries, propagated through the generator service, and stored in the capabilities JSON matching the `PokemonCapabilities` type. The CSV import size fix correctly uses species data. Two pre-existing issues found and ticketed (ptu-rule-030, ptu-rule-031). One non-PTU data migration concern flagged.

## Required Changes
None — all PTU mechanics are correct.
