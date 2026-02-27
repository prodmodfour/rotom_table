---
review_id: code-review-016
target: refactoring-011
type: refactoring
reviewer: senior-reviewer
date: 2026-02-17
verdict: APPROVED
commits_reviewed:
  - 116b63e
files_reviewed:
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/combatant.service.ts (canonical builder, read-only reference)
  - app/types/character.ts (Pokemon interface, read-only reference)
  - app/types/encounter.ts (Combatant interface, read-only reference)
scenarios_to_rerun: []
---

## Summary

Review of refactoring-011 (combatant builder deduplication). The developer added `createdPokemonToEntity()` to map `CreatedPokemon` to a full `Pokemon` entity, then rewrote `buildPokemonCombatant()` as a thin adapter that delegates to the canonical `buildCombatantFromEntity()`. Removed the duplicate `CombatantData` interface and the `uuid` import.

## Commit: 116b63e

**Scope:** 1 file changed — `pokemon-generator.service.ts` (61 insertions, 109 deletions). Net -48 lines.

### Changes Verified

| Change | Status |
|--------|--------|
| `createdPokemonToEntity()` maps all 31 Pokemon interface fields | CORRECT |
| `buildPokemonCombatant()` delegates to `buildCombatantFromEntity()` | CORRECT |
| `CombatantData` interface removed (was duplicate of `Combatant` type) | CORRECT |
| `uuid` import removed (no longer needed — canonical builder owns UUID generation) | CORRECT |
| Return type upgraded from local `CombatantData` to shared `Combatant` | CORRECT |
| All 3 callers compatible (wild-spawn, from-scene, template-load) | VERIFIED |

### Behavioral Equivalence

| Field | Old Code | New Code (via delegation) | Match |
|-------|----------|--------------------------|-------|
| initiative | `data.calculatedStats.speed` | `entity.currentStats.speed + 0` (same value) | YES |
| physicalEvasion | `Math.floor(data.calculatedStats.defense / 5)` | `Math.floor((stats.defense \|\| 0) / 5)` | YES |
| specialEvasion | `Math.floor(data.calculatedStats.specialDefense / 5)` | `Math.floor((stats.specialDefense \|\| 0) / 5)` | YES |
| speedEvasion | `Math.floor(data.calculatedStats.speed / 5)` | `Math.floor((stats.speed \|\| 0) / 5)` | YES |
| tokenSize | `sizeToTokenSize(data.size)` | `sizeToTokenSize(pokemon.data.size)` passed to builder | YES |
| turnState | Inline defaults | Same defaults in canonical builder | YES |
| injuries | `{ count: 0, sources: [] }` | Same in canonical builder | YES |
| readyAction | Explicitly `undefined` | Omitted (optional field, same effect) | YES |

### Entity Mapping Completeness

All 31 fields of the `Pokemon` interface verified against `createdPokemonToEntity()`:

- **Required fields (22):** All explicitly set with correct values from `CreatedPokemon.data`
- **Optional fields (9):** `heldItem`, `ownerId`, `spriteUrl`, `location`, `notes`, `initiativeRollOff`, `tempConditions` — correctly default to `undefined` via omission

### Type Casts

Two `as unknown as` casts at lines 258 and 259-263:

1. `data.moves as unknown as Pokemon['moves']` — `MoveDetail` lacks the `id` field required by `Move`
2. Capabilities cast — generated data lacks `jump`, `power`, `weightClass` required by `PokemonCapabilities`

These are pre-existing data shape mismatches. The old code had the same runtime data but hid the gaps behind the local `CombatantData` interface. The casts are the pragmatic minimum for this refactoring scope.

## Issues

None.

## What Looks Good

- **Clean delegation pattern.** `buildPokemonCombatant` is now 8 lines (down from ~60). Single responsibility: convert input format, delegate to canonical builder.
- **Correct approach chosen.** The ticket suggested two options — full entity mapping + delegation, or shared helper extraction. The developer chose option 1, which is better because it eliminates the parallel code path entirely rather than creating a shared leaf function.
- **`CombatantData` removal.** The duplicate interface was a maintenance trap (already had one inconsistency: `readyAction` present vs absent). Removing it and using the canonical `Combatant` type is correct.
- **Net code reduction.** -48 lines with no behavioral change. The entity mapping function is reusable if other code needs to convert `CreatedPokemon` to `Pokemon`.
- **Side benefit for refactoring-012.** Evasion computation now lives in exactly one place (`buildCombatantFromEntity`), making the PTU evasion cap fix a single-site change.

## Test Results

| Suite | Result |
|-------|--------|
| Combat (Playwright) | 135/135 PASS |
| Capture (Playwright) | 40/40 PASS |
| Unit (Vitest) | 446/447 PASS (1 pre-existing: settings.test.ts — refactoring-013) |

## Verdict

**APPROVED** — Clean deduplication. No behavioral changes. No issues found. Proceed to rules review or close ticket.
