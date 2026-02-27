---
ticket_id: refactoring-031
priority: P2
categories:
  - LLM-TYPES
affected_files:
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/PlayerCombatantCard.vue
  - app/components/encounter/GroupCombatantCard.vue
estimated_scope: small
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

Three encounter UI components use `as any` casts (6 total across 3 files) to access entity fields. These casts hide type mismatches between `Combatant.entity` and the expected fields.

## Findings

### Finding 1: LLM-TYPES
- **Metric:** 6 `as any` casts across 3 encounter components
- **Threshold:** Any `any` usage = flag
- **Impact:** LLMs cannot verify whether entity field access is correct. If the Combatant type changes, no compile-time error will surface.
- **Evidence:**
  - CombatantCard.vue: 2 `as any` casts
  - PlayerCombatantCard.vue: 2 `as any` casts
  - GroupCombatantCard.vue: 2 `as any` casts

## Suggested Refactoring

1. Investigate what fields are being accessed via `as any` — likely Pokemon-specific fields on a generic Combatant entity
2. Add proper type narrowing based on `combatant.type === 'pokemon'` guards (already used in CombatantDetailsPanel.vue as a good pattern)
3. If the Combatant type union doesn't properly discriminate, update the type definition in `app/types/combat.ts`

Estimated commits: 1

## Related Lessons
- none

## Resolution Log
- Commits: `290f948`
- Files changed: `components/encounter/CombatantCard.vue`, `components/encounter/PlayerCombatantCard.vue`, `components/encounter/GroupCombatantCard.vue`
- New files created: none
- Tests passing: `vue-tsc --noEmit` clean
- Approach: Added `avatarUrl` and `pokemonTypes` computed properties that narrow the `Pokemon | HumanCharacter` union using the existing `isPokemon` guard, then replaced all 6 template `as any` casts with these typed computeds.
