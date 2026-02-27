---
ticket_id: refactoring-003
priority: P1
categories:
  - LLM-TYPES
  - EXT-LAYER
affected_files:
  - app/server/api/encounters/[id]/combatants.post.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
`combatants.post.ts` uses `any` throughout and contains ~55 lines of inline entity transformation (Prisma record to combatant entity) that should be in a service. LLM agents cannot verify data shapes when types are `any`, leading to field-name mismatches — a pattern already observed during Tier 2 testing (Playtester lessons on `baseSpAtk` vs `baseSpAttack`).

## Findings

### Finding 1: LLM-TYPES
- **Metric:** 8+ `any` usages including the main entity variable
- **Threshold:** `any` usage in typed params/returns
- **Impact:** LLM agents rely on types to understand data shapes. When the entity is `any`, there's no guard against wrong field names. The Tier 2 test cycle already caught field mismatches (`baseSpAtk` vs `baseSpAttack`) stemming from this lack of typing.
- **Evidence:**
  - `combatants.post.ts:46` — `let entity: any`
  - `combatants.post.ts:229` — `catch (error: any)`
  - Lines 47-103: Entity transformation with no type annotations on the constructed objects

### Finding 2: EXT-LAYER
- **Metric:** 55 lines of business logic inline in API handler
- **Threshold:** Business logic inline in API handlers instead of services
- **Impact:** Entity transformation logic (reading Prisma records, parsing JSON fields, constructing typed entity objects) is API-handler business logic that should be in a service. The `wild-spawn.post.ts` correctly delegates to `pokemon-generator.service.ts`, showing the right pattern exists but isn't followed here.
- **Evidence:**
  - `combatants.post.ts:47-103` — Pokemon entity construction (lines 47-79) and Human entity construction (lines 80-103)
  - Compare: `wild-spawn.post.ts:80-85` delegates to `generateAndCreatePokemon()` + `buildPokemonCombatant()`

## Suggested Refactoring
1. Create `buildCombatantEntity(entityType, entityId)` in `encounter.service.ts` or `combatant.service.ts` that:
   - Loads the Prisma record
   - Parses JSON fields
   - Returns a typed `Pokemon | HumanCharacter` entity
2. Create typed interfaces for the transformation input/output
3. Replace `let entity: any` with proper type unions
4. Use the existing `buildPokemonCombatant()` from `pokemon-generator.service.ts` as the model pattern

Estimated commits: 2-3

## Related Lessons
- Playtester Lesson 1: Field name mismatches (`baseSpAtk` vs `baseSpAttack`) discovered during Tier 2 testing — untyped entity construction is the root cause

## Resolution Log
- Commits:
  - `14a54f4` — add entity builder functions to combatant.service.ts
  - `1da293d` — replace inline entity transformation in combatants.post.ts
  - `162feff` — replace inline HumanCharacter transformation in from-scene.post.ts
- Files changed:
  - `app/server/services/combatant.service.ts` — added `buildPokemonEntityFromRecord()`, `buildHumanEntityFromRecord()`, `buildCombatantFromEntity()` with full type annotations
  - `app/server/api/encounters/[id]/combatants.post.ts` — replaced 85 lines of inline untyped transformation with service calls; removed all `any` usages
  - `app/server/api/encounters/from-scene.post.ts` — replaced 42 lines of inline HumanCharacter transformation with service calls
- New files created: none
- Tests passing: 446/447 (1 pre-existing failure in settings.test.ts unrelated to this refactoring)
- Additional fixes included:
  - `combatants.post.ts` HumanCharacter `maxHp` now uses `record.maxHp` (DB column) instead of `record.hp` (base HP stat)
  - `combatants.post.ts` combatant wrapper now includes `turnState` and `injuries` fields (previously missing, required by `Combatant` type)
  - Both entity transformations now include `injuries` and `temporaryHp` from DB records (previously omitted, needed by damage/healing pipeline)
  - Error handler uses `error: unknown` instead of `error: any`
