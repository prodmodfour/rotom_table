---
ticket_id: refactoring-025
priority: P0
categories:
  - LLM-SIZE
  - LLM-TYPES
affected_files:
  - app/pages/gm/characters/[id].vue
  - app/types/index.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

`characters/[id].vue` is 953 lines and contains 10 `as any` casts — the highest `as any` density of any production file. All casts work around missing healing/injury fields on the `HumanCharacter` type definition.

## Findings

### Finding 1: LLM-SIZE
- **Metric:** 953 total lines (script: 155, template: 355, SCSS: 438)
- **Threshold:** >800 lines = P0
- **Impact:** The file exceeds the P0 threshold. While the script is moderate at 155 lines, the combined template+SCSS bulk makes it hard for LLMs to navigate.
- **Evidence:** `wc -l app/pages/gm/characters/[id].vue` = 953

### Finding 2: LLM-TYPES
- **Metric:** 10 `as any` casts in a single file
- **Threshold:** Any `any` usage = flag; 10 in one file = P0
- **Impact:** LLMs cannot verify data shapes. Every healing-related template expression uses `(character as any)`, making it impossible to trace what fields exist. If the API response shape changes, no type error will catch the breakage.
- **Evidence:**
  - Template: lines 222, 224, 243, 295, 307 — `(character as any).injuries`, `(character as any).drainedAp`
  - Script: lines 421-424 — `(character.value as any).injuries`, `(character.value as any).restMinutesToday`, `(character.value as any).lastInjuryTime`, `(character.value as any).injuriesHealedToday`

## Suggested Refactoring

1. Add healing tracking fields to `HumanCharacter` type: `injuries`, `restMinutesToday`, `lastInjuryTime`, `injuriesHealedToday`, `drainedAp`
2. Add same fields to `Pokemon` type (eliminates 3 casts in pokemon/[id].vue simultaneously)
3. Remove all 10 `as any` casts from characters/[id].vue
4. Extract healing tab to shared component (see refactoring-026)
5. Extract duplicated sheet SCSS (stats-grid, healing-status, form-row etc.) to shared partials

Estimated commits: 2-3

## Related Lessons
- Pattern I (incomplete grep during deduplication) — the healing fields were added to the API response but the type definitions were never updated

## Resolution Log
- Commits: 93f842b (add healing fields to types + entity builders + test fixtures), aa4286a (remove all as-any casts)
- Files changed: `app/types/character.ts`, `app/server/services/combatant.service.ts`, `app/server/services/pokemon-generator.service.ts`, `app/tests/unit/stores/library.test.ts`, `app/pages/gm/characters/[id].vue`, `app/pages/gm/pokemon/[id].vue`
- New files created: none
- Tests passing: 508/508 unit tests pass, type check clean for changed files
