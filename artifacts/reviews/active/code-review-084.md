---
review_id: code-review-084
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: code-review-082 HIGH issue, ptu-rule-073
domain: combat
commits_reviewed:
  - f9ecba1
  - b3b37a5
  - 5ef6676
files_reviewed:
  - app/tests/unit/utils/moveFrequency.test.ts
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-02-20T05:00:00Z
---

## Review Scope

Two fixes from the session 6 review feedback (code-review-082):
1. **Fix 1 (f9ecba1):** Added unit tests for `resetDailyUsage()` -- was flagged as HIGH in code-review-082 for zero test coverage.
2. **Fix 2 (b3b37a5, 5ef6676):** Added weather fields to sprint and breather response objects -- ptu-rule-073 filed during code-review-082.

## Status Table

| Fix | Description | Plan | Actual | Status |
|-----|-------------|------|--------|--------|
| resetDailyUsage tests | Add 5+ tests for the function | 8 tests added | All 8 comprehensive, all pass | APPROVED |
| ptu-rule-073 weather fields | Add 3 weather fields to sprint + breather responses | Fields added correctly | Weather fields match end.post.ts, BUT 5 other fields still missing | HIGH: incomplete fix |

## Fix 1: resetDailyUsage tests -- APPROVED

All 62 tests in `moveFrequency.test.ts` pass. The 8 new tests in the `resetDailyUsage` describe block cover:

1. Resets `usedToday` to 0 for all daily variants (Daily, Daily x2, Daily x3) -- covers the primary behavior
2. Resets `lastUsedAt` to `undefined` -- covers the secondary reset field
3. Returns same reference for non-daily moves (At-Will, Scene, EOT) -- verifies the optimization path
4. Does not mutate original array or move objects -- enforces immutability contract
5. Returns new array reference -- verifies structural immutability
6. Resets move with only `lastUsedAt` set (usedToday is 0) -- edge case: the `needsReset` condition has an OR branch for `lastUsedAt !== undefined`; this test specifically exercises that branch
7. Handles empty array -- defensive edge case
8. Preserves non-daily fields on reset moves -- verifies spread operator does not drop `usedThisScene`, `lastTurnUsed`, or other move fields

This exceeds the 5-test minimum specified in code-review-082. The tests follow the exact structural pattern of the existing `resetSceneUsage` tests (immutability checks, same-reference optimization, edge cases). Test names are descriptive and assertions are specific. No issues.

## Fix 2: ptu-rule-073 weather fields -- INCOMPLETE

The three weather fields were added correctly to both endpoints. The `parsed` object in `sprint.post.ts` (lines 65-80) and `breather.post.ts` (lines 131-146) now includes:

```typescript
weather: record.weather ?? null,
weatherDuration: record.weatherDuration ?? 0,
weatherSource: record.weatherSource ?? null,
```

This matches the coalescing pattern from `end.post.ts`. The weather fix itself is correct.

**However, the ticket description said "check if there are ANY other fields missing, not just weather."** The response objects in both `sprint.post.ts` and `breather.post.ts` are manually constructed inline instead of using `buildEncounterResponse()` from `encounter.service.ts`. Comparing against the `Encounter` interface (`app/types/encounter.ts:96-134`) and the canonical `buildEncounterResponse` output (`encounter.service.ts:200-223`), these fields are still missing from both endpoints:

| Field | Required in `Encounter` interface | In `buildEncounterResponse` | In sprint/breather |
|-------|-----------------------------------|----------------------------|--------------------|
| `isServed` | Yes (non-optional) | `record.isServed` | MISSING |
| `gridConfig` | Yes (non-optional) | Built from grid* columns | MISSING |
| `sceneNumber` | Yes (non-optional) | `1` (hardcoded) | MISSING |
| `currentPhase` | Yes (non-optional) | `'pokemon'` (default) | MISSING |
| `trainerTurnOrder` | Yes (non-optional) | `[]` (default) | MISSING |
| `pokemonTurnOrder` | Yes (non-optional) | `[]` (default) | MISSING |
| `createdAt` | In `ParsedEncounter` | `record.createdAt` | MISSING |
| `updatedAt` | In `ParsedEncounter` | `record.updatedAt` | MISSING |

Both endpoints' responses are consumed by `useEncounterActions.ts` which directly assigns the result to `encounterStore.encounter` (lines 143, 149). Since `encounterStore.encounter` is typed as `Encounter | null`, the missing fields mean the store holds an object that violates its own type contract after Sprint or Take a Breather actions. Any code that reads `encounter.isServed`, `encounter.gridConfig`, `encounter.sceneNumber`, or `encounter.currentPhase` will get `undefined` instead of the expected value.

**Note:** `end.post.ts` has the same problem -- it also builds the response manually and omits the same fields. The ticket used `end.post.ts` as the reference pattern, but `end.post.ts` is itself incomplete. The correct reference is `buildEncounterResponse()` in `encounter.service.ts`, which all other combat endpoints (damage, heal, status, stages, move, next-scene, start, serve, unserve) already use.

## Issues

### HIGH

1. **Sprint and breather endpoints should use `buildEncounterResponse()` instead of manual response construction** -- `app/server/api/encounters/[id]/sprint.post.ts:65-80`, `app/server/api/encounters/[id]/breather.post.ts:131-146`

   Both endpoints manually construct their `parsed` response object, omitting `isServed`, `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, and `updatedAt`. This is the same root cause as ptu-rule-073: copying a hand-built response pattern instead of calling the shared builder.

   The endpoints already import `loadEncounter` from `encounter.service.ts`, so `buildEncounterResponse` is trivially available. The fix is to replace the manual object construction with:

   **sprint.post.ts** (replace lines 63-80):
   ```typescript
   const response = buildEncounterResponse(record, combatants, { moveLog })
   ```

   **breather.post.ts** (replace lines 129-146):
   ```typescript
   const response = buildEncounterResponse(record, combatants, { moveLog })
   ```

   This also requires updating the imports to include `buildEncounterResponse`. The `turnOrder` parse at the line before the `parsed` object can be removed since `buildEncounterResponse` handles it internally.

   **This also applies to `end.post.ts`** (lines 158-175), which has the same manual construction. However, `end.post.ts` overrides `isActive` and `isPaused`, so its call would be:
   ```typescript
   const response = buildEncounterResponse(encounter, updatedCombatants, {
     isActive: false,
     isPaused: false,
     moveLog: JSON.parse(encounter.moveLog),
     defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
   })
   ```

   Filing as HIGH rather than CRITICAL because the missing fields are defaulted by JavaScript to `undefined`, and the current UI code may not actively read `isServed` or `gridConfig` from the encounter store after these specific actions. But it is a type contract violation that will cause a bug the moment any downstream code touches these fields after a Sprint or Breather.

## What Looks Good

- **Test quality** on the `resetDailyUsage` tests is strong. The edge case at line 474 (`usedToday: 0` but `lastUsedAt` set) specifically exercises the OR branch in the `needsReset` condition -- this shows the developer read the implementation, not just the function signature.

- **Weather coalescing** (`?? null`, `?? 0`) is correct and matches the pattern everywhere else.

- **Commit granularity** is appropriate -- tests in one commit, fix in two separate commits (one per endpoint).

## Verdict

CHANGES_REQUIRED -- The weather field fix is correct but incomplete. Both sprint and breather endpoints (and also end.post.ts) should use `buildEncounterResponse()` instead of manual response construction, which would fix all missing fields at once and prevent future drift. The resetDailyUsage tests are approved with no changes needed.

## New Tickets Filed

1. **ptu-rule-073 (reopen/expand):** Sprint, breather, and end endpoints should use `buildEncounterResponse()` instead of manual response construction. The weather field fix addressed 3 of 8+ missing fields; the root cause is duplicate response building that drifts from the canonical shape. The fix is mechanical: replace the manual `parsed` object with a call to the shared builder.
