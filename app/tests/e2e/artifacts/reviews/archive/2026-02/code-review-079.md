---
review_id: code-review-079
trigger: orchestrator-routed
target_tickets: [ptu-rule-052, ptu-rule-053]
reviewed_commits: [540270d, d78f7c7]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T12:00:00Z
reviewer: senior-reviewer
---

## Scope

Batch D review covering two healing-domain tickets:

- **ptu-rule-052**: Extended Rest daily move rolling window (prevents same-day refresh)
- **ptu-rule-053**: Bound AP tracking (new DB column, lifecycle clearing, serialization)

### Files Reviewed

| File | Ticket |
|------|--------|
| `app/utils/restHealing.ts` | 052 + 053 |
| `app/types/character.ts` | 052 + 053 |
| `app/prisma/schema.prisma` | 053 |
| `app/server/api/pokemon/[id]/extended-rest.post.ts` | 052 |
| `app/server/api/characters/[id]/extended-rest.post.ts` | 053 |
| `app/server/api/characters/[id]/new-day.post.ts` | 053 |
| `app/server/api/game/new-day.post.ts` | 053 |
| `app/server/api/scenes/[id]/deactivate.post.ts` | 053 |
| `app/server/api/scenes/[id]/activate.post.ts` | 053 |
| `app/server/api/characters/[id].put.ts` | 053 |
| `app/server/utils/serializers.ts` | 053 |
| `app/server/services/combatant.service.ts` | 053 |
| `app/tests/unit/utils/restHealing.test.ts` | 052 + 053 |
| `app/tests/unit/stores/library.test.ts` | 053 |
| `app/server/api/encounters/[id]/end.post.ts` | Cross-ref |

---

## Issues Found

### HIGH — Encounter end does not clear boundAp (ptu-rule-053)

**File:** `app/server/api/encounters/[id]/end.post.ts`

PTU Core p.59 explicitly states: "[Stratagem] Features may only be bound during combat and automatically unbind when combat ends." The encounter end endpoint clears volatile conditions and resets scene-frequency moves, but does NOT clear `boundAp` for human combatants.

The scene deactivation endpoint does clear `boundAp`, but encounters and scenes are not always 1:1. An encounter can end without a scene deactivation (e.g., GM ends combat mid-scene). This means a trainer who had 2 AP bound in a Stratagem would retain that penalty after the encounter ends until the scene also ends.

**Required fix:** The encounter end endpoint should clear `boundAp: 0` and recalculate `currentAp` for all human combatants with `entityId`, similar to what `deactivate.post.ts` does.

**Ticket:** File as new ticket.

### HIGH — Global new-day does not reset Pokemon daily move usage (ptu-rule-052)

**File:** `app/server/api/game/new-day.post.ts`

The global new-day endpoint uses `prisma.pokemon.updateMany()` to reset `restMinutesToday` and `injuriesHealedToday`, but does NOT reset the `usedToday` / `lastUsedAt` fields inside the Pokemon `moves` JSON column. Since `moves` is a JSON string, it cannot be updated via `updateMany` -- each Pokemon's moves need to be individually parsed, modified, and re-serialized.

After a new day, Pokemon who used daily moves yesterday will have stale `usedToday > 0` and `lastUsedAt` values from the previous day. While `isDailyMoveRefreshable` would return `true` for those moves at the next extended rest (since `lastUsedAt` is yesterday), the `usedToday` counter remains non-zero. This means:
1. The UI would still show daily moves as "used" even after a new day.
2. The extended rest endpoint checks `move.usedToday > 0` as a gate before calling `isDailyMoveRefreshable` -- so moves with `usedToday: 0` are skipped entirely. This is fine in isolation, but the counter should still be reset at new-day for consistency.

The individual `characters/[id]/new-day.post.ts` endpoint has the same gap (it does not touch Pokemon moves), though that is less surprising since it targets the character, not their Pokemon.

**Required fix:** The global new-day endpoint should iterate over all Pokemon, parse their moves JSON, reset `usedToday: 0` and `lastUsedAt: undefined` for all moves, and save back. File as a new ticket since this is outside the direct scope of ptu-rule-052 (which focused on the extended rest rolling window).

**Ticket:** File as new ticket.

### MEDIUM — No input validation on boundAp in PUT endpoint (ptu-rule-053)

**File:** `app/server/api/characters/[id].put.ts` (line 49)

The PUT endpoint accepts `body.boundAp` and passes it directly to Prisma without validation. A caller could pass negative values, non-integer values, or values exceeding `maxAp`. While this is a GM-only endpoint and the existing `drainedAp` and `currentAp` fields have the same lack of validation, the introduction of `boundAp` is a good opportunity to add bounds checking.

At minimum, ensure `boundAp >= 0`. Ideally also ensure `boundAp <= maxAp` (which requires fetching the character's level first, or validating in combination with other AP fields).

**Ticket:** File as new ticket (low priority, applies to all AP fields, not just boundAp).

### MEDIUM — `isDailyMoveRefreshable` uses local timezone via `toDateString()` (ptu-rule-052)

**File:** `app/utils/restHealing.ts` (lines 209-211)

The function compares dates using `toDateString()` which uses the server's local timezone. If the server timezone differs from the GM's intended game timezone, a move used at 11:30 PM server time might be considered "today" or "yesterday" differently than the GM expects.

```typescript
const usedDate = new Date(lastUsedAt)
const today = new Date()
return usedDate.toDateString() !== today.toDateString()
```

This is not a bug in the current single-server deployment (server and GM are co-located), but it is fragile. The existing `shouldResetDailyCounters()` function (line 34) uses the exact same `toDateString()` pattern, so this is a pre-existing design decision that is consistent across the codebase.

**No ticket needed** -- pre-existing pattern, consistent usage. Flag for future if multi-timezone support is ever needed.

### MEDIUM — `calculateSceneEndAp` has misleading docstring (ptu-rule-053)

**File:** `app/utils/restHealing.ts` (lines 236-242)

The docstring states "Bound AP remains off-limits until the binding effect ends" but the function defaults `boundAp` to 0, and all callers pass `boundAp = 0` because they clear it before calling. The docstring describes the PTU rule but not the actual function behavior (which is: calculate AP after all bindings have been released).

This is a documentation clarity issue, not a logic bug. The function is called correctly in both scene endpoints -- they set `boundAp: 0` in the DB update and call `calculateSceneEndAp(level, drainedAp)` with the default `boundAp=0`, which is correct.

**No ticket needed** -- minor docstring improvement, can be done opportunistically.

---

## What Looks Good

### ptu-rule-052: Daily Move Rolling Window

1. **`isDailyMoveRefreshable` is clean and correct.** The null/undefined guard returns `true` (eligible), and the `toDateString()` comparison correctly identifies same-day vs. previous-day usage. The function is pure and easily testable.

2. **Extended rest endpoint correctly implements the rolling window.** The logic at lines 81-103 of `pokemon/[id]/extended-rest.post.ts` properly:
   - Gates on `isDailyMove && move.usedToday > 0` (only checks moves that were actually used)
   - Calls `isDailyMoveRefreshable(move.lastUsedAt)` to determine eligibility
   - Tracks `restoredMoves` and `skippedMoves` arrays for GM visibility in the response
   - Correctly handles non-daily moves separately (unconditional reset)

3. **The `lastUsedAt` field is already wired in `moveFrequency.ts`.** I verified that `app/utils/moveFrequency.ts` line 189 sets `updates.lastUsedAt = new Date().toISOString()` when a daily move is used. The ticket's "Remaining" note about wiring move execution is already resolved.

4. **Unit tests cover the key scenarios.** The 5 `isDailyMoveRefreshable` tests cover: null, undefined, today (same day), yesterday, and several days ago.

### ptu-rule-053: Bound AP Tracking

1. **Schema change is minimal and correct.** `boundAp Int @default(0)` on `HumanCharacter` is the right approach -- additive, backward-compatible, and the default ensures existing records work.

2. **`calculateAvailableAp` formula is correct and defensive.** `Math.max(0, maxAp - boundAp - drainedAp)` prevents negative AP. Simple, pure, well-documented.

3. **Comprehensive lifecycle coverage for clearing.** The developer correctly identified and updated all 6 lifecycle events:
   - Scene deactivation: clears `boundAp: 0`, recalculates `currentAp`
   - Scene activation (other scenes): same treatment
   - Character extended rest: clears both `boundAp: 0` and `drainedAp: 0`
   - Character new-day: clears both
   - Global new-day: clears both (per-character loop for level-based `maxAp`)
   - Character PUT: accepts `boundAp` for GM manual editing

4. **Serialization is complete.** Both `serializeCharacter` and `serializeCharacterSummary` in `serializers.ts` include `boundAp`. The `buildHumanEntityFromRecord` in `combatant.service.ts` also maps it. The TypeScript `HumanCharacter` interface has the field.

5. **Unit tests cover the core formula.** The 5 `calculateAvailableAp` tests cover: no bound/drained, bound only, drained only, both, and overflow (floors at 0).

6. **Library test fixture updated.** `createMockHuman` includes `boundAp: 0`, preventing test failures from missing fields.

---

## New Tickets Filed

### ptu-rule-065: Encounter end should clear boundAp for human combatants

- **Priority:** P1
- **Domain:** combat
- **Summary:** `POST /api/encounters/:id/end` does not clear `boundAp` for human combatants. PTU Core p.59 states Stratagems "automatically unbind when combat ends." The encounter end handler should clear `boundAp: 0` and recalculate `currentAp` for all human combatants with an `entityId`, syncing to the database.
- **Files to change:** `app/server/api/encounters/[id]/end.post.ts`

### ptu-rule-066: Global new-day should reset Pokemon daily move counters

- **Priority:** P2
- **Domain:** healing
- **Summary:** `POST /api/game/new-day` resets Pokemon rest counters but does not reset `usedToday` / `lastUsedAt` inside the `moves` JSON column. After a new day, Pokemon daily moves retain stale usage counters from the previous day. The endpoint should iterate all Pokemon, parse their moves JSON, reset daily move usage fields, and save back.
- **Files to change:** `app/server/api/game/new-day.post.ts`

### bug-029: Add input validation for AP fields in character PUT endpoint

- **Priority:** P3
- **Domain:** api-validation
- **Summary:** `PUT /api/characters/:id` accepts `boundAp`, `drainedAp`, and `currentAp` without validation. Negative values or non-integers could corrupt state. Add `Math.max(0, ...)` clamping at minimum. Ideally validate against `maxAp` derived from character level.
- **Files to change:** `app/server/api/characters/[id].put.ts`

---

## Verdict

**APPROVED_WITH_ISSUES**

Both implementations are correct within their stated scope. The pure utility functions are clean, well-tested, and follow PTU rules accurately. The serialization and lifecycle coverage for `boundAp` is thorough across all identified endpoints.

The HIGH issue (encounter end not clearing boundAp) is a genuine gap but exists in a file outside the scope of the reviewed commits. It is a pre-existing omission exposed by the new `boundAp` field -- now that bound AP is tracked, the encounter end handler needs to clear it. This should be addressed promptly but does not block the current changes from being merged.

The second HIGH issue (global new-day not resetting Pokemon move counters) is a data consistency gap. It does not cause incorrect behavior during extended rest (the rolling window still works correctly), but it leaves stale counters that could confuse UI displays and violates the principle of a new day being a clean slate.

Both reviewed tickets correctly document their "Remaining" work items, and I verified that the `lastUsedAt` move execution wiring mentioned in ptu-rule-052 is already implemented in `moveFrequency.ts`.
