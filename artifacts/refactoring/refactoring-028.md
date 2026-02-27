---
ticket_id: refactoring-028
priority: P1
categories:
  - EXT-GOD
  - EXT-LAYER
  - LLM-FUNC
affected_files:
  - app/server/api/characters/import-csv.post.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

`import-csv.post.ts` is a 518-line monolithic API endpoint containing a full CSV parser, trainer sheet parser, Pokemon sheet parser, and database creation logic — all inline in a single file. Violates SRP (4 responsibilities) and DIP (no service layer).

## Findings

### Finding 1: EXT-GOD
- **Metric:** Single file handles 4 unrelated responsibilities
- **Threshold:** 3+ unrelated responsibilities
- **Impact:** Changes to CSV parsing risk breaking Pokemon creation. The file is impossible to unit test in isolation.
- **Evidence:**
  1. CSV parser (parseCSV, lines 74-118, 45 lines)
  2. Trainer sheet parser (parseTrainerSheet, lines 146-246, 100 lines)
  3. Pokemon sheet parser (parsePokemonSheet, lines 248-378, 131 lines)
  4. Database creation logic (event handler, lines 381-518, 137 lines)

### Finding 2: EXT-LAYER
- **Metric:** All business logic inline in API handler instead of services
- **Threshold:** API handlers should delegate to services (Controller pattern)
- **Impact:** The API handler does parsing, validation, species lookup, and Prisma creation directly. This bypasses the `pokemon-generator.service.ts` which is the canonical Pokemon creation path — meaning imported Pokemon may have different defaults than generated ones.
- **Evidence:** Lines 461-498 — inline `prisma.pokemon.create()` with manual field mapping instead of using `createPokemonRecord()` from pokemon-generator.service.ts

### Finding 3: LLM-FUNC
- **Metric:** parsePokemonSheet = 131 lines, event handler = 137 lines
- **Threshold:** >50 lines = flag, >80 lines = P0
- **Impact:** LLMs cannot reliably reason about 130-line functions with hardcoded row/column indices
- **Evidence:** parsePokemonSheet (lines 248-378), defineEventHandler callback (lines 381-518)

## Suggested Refactoring

1. Extract CSV parser into `app/server/utils/csv-parser.ts` (reusable utility)
2. Extract trainer sheet parser into `app/server/services/csv-import.service.ts`
3. Extract Pokemon sheet parser into same service
4. Route Pokemon creation through `pokemon-generator.service.ts` (`createPokemonRecord()`) to ensure consistent defaults
5. Reduce API handler to: parse body → detect type → delegate to service → return response

Estimated commits: 3-4

## Related Lessons
- Pattern F (duplicate code paths) — Pokemon creation inline instead of through canonical service

## Resolution Log
- Commits: e5baa15, d97fa77, 0f2277b, 4951202
- Files changed: app/server/api/characters/import-csv.post.ts (518 → 46 lines), app/server/services/pokemon-generator.service.ts (added optional nature/shiny/heldItem overrides)
- New files created: app/server/utils/csv-parser.ts (70 lines), app/server/services/csv-import.service.ts (395 lines)
- Tests passing: typecheck shows only pre-existing errors (location type in create.vue, scenes/[id].vue) — no new issues from refactoring
