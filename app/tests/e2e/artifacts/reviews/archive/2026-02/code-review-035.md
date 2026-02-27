---
review_id: code-review-035
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-037, refactoring-036
domain: pokemon-generation
commits_reviewed:
  - 68912b1
  - f18ccf3
  - 8cbfee1
  - 04e407b
  - 8a05afd
files_reviewed:
  - app/prisma/schema.prisma
  - app/prisma/seed.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/csv-import.service.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
scenarios_to_rerun:
  - wild-pokemon-spawn
  - csv-import
  - pokemon-capabilities-display
reviewed_at: 2026-02-18T22:30:00
---

## Review Scope

Reviewed 5 commits implementing refactoring-037 (add power/jump/weightClass to generator capabilities data model) and refactoring-036 (fix size hardcoding in CSV import). Verified schema changes, seed parser regexes, generator service, CSV import service, and type alignment.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

1. **Pre-existing: swim/sky CSV parser duplication** — `csv-import.service.ts:252-253`
   ```typescript
   swim: parseNumber(getCell(rows, 33, 13)) || 0,
   sky: parseNumber(getCell(rows, 33, 13)) || 0,   // same cell as swim
   ```
   Both `swim` and `sky` read from row 33, col 13 — copy-paste bug. All CSV-imported Pokemon get `sky = swim` instead of the correct sky value. Not introduced by this change but discovered during review. Filed as `bug-002`.

2. **Pre-existing: `other` → `otherCapabilities` rename doesn't migrate existing DB records** — `pokemon-generator.service.ts:214`
   The old generator stored `"other": [...]` in the capabilities JSON. The UI reads `otherCapabilities`. The rename fixes new records but existing Pokemon still have the old key. Practical impact is low (old records were already broken for this field), but a one-time data migration would clean it up. Filed as `refactoring-038`.

## What Looks Good

- **Schema + seed parser alignment is solid.** New columns (`power`, `jumpHigh`, `jumpLong`, `weightClass`) with `@default(1)` sensible defaults. Regexes verified against actual pokedex files — Power, Jump `N/N`, and Weight Class `(N)` patterns all match correctly across Gen 1 samples.
- **Generator data model now matches `PokemonCapabilities` type.** The `as unknown` intermediate cast was correctly removed — the shape is close enough for a simple `as` cast (only `size: string` vs the union literal still needs it).
- **CSV import gets both fixes right.** Power/jump come from the parsed CSV sheet data (which already had the cells mapped), weightClass falls back to speciesData (not present in standard PTU CSV sheets), and size now uses `speciesData?.size ?? 'Medium'` instead of hardcoded `'Medium'`.
- **Commit granularity is correct.** Schema+seed (68912b1) → generator service (f18ccf3) → CSV import (8cbfee1) → docs (04e407b) → type fix (8a05afd). Each commit builds on the previous without broken intermediate states.
- **app-surface.md updated** with the server services table — good documentation hygiene.

## Verdict

APPROVED — Both refactoring tickets are correctly resolved. The generator now persists the full capabilities shape matching `PokemonCapabilities`. CSV import reads power/jump from the sheet and derives size/weightClass from species data. Two pre-existing issues discovered and filed as separate tickets.

## Required Changes

None — approved as-is. Pre-existing issues filed as separate tickets.

## Scenarios to Re-run

- wild-pokemon-spawn: Newly spawned Pokemon should have correct power/jump/weightClass in capabilities
- csv-import: Imported Pokemon should have correct size and power/jump/weightClass
- pokemon-capabilities-display: UI should show non-zero values for power, jump, and weight class
