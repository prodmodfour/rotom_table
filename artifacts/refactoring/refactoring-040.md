---
ticket_id: refactoring-040
priority: P2
categories:
  - EXT-INCONSISTENT
affected_files:
  - app/server/api/characters/[id].put.ts
  - app/server/api/pokemon/[id].put.ts
  - app/server/api/characters/index.post.ts
  - app/server/api/characters/index.get.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-19T16:00:00
found_by: code-review-050
---

## Summary

PUT (and POST/LIST) response shapes for characters and Pokemon omit fields that the GET detail endpoint returns. Most critically, PUT endpoints now accept healing field writes but don't return those fields in the response. A client writing healing data and using the response to sync local state will silently lose those fields.

## Findings

### Finding 1: EXT-INCONSISTENT — Character PUT response missing 15+ fields vs GET

**GET** (`[id].get.ts`) returns a full entity shape including: `injuries`, `temporaryHp`, `lastInjuryTime`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`, `drainedAp`, `playedBy`, `age`, `gender`, `height`, `weight`, `features`, `edges`, `background`, `personality`, `goals`.

**PUT** (`[id].put.ts:56-82`) returns a slim shape missing ALL of these fields.

- **Metric:** 15+ fields present in GET but absent in PUT response
- **Threshold:** PUT response should include fields the PUT accepts for write
- **Impact:** Client sends healing field update, uses response to update local state → healing fields silently disappear from local state. Forces client to either ignore PUT responses or make a follow-up GET.

### Finding 2: EXT-INCONSISTENT — Pokemon PUT response missing healing fields vs GET

**GET** (`pokemon/[id].get.ts`) returns: `injuries`, `temporaryHp`, `lastInjuryTime`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`, `capabilities`, `skills`, `tutorPoints`, `trainingExp`, `eggGroups`.

**PUT** (`pokemon/[id].put.ts:77-116`) missing: `injuries`, `temporaryHp`, `lastInjuryTime`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`.

### Finding 3: EXT-INCONSISTENT — Character LIST and POST also slim

- **LIST** (`index.get.ts`) missing: `injuries`, `temporaryHp`, healing fields — acceptable for list view but noted for completeness.
- **POST** (`index.post.ts`) missing same fields as PUT — newly created characters will always have defaults (0/null), so lower impact.

## Suggested Refactoring

1. Create a shared response serializer function per entity type (e.g., `serializeCharacter(character)` and `serializePokemon(pokemon)`) that returns the full field set
2. Use the serializer in GET, PUT, and POST endpoints to guarantee consistent response shapes
3. For LIST, use a `serializeCharacterSummary()` variant if the full shape is too heavy
4. This eliminates the risk of future field additions being missed in some endpoints

Estimated commits: 2-3

## Related Lessons
- "fix one, miss the rest" pattern — healing fields were added to the write path of PUT but the response shape wasn't updated to match

## Resolution Log
- Commits: d49325d
- Files changed:
  - `app/server/api/characters/[id].get.ts` — replaced inline serialization with `serializeCharacter()`
  - `app/server/api/characters/[id].put.ts` — replaced slim response with `serializeCharacter()`, added `include: { pokemon: true }` to update query
  - `app/server/api/characters/index.post.ts` — replaced inline serialization with `serializeCharacter()`, added `include: { pokemon: true }` to create query
  - `app/server/api/characters/index.get.ts` — replaced inline serialization with `serializeCharacterSummary()`; now includes `injuries`, `temporaryHp`, healing fields, `drainedAp`
  - `app/server/api/pokemon/[id].get.ts` — replaced inline serialization with `serializePokemon()`
  - `app/server/api/pokemon/[id].put.ts` — replaced slim response with `serializePokemon()`; now includes `capabilities`, `skills`, `tutorPoints`, `trainingExp`, `eggGroups`, `injuries`, `temporaryHp`, healing time fields
  - `app/server/api/pokemon/index.post.ts` — replaced inline serialization with `serializePokemon()`; now includes `injuries`, `temporaryHp`, healing time fields
  - `app/server/api/pokemon/index.get.ts` — replaced inline serialization with `serializePokemon()`; now includes `capabilities`, `skills`, `tutorPoints`, `trainingExp`, `eggGroups`, `injuries`, `temporaryHp`, healing time fields
- New files created:
  - `app/server/utils/serializers.ts` — shared serializer functions: `serializeCharacter()`, `serializeCharacterSummary()`, `serializePokemon()`
- Tests passing: 508/508 unit tests pass
