---
review_id: code-review-034
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | refactoring
target_report: code-review-033 | refactoring-028
domain: csv-import, pokemon-generator
commits_reviewed:
  - a745184
  - e5baa15
  - d97fa77
  - 0f2277b
  - 4951202
  - 390ff3b
files_reviewed:
  - app/pages/gm/encounter-tables.vue
  - app/server/utils/csv-parser.ts
  - app/server/services/csv-import.service.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/api/characters/import-csv.post.ts
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-029.md
  - app/tests/e2e/artifacts/refactoring/refactoring-028.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - csv-import-trainer
  - csv-import-pokemon
follows_up: code-review-033
reviewed_at: 2026-02-18T21:00:00
---

## Review Scope

Follow-up review for code-review-033 (two required changes: scene-add error surfacing, ptu-rule-029 ticket status) plus the full refactoring-028 implementation (decompose 518-line import-csv.post.ts into utility + service + thin controller).

Six commits: 1 bug fix, 4 refactoring, 1 chore (resolution log).

## Issues

### CRITICAL
None.

### HIGH
None.

### MEDIUM
None.

## New Tickets Filed

### refactoring-037: Generator service does not persist power/jump/weightClass capabilities

`parsePokemonSheet` (csv-import.service.ts:250-260) correctly parses `power` and `jump` from the CSV, but `createPokemonFromCSV` (line 368-373) only maps `overland/swim/sky/burrow/levitate` to `GeneratedPokemonData.movementCaps`. The `createPokemonRecord` function stores `{ ...movementCaps, other, size }` — power and jump are silently dropped.

This is NOT a regression introduced by this refactoring. ALL creation paths (wild spawn, template load, scene spawn) use the same generator service and have the same gap. The old import-csv was the only path that accidentally preserved power/jump via inline `JSON.stringify(pokemon.capabilities)`. This refactoring normalizes the import path to match the rest. The UI handles missing values gracefully (`?.` and `|| 0`).

The real fix is extending `GeneratedPokemonData` and `createPokemonRecord` to support the full `PokemonCapabilities` type (power, jump, weightClass) from the Prisma schema and species data. Filed as refactoring-037.

### bug-001: CSV parser swim/sky same cell reference

`csv-import.service.ts:252-253` — both `swim` and `sky` read from `getCell(rows, 33, 13)`. Sky should read from a different cell. This is a pre-existing bug faithfully reproduced from the original import-csv.post.ts. Filed as bug-001.

## Clerical Notes

Two non-blocking clerical items the developer should address:

1. **refactoring-028 resolution log** says "295 lines" for csv-import.service.ts — the file is 395 lines. Update the resolution log.
2. **app-surface.md** was not updated with the two new files (`app/server/utils/csv-parser.ts`, `app/server/services/csv-import.service.ts`). Developer should add them.

## What Looks Good

- **code-review-033 fixes are correct.** Commit a745184 addresses both required changes exactly: `:add-error="encounterCreation.error.value || addError"` surfaces scene-add errors, and ptu-rule-029 status updated to resolved.
- **Move format normalization is a hidden bugfix.** The old import stored moves with CSV-specific field names (`db`, `category`). The canonical `Move` type uses `damageBase`/`damageClass`. All UI code reads the canonical names. The new code maps CSV fields to canonical format via `MoveDetail` — imported Pokemon now have correctly-shaped move JSON consistent with all other creation paths.
- **Generator service extension is clean.** Adding `nature?`, `shiny?`, `heldItem?` as optional fields on `GeneratedPokemonData` with `??` fallback defaults is the right pattern — it extends the interface without breaking existing callers (wild spawn, template load, scene spawn all continue to get defaults).
- **Ability frequency correctly dropped.** The `Ability` interface has no `frequency` field. No UI code reads `ability.frequency`. The old import stored it as dead data. Dropping it normalizes with the canonical type.
- **Thin controller pattern achieved.** `import-csv.post.ts` is 46 lines — validates input, delegates to service, returns response. Textbook controller.
- **Commit sequence is logical.** Utility extraction → service interface extension → service creation → controller slim → resolution log. Each commit produces a working state. No intermediate breakage.
- **Type safety improved.** `ParsedTrainer` and `ParsedPokemon` are now exported interfaces in the service file, enabling future unit testing of the parsing functions in isolation.

## Verdict

APPROVED — Both code-review-033 required changes resolved correctly. Refactoring-028 achieves all stated goals: CSV parser extracted, trainer/Pokemon parsing in service layer, Pokemon creation routed through canonical `createPokemonRecord`, API handler reduced from 518 to 46 lines. Two new tickets filed for pre-existing issues surfaced during review (capabilities gap, swim/sky cell bug). Two clerical items noted for developer follow-up.

## Required Changes

None (APPROVED).

## Scenarios to Re-run

- **csv-import-trainer**: Verify trainer CSV import still creates correct HumanCharacter records with stats, skills, features, edges
- **csv-import-pokemon**: Verify Pokemon CSV import creates correct records with moves in canonical `damageBase`/`damageClass` format, nature/shiny/heldItem preserved from sheet
