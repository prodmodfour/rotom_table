---
ticket_id: refactoring-011
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/server/services/pokemon-generator.service.ts
  - app/server/services/combatant.service.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T22:00:00
filed_by: code-review-009
---

## Summary

Two combatant wrapper builder functions exist in separate services with duplicated field construction. `buildPokemonCombatant()` in `pokemon-generator.service.ts:275-339` and `buildCombatantFromEntity()` in `combatant.service.ts:526-562` both construct the same combatant wrapper fields (id, type, entityId, side, initiative, evasions, turnState, injuries, position, tokenSize). If the `Combatant` type adds a required field, both must be updated independently.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** 2 functions constructing identical combatant wrapper structure
- **Threshold:** Duplicated business logic across services
- **Impact:** Maintenance burden — `Combatant` type changes require updating both functions. Already observed: `buildPokemonCombatant` includes `readyAction: undefined` while `buildCombatantFromEntity` omits it (functionally equivalent but inconsistent).
- **Evidence:**
  - `pokemon-generator.service.ts:280-339` — combatant wrapper for freshly generated Pokemon
  - `combatant.service.ts:536-561` — combatant wrapper for DB-loaded entities
  - Both compute: `initiative = speed + bonus`, `physicalEvasion = floor(defense / 5)`, same turnState/injuries defaults

## Suggested Refactoring

Have `buildPokemonCombatant()` construct a `Pokemon` entity from `CreatedPokemon` data, then delegate to `buildCombatantFromEntity()`. This requires:
1. Map `CreatedPokemon.data` fields to the full `Pokemon` interface (add missing fields like `baseStats`, `experience`, `nature`, etc.)
2. Call `buildCombatantFromEntity({ entityType: 'pokemon', ... })` instead of inline wrapper construction
3. Remove the duplicated wrapper logic from `pokemon-generator.service.ts`

Alternative: Extract just the combatant wrapper construction into a shared helper that both functions call, keeping entity construction separate.

Estimated commits: 1-2

## Resolution Log

- **Commit:** `116b63e` — `refactor: deduplicate combatant builder by delegating to buildCombatantFromEntity`
- **Files changed:** `app/server/services/pokemon-generator.service.ts` (61 insertions, 109 deletions)
- **Approach:** Added `createdPokemonToEntity()` helper that maps `CreatedPokemon` → full `Pokemon` entity. Rewrote `buildPokemonCombatant()` as a thin adapter that calls `createdPokemonToEntity()` + `buildCombatantFromEntity()`. Removed the `CombatantData` interface (duplicate of `Combatant` type) and the `uuid` import.
- **No new files created.**
- **Test results:** 135/135 combat PASS, 40/40 capture PASS, 446/447 unit PASS (1 pre-existing failure in settings.test.ts — refactoring-013)
