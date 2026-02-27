---
review_id: code-review-009
target: refactoring-003
ticket_type: refactoring
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-16
commits_reviewed:
  - 14a54f4  # add entity builder functions to combatant.service.ts
  - 1da293d  # replace inline entity transformation in combatants.post.ts
  - 162feff  # replace inline HumanCharacter transformation in from-scene.post.ts
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/from-scene.post.ts
scenarios_to_rerun: []
---

## Summary

Refactoring-003 extracted ~127 lines of inline, untyped entity transformation from two API handlers into three typed service functions in `combatant.service.ts`. All `any` usages eliminated from the target files. Two legitimate bug fixes included (HumanCharacter `maxHp` and missing `turnState`/`injuries` on combatant wrapper). Error handlers upgraded from `error: any` to `error: unknown`.

## Status Table

| Task | Status |
|------|--------|
| Extract Pokemon entity builder to service | DONE — `buildPokemonEntityFromRecord()` |
| Extract HumanCharacter entity builder to service | DONE — `buildHumanEntityFromRecord()` |
| Extract combatant wrapper builder to service | DONE — `buildCombatantFromEntity()` |
| Replace inline transformation in combatants.post.ts | DONE — 85 lines removed |
| Replace inline transformation in from-scene.post.ts | DONE — 42 lines removed (bonus — not in original ticket scope) |
| Eliminate `any` from combatants.post.ts | DONE — `let entity: Pokemon | HumanCharacter`, `error: unknown` |
| Fix maxHp bug in HumanCharacter combatant | DONE — was `record.hp` (base stat), now `record.maxHp` |
| Add missing turnState/injuries to combatant wrapper | DONE — both included in `buildCombatantFromEntity` |

## What Looks Good

1. **Commit granularity is correct.** Three commits, each self-contained: service addition, then consumer migration, then second consumer migration. Each intermediate state compiles.

2. **Prisma record types derived correctly.** Using `NonNullable<Awaited<ReturnType<typeof prisma.pokemon.findUnique>>>` is the right pattern — no manual type duplication, stays in sync with schema automatically.

3. **Entity builders are complete.** Cross-referenced both `buildPokemonEntityFromRecord` and `buildHumanEntityFromRecord` field-by-field against `Pokemon` and `HumanCharacter` interfaces in `types/character.ts`. Every interface field is mapped. JSON fields are parsed. Nullable DB columns correctly use `?? undefined` for optional interface fields.

4. **Bug fixes are legitimate.**
   - Old `combatants.post.ts` line 100: `maxHp: entity.hp` — this was the base HP stat, not the calculated max HP. Now correctly uses `record.maxHp` through `buildHumanEntityFromRecord`.
   - Old combatant wrappers were missing `turnState` and `injuries` (both required by the `Combatant` type). These now come from `buildCombatantFromEntity`.

5. **No behavioral changes beyond the documented fixes.** Verified: evasion calculations use the same source stats (Pokemon `currentStats`, Human `stats`). Initiative calculation is identical. Grid placement logic is unchanged.

6. **from-scene.post.ts bonus cleanup.** The ticket only targeted `combatants.post.ts`, but the developer correctly identified and fixed the same pattern in `from-scene.post.ts`. The scene-to-encounter path now uses the same builders, eliminating a second copy of inline HumanCharacter transformation.

## Issues

### MEDIUM #1: Combatant wrapper construction duplicated across services

**File:** `app/server/services/pokemon-generator.service.ts:275-339`

`buildPokemonCombatant()` in `pokemon-generator.service.ts` constructs the same combatant wrapper fields (id, type, entityId, side, initiative, evasions, turnState, injuries, position, tokenSize) as the new `buildCombatantFromEntity()` in `combatant.service.ts`. The two functions serve different input types (`CreatedPokemon` vs `Pokemon | HumanCharacter`), so unification requires converting the generator's output to a full `Pokemon` entity first — non-trivial but doable.

This is pre-existing (not introduced by this refactoring) but is now more visible with two named combatant-builder functions in two services. If the `Combatant` type adds a required field, both must be updated.

**Action required:** File as refactoring-011 for the Code Health Auditor to track. Not blocking this review — the duplication existed before and the scope of refactoring-003 was specifically about `combatants.post.ts` and its inline transformations.

## Verdict: APPROVED

The refactoring achieves both ticket goals (LLM-TYPES and EXT-LAYER), includes legitimate bug fixes, maintains behavioral equivalence, and has correct commit granularity. No regressions expected — entity transformation logic is identical to the original with the documented corrections.

No scenarios need re-running. The entity transformation is pure data mapping (Prisma record → typed object) — no PTU game logic changed. The evasion/initiative calculations in `buildCombatantFromEntity` are the same formulas that were inline before.

Pipeline state: refactoring-003 → **resolved**. MEDIUM #1 tracked as new refactoring-011 ticket.
