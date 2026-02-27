---
review_id: code-review-081
trigger: orchestrator-routed
target_tickets: [ptu-rule-061]
reviewed_commits: [batch-F weather duration counter]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T00:00:00Z
reviewer: senior-reviewer
---

## Scope

Review of **ptu-rule-061**: Weather duration counter with auto-expiration. This feature adds:
- Schema columns: `weatherDuration Int` and `weatherSource String?` on the Encounter model
- New `POST /encounters/:id/weather` endpoint with source-based duration defaults
- Turn progression decrements counter at round end, auto-clears weather when counter reaches 0
- All encounter API endpoints updated to include weather fields in responses
- WebSocket sync includes weather fields
- Encounter store: new `setWeather()` action with WebSocket surgical update support
- GM UI: weather dropdown + source selector + rounds badge
- Group view: weather badge with remaining rounds display

### Files Reviewed

| File | Lines | Role |
|------|-------|------|
| `app/prisma/schema.prisma` | 476 | Schema: new columns |
| `app/types/encounter.ts` | 163 | Type additions |
| `app/server/services/encounter.service.ts` | 265 | Response building |
| `app/server/api/encounters/[id]/weather.post.ts` | 69 | New endpoint |
| `app/server/api/encounters/[id]/next-turn.post.ts` | 132 | Round-end decrement |
| `app/server/api/encounters/[id].put.ts` | 79 | Undo/redo persistence |
| `app/stores/encounter.ts` | 604 | Store: setWeather + WS updates |
| `app/components/gm/EncounterHeader.vue` | 365 | GM weather UI controls |
| `app/pages/gm/index.vue` | 511 | Handler wiring |
| `app/pages/group/_components/EncounterView.vue` | 362 | Group view badge |
| `app/server/routes/ws.ts` | 279 | WebSocket sync |
| `app/server/api/encounters/[id].get.ts` | 64 | GET includes weather |
| `app/server/api/encounters/served.get.ts` | 52 | Served GET includes weather |
| `app/server/api/encounters/index.post.ts` | 75 | Create includes weather |
| `app/server/api/encounters/from-scene.post.ts` | 156 | Scene create includes weather |
| `app/server/api/encounters/[id]/start.post.ts` | 142 | Start uses buildEncounterResponse |
| `app/server/api/encounters/[id]/end.post.ts` | 155 | End includes weather |
| `app/server/api/encounters/[id]/serve.post.ts` | 61 | Serve includes weather |
| `app/server/api/encounters/[id]/unserve.post.ts` | 54 | Unserve includes weather |
| `app/server/api/encounters/[id]/damage.post.ts` | 86 | Uses buildEncounterResponse |
| `app/server/api/encounters/[id]/heal.post.ts` | 76 | Uses buildEncounterResponse |
| `app/server/api/encounters/[id]/status.post.ts` | 74 | Uses buildEncounterResponse |
| `app/server/api/encounters/[id]/stages.post.ts` | 68 | Uses buildEncounterResponse |
| `app/server/api/encounters/[id]/move.post.ts` | 173 | Uses buildEncounterResponse |
| `app/server/api/encounters/[id]/combatants.post.ts` | 90 | Uses buildEncounterResponse |
| `app/composables/useWebSocket.ts` | 201 | Client WS handler |

---

## Issues Found

### HIGH: Missing undo/redo snapshot capture before weather change

**File:** `app/pages/gm/index.vue`, lines 375-386

The `handleSetWeather` function calls `encounterStore.setWeather(...)` directly without first calling `encounterStore.captureSnapshot('Set Weather')`. Every other action handler in this page and in `useEncounterActions.ts` follows the pattern of capturing a snapshot before the mutation (damage, heal, stages, status, move execution, token movement). This means weather changes cannot be undone via Ctrl+Z.

**Fix:** Add `encounterStore.captureSnapshot(...)` call before `encounterStore.setWeather(...)`:

```typescript
const handleSetWeather = async (weather: string | null, source: string) => {
  const label = weather
    ? `Set weather to ${weather} (${source})`
    : 'Cleared weather'
  encounterStore.captureSnapshot(label)
  await encounterStore.setWeather(weather, source as 'move' | 'ability' | 'manual')
  refreshUndoRedoState()
  // ...rest unchanged
}
```

Also note: `refreshUndoRedoState()` is missing after the setWeather call; other handlers call this after their action to update the undo/redo button states.

### MEDIUM: PTU ability-sourced weather should not auto-expire on timer

**File:** `app/server/api/encounters/[id]/weather.post.ts`, line 40

The endpoint treats both `move` and `ability` sources identically with a 5-round default duration. However, per PTU rules, ability-sourced weather (Drizzle, Drought, Snow Warning, Sand Stream) has different semantics than move-sourced weather. The abilities themselves are "Scene" frequency, meaning they activate once per scene — but the actual weather they create does last 5 rounds (confirmed in the reference text: "The Weather changes to be Rainy for 5 rounds").

However, the next-turn decrement logic at line 72 of `next-turn.post.ts` applies the same treatment:
```typescript
if (weather && weatherDuration > 0 && weatherSource !== 'manual') {
```

This is functionally correct for the current PTU 1.05 rules. The distinction between `move` and `ability` sources in the data model is useful for future extensibility (e.g., abilities like Sand Stream that persist while the Pokemon is in play in some interpretations). No fix required now, but documenting this for awareness.

---

## Checklist Verification

### 1. WebSocket Chain: server broadcast -> client composable -> store updates

**PASS.** The chain is complete:
- **Server (ws.ts, line 136-139):** `encounter_update` messages from GM are broadcast to all encounter viewers via `broadcastToEncounter`.
- **Client (useWebSocket.ts, line 82-83):** `encounter_update` messages call `getEncounterStore().updateFromWebSocket(message.data)`.
- **Store (encounter.ts, lines 349-356):** `updateFromWebSocket()` surgically updates `weather`, `weatherDuration`, and `weatherSource` using explicit `!== undefined` checks, which correctly handles `null` weather values.

The `sendEncounterState` function in ws.ts (lines 27-29) also includes all three weather fields when syncing full state to newly connected peers.

### 2. Undo/Redo Support

**PARTIAL FAIL.** The PUT endpoint (`[id].put.ts`, lines 22-23) correctly persists `weatherDuration` and `weatherSource` from the body, so undo/redo snapshots that include weather state will be correctly restored. However, the snapshot is never captured before weather changes (see HIGH issue above).

### 3. Auto-Clear Logic in Next-Turn

**PASS.** The logic in `next-turn.post.ts` (lines 70-80) is correct:
- Only decrements when `weatherDuration > 0` AND `weatherSource !== 'manual'`
- On reaching 0, clears `weather`, `weatherDuration`, and `weatherSource` to null/0
- Decrement happens only at round end (when `currentTurnIndex >= turnOrder.length`)
- All three fields are persisted to DB (lines 83-93) and included in the response (lines 99-101)

### 4. Manual Weather Persistence

**PASS.** Manual weather (source = 'manual') gets duration 0 in the weather endpoint (line 44: "Manual weather: duration stays 0 (indefinite)"). The next-turn decrement explicitly skips when `weatherSource !== 'manual'` OR `weatherDuration > 0` is false.

### 5. buildEncounterResponse Includes Weather Fields

**PASS.** The `buildEncounterResponse` function (encounter.service.ts, lines 204-206) includes all three fields:
```typescript
weather: record.weather ?? null,
weatherDuration: record.weatherDuration ?? 0,
weatherSource: record.weatherSource ?? null,
```

The `EncounterRecord` interface (lines 15-16) and `ParsedEncounter` interface (lines 46-47) both include the new fields. All endpoints using `buildEncounterResponse` (damage, heal, status, stages, move, combatants.post, start) automatically get weather fields.

### 6. GM UI: Weather Controls

**PASS.** `EncounterHeader.vue` provides:
- Weather dropdown with all 9 PTU weather types plus "No Weather" (lines 38-48)
- Source selector (Manual/Move/Ability) that appears only when weather is active (lines 49-59)
- Weather badge with duration counter `(Xr)` or `(manual)` label (lines 16-25)
- Tooltip with full context string (lines 187-195)
- `WEATHER_LABELS` lookup map for display names (lines 145-155)
- Emits `setWeather` event with weather value and source (lines 197-207)

### 7. Group View: Weather Badge

**PASS.** `EncounterView.vue` renders:
- Weather badge with label and rounds remaining (lines 22-27)
- Same `WEATHER_LABELS` map for display names (lines 66-76)
- Tooltip with duration context (lines 183-191)

### 8. File Sizes

**PASS.** All files are well under the 800-line limit. The largest is `encounter.ts` (store) at 604 lines — acceptable for a central store with 20+ actions.

### 9. Schema Migration

**PASS.** `prisma db push` was confirmed to have been run — the actual database contains `weatherDuration Int @default(0)` and `weatherSource String?` columns on the Encounter model, matching the schema definition.

---

## What Looks Good

1. **Comprehensive endpoint coverage.** All 12+ encounter endpoints that return encounter data include the three weather fields. Both inline-built responses and `buildEncounterResponse`-based responses are consistent.

2. **Correct PTU duration.** The `PTU_WEATHER_DURATION = 5` constant matches the rulebook: Sunny Day, Rain Dance, Hail, and Sandstorm all last 5 rounds. Drizzle, Drought, and Snow Warning also create 5-round weather per the ability descriptions.

3. **Clean separation of concerns.** Weather logic is properly distributed: the `weather.post.ts` endpoint handles setting, `next-turn.post.ts` handles decrement, the store provides the action, and the UI is purely presentational via events.

4. **WebSocket surgical updates.** The store's `updateFromWebSocket` method (lines 349-356) uses `!== undefined` checks for weather fields, meaning it won't accidentally clear weather when receiving partial updates. This is a correct defensive pattern.

5. **Immutable response building.** The weather endpoint creates a spread copy of the record with updated fields (`{ ...record, weather: updated.weather, ... }`) rather than mutating.

6. **Group view is read-only.** The group view only displays weather state — it has no controls to change it. Weather control is exclusively a GM action, which is the correct design.

7. **Source-based duration defaults.** The weather endpoint intelligently defaults duration based on source: moves/abilities get 5 rounds, manual gets 0 (indefinite). Explicit duration override is also supported for edge cases.

---

## New Tickets Filed

### ptu-rule-061-fix-001: Add undo/redo snapshot capture for weather changes

**Priority:** HIGH
**Type:** fix
**Description:** The `handleSetWeather` handler in `app/pages/gm/index.vue` does not call `encounterStore.captureSnapshot()` before calling `setWeather()`, and also does not call `refreshUndoRedoState()` after. This means:
- Weather changes cannot be undone with Ctrl+Z
- The undo/redo button state does not update after weather changes

**Fix:** Add snapshot capture and undo state refresh, matching the pattern used by all other action handlers:
```typescript
const handleSetWeather = async (weather: string | null, source: string) => {
  const label = weather ? `Set weather to ${weather} (${source})` : 'Cleared weather'
  encounterStore.captureSnapshot(label)
  await encounterStore.setWeather(weather, source as 'move' | 'ability' | 'manual')
  refreshUndoRedoState()
  await nextTick()
  if (encounterStore.encounter) {
    send({ type: 'encounter_update', data: encounterStore.encounter })
  }
}
```

**Affected files:** `app/pages/gm/index.vue`

---

## Verdict

**APPROVED_WITH_ISSUES**

The weather duration counter feature is well-implemented and PTU-accurate. The WebSocket chain is fully wired, auto-expiration logic is correct, manual weather persists indefinitely, and all endpoints return consistent weather data. The one HIGH issue (missing undo/redo snapshot for weather changes) is a genuine functional gap but is isolated to one handler and has a straightforward 3-line fix. The feature is safe to ship with this fix applied promptly.
