---
ticket_id: ptu-rule-061
priority: P2
status: resolved
domain: scenes
matrix_source:
  rule_id: scenes-R040
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Weather persists indefinitely with no duration counter or automatic expiration. PTU weather effects typically last 5 rounds in combat unless sustained by an ability.

## Expected Behavior (PTU Rules)

Per PTU Core: weather effects from moves last 5 rounds. Weather from abilities persists while the ability user is active. There should be a turn counter that decrements and auto-clears weather.

## Actual Behavior

Weather is set on a scene and persists until manually changed. No round counter, no automatic expiration.

## Resolution Log

### 2026-02-20: Weather duration tracking implemented

**Schema changes:**
- Added `weatherDuration` (Int, default 0) and `weatherSource` (String, nullable) fields to `Encounter` model in Prisma schema
- `weatherDuration`: rounds remaining (0 = indefinite/manual)
- `weatherSource`: `'move'`, `'ability'`, or `'manual'` -- determines expiration behavior

**Type changes:**
- Added `weatherDuration` and `weatherSource` to `Encounter` TypeScript interface

**Backend (API) changes:**
- New `POST /api/encounters/:id/weather` endpoint for setting weather with source and duration
- Default PTU duration: 5 rounds for `move` and `ability` sources; 0 (indefinite) for `manual`
- `next-turn.post.ts`: decrements `weatherDuration` at end of each round; auto-clears weather when counter reaches 0; manual weather is exempt from auto-expiration
- All encounter response endpoints now include `weather`, `weatherDuration`, `weatherSource` fields (12 endpoints updated)
- `[id].put.ts` persists weather fields to support undo/redo

**Encounter store:**
- New `setWeather(weather, source, duration?)` action
- `updateFromWebSocket` handles `weatherDuration` and `weatherSource` fields

**UI changes:**
- `EncounterHeader.vue` (GM view): weather badge with round counter + weather type/source dropdown controls
- `EncounterView.vue` (group view): weather badge with round counter displayed alongside round badge
- WebSocket `ws.ts` includes weather fields in encounter state sync

**Test results:** All 578 unit tests pass (0 regressions).

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
