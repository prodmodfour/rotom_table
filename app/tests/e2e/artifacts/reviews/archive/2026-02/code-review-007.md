---
review_id: code-review-007
target: refactoring-002
ticket_id: refactoring-002
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16
commits_reviewed:
  - c5ecc91
  - 8589bf6
  - c82b8c3
  - 9576503
  - 1c82ae5
files_reviewed:
  - app/server/services/grid-placement.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/tests/e2e/artifacts/refactoring/refactoring-002.md
scenarios_to_rerun: []
---

## Summary

Refactoring-002 extracts duplicated grid placement logic (occupied cell tracking, `canFit()`, side-based auto-placement with fallback) into a shared `grid-placement.service.ts`. The service is used by 3 API handlers: `combatants.post.ts`, `wild-spawn.post.ts`, and `from-scene.post.ts`. Net delta: +145 lines (new service), -194 lines (removed duplication). The worker also found a third duplicate in `from-scene.post.ts` beyond the two identified in the ticket.

## Issues

None.

## Follow-up Ticket Filed

### refactoring-010: Size capability not seeded — tokenSize always 1

Review investigation revealed that the ticket's Finding 2 (tokenSize inconsistency) masks a deeper FEATURE_GAP. `combatants.post.ts` reads `capabilities.size` but this field is **never populated** — SpeciesData has no `size` column, seed.ts doesn't parse size from pokedex files, and `generatePokemonData()` never includes it. Both the "derives from capabilities" path and the "hardcoded 1" path produce identical results. All Pokemon get tokenSize=1 regardless of PTU size class (Steelix should be 4x4 cells, Onix 3x3). Filed as refactoring-010 (P1, FEATURE_GAP + PTU-INCORRECT). Not the refactoring worker's responsibility — this is a pre-existing data pipeline gap.

## What Looks Good

- **Behavioral equivalence verified.** The negative-offset pattern for enemies (`startX: -5, endX: -1` resolved via `gridWidth + offset`) produces identical values to the old inline `gridWidth - 5` / `gridWidth - 1` for any grid width. Checked: default `gridWidth=20` yields `startX=15, endX=19` in both old and new code.
- **Mutation design is correct.** `findPlacementPosition` internally calls `markOccupied()` after placement, so successive calls in loops (wild-spawn, from-scene) correctly avoid already-placed tokens. This matches the old behavior where `wild-spawn.post.ts` and `from-scene.post.ts` manually marked cells after each placement.
- **Encapsulation is clean.** Only 3 functions are exported (`sizeToTokenSize`, `buildOccupiedCellsSet`, `findPlacementPosition`). `canFit()` and `markOccupied()` are private implementation details.
- **Third duplicate found.** `from-scene.post.ts` had its own `findPosition()` with identical logic. `buildOccupiedCellsSet([])` is a clean way to initialize for a new encounter with no existing combatants.
- **Commit granularity is excellent.** One commit for the service extraction, one commit per consumer file, one commit for documentation. Each intermediate state compiles.
- **Service file is well-scoped.** 145 lines, focused on a single concern, good JSDoc, typed interfaces.

## Verdict

**APPROVED** — Clean, behavior-preserving refactoring. Zero code quality issues. The 3 consumer files are significantly shorter and now share a single source of truth for placement logic. No scenarios need re-running since this is a pure extraction with no behavioral changes.
