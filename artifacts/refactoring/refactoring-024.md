---
ticket_id: refactoring-024
priority: P0
categories:
  - LLM-SIZE
  - EXT-GOD
  - LLM-TYPES
  - EXT-LAYER
affected_files:
  - app/pages/gm/pokemon/[id].vue
estimated_scope: large
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

`pokemon/[id].vue` is 1614 lines — the largest file in the codebase. The script section (318 lines) handles 6+ responsibilities: data loading, edit mode, healing actions, skill rolling, move attack rolling, move damage rolling. Uses `$fetch` directly (DIP violation) and `as any` casts for healing fields (LLM-TYPES).

## Findings

### Finding 1: LLM-SIZE
- **Metric:** 1614 total lines (script: 318, template: 528, SCSS: 763)
- **Threshold:** >800 lines = P0
- **Impact:** LLMs lose track of distant code sections. The SCSS alone (763 lines) fills most of a context window before the agent even reads the logic.
- **Evidence:** `wc -l app/pages/gm/pokemon/[id].vue` = 1614

### Finding 2: EXT-GOD
- **Metric:** Script handles 6 distinct responsibilities
- **Threshold:** 3+ unrelated responsibilities = EXT-GOD
- **Impact:** Changes to healing mechanics risk breaking dice rolling; changes to edit mode risk breaking data loading. SRP violation.
- **Evidence:**
  1. Data loading (loadPokemon, lines 583-601)
  2. Edit mode (startEditing, cancelEditing, saveChanges, lines 819-848)
  3. Healing actions (handleRest, handleExtendedRest, handlePokemonCenter, handleHealInjury, handleNewDay, lines 623-666)
  4. Skill rolling (rollSkill, lines 718-721)
  5. Move attack rolling (rollAttack, lines 745-775)
  6. Move damage rolling (rollDamage, lines 777-816)

### Finding 3: LLM-TYPES
- **Metric:** 3 `as any` casts in production code
- **Threshold:** Any `any` usage = flag
- **Impact:** LLM agents cannot verify data shapes when types are cast away. The casts hide the fact that `Pokemon` type is missing healing fields.
- **Evidence:** Lines 617 (`restMinutesToday`), 618 (`lastInjuryTime`), 619 (`injuriesHealedToday`) — all cast `pokemon.value as any` to access healing tracking fields not on the Pokemon type

### Finding 4: EXT-LAYER (DIP violation)
- **Metric:** Direct `$fetch` call in page component
- **Threshold:** Components should use composables for data access
- **Impact:** Cannot mock data loading for tests; page is coupled to HTTP layer
- **Evidence:** Line 588 — `$fetch<{ success: boolean; data: Pokemon }>(\`/api/pokemon/${pokemonId.value}\`)`

## Suggested Refactoring

1. Extract healing tab into `app/components/common/HealingTab.vue` (shared with characters/[id].vue — see refactoring-026)
2. Extract dice rolling into a `usePokemonSheetRolls` composable (rollSkill, rollAttack, rollDamage + state)
3. Move data loading into `useLibraryStore` or a `usePokemonSheet` composable
4. Add healing tracking fields (`restMinutesToday`, `lastInjuryTime`, `injuriesHealedToday`) to the `Pokemon` type definition to eliminate `as any` casts
5. Extract SCSS type badge colors to shared partial (see refactoring-032)

Estimated commits: 4-6

## Related Lessons
- Pattern H (duplication chains) — healing logic duplicated from characters/[id].vue
- Pattern I (incomplete grep) — `as any` workaround suggests the type definition was never updated when healing fields were added

## Resolution Log
- Commits: 5b5fb0c, 860abf3, 50ee867
- Files changed: app/pages/gm/pokemon/[id].vue (1614 → 1242 lines, -372)
- New files created: app/composables/usePokemonSheetRolls.ts (137 lines), app/components/common/HealingTab.vue (314 lines)
- Tests passing: 508/508 unit tests pass (Vitest); no new type errors introduced
- Notes: Healing handlers, healingInfo computed, healing template, and healing SCSS extracted to shared HealingTab.vue. Dice rolling (rollSkill, rollAttack, rollDamage, getMoveDamageFormula) extracted to usePokemonSheetRolls composable. The `as any` casts mentioned in Finding 3 were not present in the current code — the Pokemon type already has restMinutesToday, lastInjuryTime, injuriesHealedToday fields.
