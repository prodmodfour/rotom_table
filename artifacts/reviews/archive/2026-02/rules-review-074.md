---
review_id: rules-review-074
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-073
domain: combat
commits_reviewed:
  - f9ecba1
  - b3b37a5
  - 5ef6676
mechanics_verified:
  - daily-move-reset
  - sprint-weather-passthrough
  - breather-weather-passthrough
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/10-indices-and-reference.md#Frequency
  - core/07-combat.md#Sprint-Maneuver
  - core/07-combat.md#Take-a-Breather
  - core/07-combat.md#Resting
reviewed_at: 2026-02-20T23:00:00
---

## Scope

Review of two Developer fixes:
1. **Commit f9ecba1** -- Unit tests for `resetDailyUsage()` in `app/tests/unit/utils/moveFrequency.test.ts`
2. **Commits b3b37a5, 5ef6676** -- Weather fields added to sprint/breather API responses (ptu-rule-073)

## Mechanics Verified

### 1. resetDailyUsage Test Coverage -- CORRECT

**PTU Rule (p.337):**
> "Daily is the lowest Frequency. This Move's Frequency is only refreshed by an Extended Rest, or by a visit to the Pokemon Center."

**PTU Rule (p.253, Resting):**
> "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
> "Pokemon Centers... restore the Frequency of Daily-Frequency Moves."

**What resetDailyUsage does:** Clears `usedToday` to 0 and removes `lastUsedAt` for all Daily-frequency moves. This is the correct reset operation for a new day or Pokemon Center healing.

**Test assertions verified against PTU rules:**

| Test | Assertion | PTU Correctness |
|------|-----------|-----------------|
| Resets usedToday to 0 for Daily, Daily x2, Daily x3 | `usedToday: 0` after reset | Correct -- a new day restores all daily uses. Daily x1 gets 1, Daily x2 gets 2, Daily x3 gets 3 (all tracked as usedToday counting up from 0). |
| Resets lastUsedAt to undefined | Timestamp cleared | Correct -- the tracking timestamp is implementation-specific state, not a PTU mechanic; clearing it is sound. |
| Same reference for non-daily moves (At-Will, Scene, EOT) | `result[i] === original` | Correct -- resetDailyUsage should not touch At-Will, Scene, or EOT moves. Scene usage is governed by `resetSceneUsage` separately. EOT is turn-based, not day-based. |
| Does not mutate original array or move objects | Original values unchanged after reset | Correct -- immutability pattern, not a PTU rule, but architecturally sound. |
| Handles empty array | Returns `[]` | Correct -- edge case, no PTU implication. |
| Preserves non-daily fields (usedThisScene, lastTurnUsed) | Scene/turn tracking preserved after daily reset | Correct -- this is important. A new day resets daily uses but does NOT reset scene uses. Scene usage resets only when a new scene begins. PTU p.337: "Moves that can be used multiple times Daily can still only be used once a Scene." If usedThisScene were cleared by resetDailyUsage, a Daily x2 move used earlier in the same scene could be used again in that scene after a day boundary, violating the per-scene cap. |
| Resets move with only lastUsedAt set (usedToday is 0) | Still creates new object with lastUsedAt cleared | Correct -- edge case handling; if lastUsedAt was somehow set without incrementing usedToday, it still gets cleaned up. |

**Implementation cross-reference (moveFrequency.ts:251-263):**

```typescript
export function resetDailyUsage(moves: Move[]): Move[] {
  return moves.map(move => {
    const needsReset = (move.usedToday ?? 0) > 0 || move.lastUsedAt !== undefined
    if (!needsReset) {
      return move
    }
    return {
      ...move,
      usedToday: 0,
      lastUsedAt: undefined
    }
  })
}
```

The function correctly:
- Only targets moves with `usedToday > 0` or `lastUsedAt` set (daily moves that were used)
- Returns the original reference for non-daily moves (no unnecessary object creation)
- Resets only `usedToday` and `lastUsedAt`, preserving `usedThisScene` and `lastTurnUsed`
- Uses immutable spread to avoid mutation

**One subtlety worth noting:** The function resets ALL moves with `usedToday > 0`, not just moves with a Daily frequency. This means if a non-daily move somehow had `usedToday` set (data corruption), it would get cleared. This is a reasonable defensive behavior and does not violate any PTU rule.

**Verdict for Fix 1: CORRECT.** All test assertions accurately encode PTU daily-frequency reset rules. The preservation of `usedThisScene` on daily reset is particularly important and correctly tested.

### 2. Weather Fields in Sprint Response (ptu-rule-073) -- CORRECT

**PTU Rule (p.244, Sprint Maneuver):**
> "Maneuver: Sprint. Action: Standard. Class: Status. Range: Self. Effect: Increase your Movement Speeds by 50% for the rest of your turn."

Sprint is purely a movement buff. It does not interact with weather in any way. The fix adds weather fields to the **response object**, not to the Sprint logic itself.

**Implementation (sprint.post.ts:65-81):**

```typescript
const parsed = {
  id: record.id,
  name: record.name,
  battleType: record.battleType,
  weather: record.weather ?? null,         // ADDED
  weatherDuration: record.weatherDuration ?? 0,  // ADDED
  weatherSource: record.weatherSource ?? null,    // ADDED
  combatants,
  currentRound: record.currentRound,
  currentTurnIndex: record.currentTurnIndex,
  turnOrder,
  isActive: record.isActive,
  isPaused: record.isPaused,
  moveLog,
  defeatedEnemies: JSON.parse(record.defeatedEnemies)
}
```

**Verification:**
- The weather fields are read-only passthroughs from `record` (the DB row). They are NOT modified.
- The Sprint endpoint does not write any weather data back to the database (`prisma.encounter.update` only writes `combatants` and `moveLog`).
- The `?? null` / `?? 0` defaults match the Prisma schema: `weather String?` (nullable), `weatherDuration Int @default(0)`, `weatherSource String?` (nullable).
- This matches the pattern used by `end.post.ts`, `serve.post.ts`, `unserve.post.ts`, `next-turn.post.ts`, `index.get.ts`, and `served.get.ts`.

Sprint does not modify weather state, and the fix does not introduce any weather modification. This is purely a response completeness fix. **CORRECT.**

### 3. Weather Fields in Breather Response (ptu-rule-073) -- CORRECT

**PTU Rule (p.245, Take a Breather):**
> "Taking a Breather is a Full Action... set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions."

Take a Breather affects: combat stages, temporary HP, volatile status conditions, Slowed, and Stuck. It does NOT affect weather.

**Implementation (breather.post.ts:130-146):**

```typescript
const parsed = {
  id: record.id,
  name: record.name,
  battleType: record.battleType,
  weather: record.weather ?? null,         // ADDED
  weatherDuration: record.weatherDuration ?? 0,  // ADDED
  weatherSource: record.weatherSource ?? null,    // ADDED
  combatants,
  currentRound: record.currentRound,
  currentTurnIndex: record.currentTurnIndex,
  turnOrder,
  isActive: record.isActive,
  isPaused: record.isPaused,
  moveLog,
  defeatedEnemies: JSON.parse(record.defeatedEnemies)
}
```

**Verification:**
- Same read-only passthrough pattern as Sprint. Weather fields are read from `record` and returned without modification.
- The Breather endpoint's `prisma.encounter.update` only writes `combatants` and `moveLog` -- no weather mutation.
- The Breather's actual game effects (stage reset, temp HP removal, condition curing, Tripped/Vulnerable application) are all correctly scoped to the combatant entity and do not touch encounter-level weather state.
- Default values match the Prisma schema.

Take a Breather does not modify weather, and the fix does not introduce any weather modification. **CORRECT.**

## Cross-Check: Could Sprint or Breather Theoretically Affect Weather?

Neither PTU Sprint (p.244) nor Take a Breather (p.245) has any weather interaction. The only combat actions that affect weather are:
- Weather-setting Moves (Rain Dance, Sunny Day, Sandstorm, Hail, etc.)
- Weather-setting Abilities (Drizzle, Drought, Sand Stream, Snow Warning, etc.)
- GM manual weather changes

The `next-turn.post.ts` endpoint handles weather duration decrement during turn advancement, which is the correct location for weather expiry. Sprint and Breather should never modify weather state, and they do not.

## Issues Found

None.

## Verdict

**APPROVED**

Both fixes are correct:

1. **resetDailyUsage tests (f9ecba1):** All 8 test cases accurately encode PTU daily-frequency rules. The key assertion -- that `usedThisScene` is preserved during daily reset -- correctly enforces the PTU rule that Daily x2/x3 moves can only be used once per scene even across day boundaries.

2. **Weather fields in sprint/breather responses (b3b37a5, 5ef6676):** The weather fields are read-only passthroughs that complete the response object shape. Neither Sprint nor Take a Breather has any weather interaction in PTU rules, and the implementation correctly passes weather through without modification.
