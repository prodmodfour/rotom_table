---
ticket_id: ptu-rule-073
priority: P3
status: resolved
domain: combat
source: code-review-082
created_at: 2026-02-20
created_by: senior-reviewer
severity: MEDIUM
affected_files:
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
---

## Summary

Sprint and breather endpoint responses omit the `weather`, `weatherDuration`, and `weatherSource` fields from the parsed encounter object. The `Encounter` TypeScript interface requires `weatherDuration: number` (non-optional). This causes the client-side encounter store to receive an incomplete encounter object after Sprint or Take a Breather actions.

## Expected Behavior

All encounter action endpoints should return a complete `Encounter` object including weather fields, matching the pattern used by `end.post.ts`, `serve.post.ts`, `unserve.post.ts`, and `next-turn.post.ts`.

## Current Behavior

The `parsed` object in both `sprint.post.ts` (line 65) and `breather.post.ts` (line 131) is missing:
- `weather: record.weather ?? null`
- `weatherDuration: record.weatherDuration ?? 0`
- `weatherSource: record.weatherSource ?? null`

This means after Sprint or Take a Breather, `encounterStore.encounter.weatherDuration` becomes `undefined` instead of its actual value.

## Fix

Add the three weather fields to the `parsed` object in both endpoints, following the pattern from `end.post.ts`:

```typescript
const parsed = {
  id: record.id,
  name: record.name,
  battleType: record.battleType,
  weather: record.weather ?? null,         // ADD
  weatherDuration: record.weatherDuration ?? 0,  // ADD
  weatherSource: record.weatherSource ?? null,    // ADD
  combatants,
  // ... rest unchanged
}
```

## Notes

This is a pre-existing pattern from breather.post.ts that the sprint endpoint inherited by copying the response shape. Both endpoints need the fix.

## Resolution Log

- **2026-02-20**: Added `weather`, `weatherDuration`, and `weatherSource` fields to the `parsed` object in both `sprint.post.ts` and `breather.post.ts`, matching the pattern from `end.post.ts`. Commit: `fix: add missing weather fields to sprint and breather responses`.
