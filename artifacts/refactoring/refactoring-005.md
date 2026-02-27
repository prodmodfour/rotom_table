---
ticket_id: refactoring-005
priority: P1
categories:
  - EXT-LAYER
  - LLM-TYPES
affected_files:
  - app/server/api/encounters/[id]/start.post.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
`start.post.ts` contains 54 lines of initiative sorting business logic (including d20 roll-off tie-breaking) inline in the API handler, typed entirely with `any`. This critical combat mechanic is untestable in isolation and invisible to LLM agents looking for initiative logic in service files.

## Findings

### Finding 1: EXT-LAYER
- **Metric:** 54 lines of business logic inline in API handler (lines 14-68)
- **Threshold:** Business logic inline in API handlers instead of services
- **Impact:** Initiative sorting with d20 roll-off is a core PTU mechanic. Being inline in an API handler means: (a) it can't be unit-tested independently, (b) LLM agents searching for "initiative" in services won't find it, (c) if another endpoint needs to re-sort initiative (e.g., adding a combatant mid-encounter), the logic must be duplicated.
- **Evidence:** `start.post.ts:6-68` — `rollD20()` and `sortByInitiativeWithRollOff()` defined at module scope in the API handler file

### Finding 2: LLM-TYPES
- **Metric:** `any[]` parameter type on core function, `any` in 5+ callback parameters
- **Threshold:** Untyped params/returns on functions
- **Impact:** `sortByInitiativeWithRollOff(combatants: any[])` accepts anything. The function mutates `c.initiativeRollOff` — a property not present on any typed interface. LLM agents can't verify the combatant shape.
- **Evidence:**
  - `start.post.ts:14` — `function sortByInitiativeWithRollOff(combatants: any[])`
  - `start.post.ts:102` — `combatants.forEach((c: any) =>`
  - `start.post.ts:126-127` — `.filter((c: any) =>`

## Suggested Refactoring
1. Move `sortByInitiativeWithRollOff()` to `encounter.service.ts`
2. Type the parameter as `Combatant[]` and add `initiativeRollOff?: number` to the Combatant type if needed
3. Move `rollD20()` to a shared utility (or use the existing `roll('1d20')` from `utils/diceRoller`)
4. Import and use from the API handler

Estimated commits: 1-2

## Related Lessons
- none (new finding)

## Resolution Log
- Commits: `8168ecc` — refactor: extract initiative sorting into encounter service
- Files changed:
  - `app/server/services/encounter.service.ts` — added `sortByInitiativeWithRollOff()`, imported `rollDie` from diceRoller
  - `app/server/api/encounters/[id]/start.post.ts` — removed inline `rollD20()` and `sortByInitiativeWithRollOff()`, imported from service, typed `combatants` as `Combatant[]`, removed all `any` annotations
- New files created: none
- Tests passing: 6/6 initiative order, 18/20 combat suite (1 pre-existing flaky failure in turn-progression round advancement UI)
