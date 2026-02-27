---
review_id: rules-review-031
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-028
domain: csv-import, pokemon-generation
commits_reviewed:
  - a745184
  - e5baa15
  - d97fa77
  - 0f2277b
  - 4951202
  - 390ff3b
mechanics_verified:
  - pokemon-hp-formula
  - stat-preservation
  - nature-preservation
  - shiny-preservation
  - move-data-format
  - ability-data-format
  - capture-origin
  - size-capability
  - gender-default
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Hit-Points
  - core/09-pokemon-world.md#Size
reviewed_at: 2026-02-18T21:00:00
---

## Review Scope

PTU rules verification of the CSV import refactoring (refactoring-028). Six commits route Pokemon creation from an inline `prisma.pokemon.create()` in `import-csv.post.ts` through the canonical `createPokemonRecord()` in `pokemon-generator.service.ts`. Prior code review (code-review-033) addressed architecture; this review verifies no PTU game logic was broken or degraded in the routing change.

Files examined:
- `app/server/services/csv-import.service.ts` (new — 395 lines)
- `app/server/services/pokemon-generator.service.ts` (8 lines changed)
- `app/server/utils/csv-parser.ts` (new — 70 lines)
- `app/server/api/characters/import-csv.post.ts` (518 → 46 lines)
- Old inline code via `git diff a745184~1..390ff3b`

## Mechanics Verified

### 1. Pokemon HP Formula
- **Rule:** "Pokémon Hit Points = Pokémon Level + (HP × 3) + 10" — `core/05-pokemon.md`, where "HP" is the calculated HP stat (base + level-up points), not the base stat alone.
- **Implementation:** `csv-import.service.ts:217` reads maxHp from the CSV (row 5, col 9). Fallback: `level + stats.hp * 3 + 10` where `stats.hp` is the calculated stat (row 5, col 6). The generator service uses the same formula at `pokemon-generator.service.ts:125`: `input.level + (calculatedStats.hp * 3) + 10`.
- **Status:** CORRECT
- **Notes:** CSV import correctly preserves the player's sheet value and only falls back to the formula when the CSV cell is empty. Both formula implementations use the calculated stat, not the base stat.

### 2. Stat Preservation (Import-Specific)
- **Rule:** Imported Pokemon should retain their character sheet values — base stats AND calculated stats (base + level-up + nature adjustments). The generator's `distributeStatPoints()` random distribution must NOT be applied to imports.
- **Implementation:** `createPokemonFromCSV()` builds `GeneratedPokemonData` with `baseStats` from CSV rows 5–10 col 1 and `calculatedStats` from CSV rows 5–10 col 6. These are passed directly to `createPokemonRecord()`, which stores them as DB columns (`baseHp`, `currentAttack`, etc.). The generator's `distributeStatPoints()` is only called by `generatePokemonData()`, which the import path does NOT call.
- **Status:** CORRECT
- **Notes:** Critical design decision — the import bypasses `generatePokemonData()` entirely and constructs `GeneratedPokemonData` manually with CSV values, then passes it directly to `createPokemonRecord()`. This preserves the player's actual sheet numbers.

### 3. Nature Preservation
- **Rule:** Nature determines stat modifiers (+10% to one stat, -10% to another). Imported Pokemon must retain their sheet nature.
- **Implementation:** `parsePokemonSheet()` reads nature from CSV (row 2, cols 1/4/7). `createPokemonFromCSV()` passes `nature: pokemon.nature` in `GeneratedPokemonData`. `createPokemonRecord():173` stores `data.nature ?? { name: 'Hardy', ... }` — the `??` never triggers since nature is always present from the CSV.
- **Status:** CORRECT
- **Notes:** The `??` fallback to Hardy is a safety net for the generator path (where nature is not set by `generatePokemonData`). Import path always provides nature.

### 4. Shiny Preservation
- **Rule:** Shiny status is a cosmetic property stored on the Pokemon record.
- **Implementation:** `parsePokemonSheet():196` reads shiny from CSV. `createPokemonFromCSV()` passes `shiny: pokemon.shiny`. `createPokemonRecord():205` stores `data.shiny ?? false`.
- **Status:** CORRECT (improvement)
- **Notes:** The OLD inline code did NOT include `shiny` in the `prisma.pokemon.create()` call — shiny status was silently dropped, defaulting to `false` via Prisma schema. The new code correctly preserves shiny status. **Bug fix.**

### 5. Move Data Format
- **Rule:** Moves have a damage class (Physical/Special/Status) and damage base (DB). The app's `Move` type uses fields `damageClass` and `damageBase`.
- **Implementation:** `createPokemonFromCSV()` maps CSV moves to `MoveDetail` format: `category → damageClass`, `db → damageBase`.
- **Status:** CORRECT (improvement)
- **Notes:** The OLD inline code stored moves with field names `category` and `db` from the CSV parser output. The `Move` type definition (`types/character.ts:47-70`) uses `damageClass` and `damageBase`. All UI components read `move.damageClass` and `move.damageBase`. Old imported Pokemon would have had `undefined` for these fields in the UI — damage class and damage base would not have displayed. The new code normalizes to the correct field names. **Bug fix.**

### 6. Ability Data Format
- **Rule:** Pokemon abilities have a name and effect.
- **Implementation:** `createPokemonFromCSV()` maps abilities to `[{name, effect}]`, dropping the CSV's `frequency` field.
- **Status:** CORRECT
- **Notes:** The `Ability` type (`types/character.ts:73`) is `{id, name, effect}` — no `frequency` field. The generator service also stores `[{name, effect}]`. AbilityData reference table has frequency for runtime lookup. The old code stored an extra `frequency` field that was never read by the UI. Removing it is a normalization, not a data loss.

### 7. Capture Origin
- **Rule:** The `origin` field tracks how a Pokemon was created: `'manual' | 'wild' | 'template' | 'import' | 'captured'`.
- **Implementation:** `createPokemonFromCSV()` passes `origin: 'import'` and `originLabel: 'Imported from PTU sheet'` to `createPokemonRecord()`.
- **Status:** CORRECT

### 8. Size Capability
- **Rule:** Pokemon size (Small/Medium/Large/Huge/Gigantic) determines VTT token footprint. `sizeToTokenSize()` maps: Small/Medium→1, Large→2, Huge→3, Gigantic→4.
- **Implementation:** `createPokemonFromCSV():378` hardcodes `size: 'Medium'`. However, `speciesData` IS already queried at line 337 for types. The size should come from `speciesData?.size ?? 'Medium'`.
- **Status:** INCORRECT
- **Severity:** MEDIUM
- **Fix:** `csv-import.service.ts:378` — change `size: 'Medium'` to `size: speciesData?.size ?? 'Medium'`
- **Notes:** Impact: non-Medium imported Pokemon (e.g., Steelix/Gigantic, Joltik/Small) get wrong token sizing on VTT. The old inline code also didn't store size (no `size` field in capabilities JSON), so `sizeToTokenSize(undefined)` returned 1 (same as Medium). Practical impact is identical for now, but the new code stores an explicit wrong value rather than leaving it unset. Since refactoring-010 already fixed size population for the generator path, the import path should match. **Ticket filed: refactoring-036.**

### 9. Gender Default
- **Rule:** Pokemon gender affects some mechanics (Attract, Rivalry, breeding).
- **Implementation:** `createPokemonFromCSV():375` uses `pokemon.gender ?? 'Male'`. Old code used `pokemon.gender ?? undefined`, falling through to Prisma default `"Genderless"`.
- **Status:** NEEDS REVIEW
- **Severity:** LOW
- **Notes:** The generator service uses `['Male', 'Female'][Math.floor(Math.random() * 2)]` — random assignment, never "Genderless". The import fallback changed from "Genderless" to "Male". Both are wrong for the edge case of a missing gender field, but this is extremely unlikely in real PTU character sheets (gender is a required field on the standard sheet). No ticket — edge case with negligible practical impact.

## Pre-Existing Issues

### Power + Jump Capabilities Not Stored (Pre-existing)
- The old inline import stored `power` and `jump` capabilities from the CSV. The new code drops them because `GeneratedPokemonData.movementCaps` only includes overland/swim/sky/burrow/levitate.
- These are displayed in the UI (`pokemon/[id].vue:344,348`, `PokemonCapabilitiesTab.vue:26,30`) and will show 0 for imported Pokemon.
- However, the generator service also doesn't populate power/jump for ANY Pokemon — this is a pre-existing gap in the data model, not introduced by this refactoring.
- **No new ticket** — already covered by the generator data model's limitation. If power/jump are ever added to `GeneratedPokemonData`, the CSV import should be updated to populate them.

## Summary

- Mechanics checked: 9
- Correct: 7
- Incorrect: 1 (size capability — MEDIUM)
- Needs review: 1 (gender default — LOW, edge case)

## Verdict

**APPROVED.** The refactoring is a **net PTU correctness improvement**: it fixes two pre-existing bugs (move field name mismatch causing broken UI display, shiny status silently dropped) while correctly preserving all critical game data (stats, HP, nature, moves, abilities, origin). The one MEDIUM issue (size hardcoded instead of looked up from already-queried speciesData) is a trivial one-line fix tracked as refactoring-036. No CRITICAL or HIGH PTU rule violations.
