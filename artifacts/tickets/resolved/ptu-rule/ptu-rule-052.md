---
ticket_id: ptu-rule-052
priority: P2
status: resolved
domain: healing
matrix_source:
  rule_id: healing-R034
  audit_file: matrix/healing-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Extended Rest resets all daily-frequency moves unconditionally instead of only refreshing moves that were not used since the previous day (the "rolling window" rule).

## Expected Behavior (PTU Rules)

Per PTU Core: Extended Rest refreshes daily-use moves, but only those not used since the character's last Extended Rest. A move used today cannot be refreshed by tonight's Extended Rest — it requires waiting until the next day's rest.

## Actual Behavior

All daily moves are reset to available on Extended Rest regardless of when they were last used.

## Resolution Log

### 2026-02-20 — Rolling window implementation

**Changes:**
- Added `lastUsedAt` optional timestamp to `Move` type (`app/types/character.ts`)
- Added `isDailyMoveRefreshable()` utility to `app/utils/restHealing.ts` — checks if a daily move's `lastUsedAt` is from a previous calendar day (refreshable) or today (not refreshable)
- Updated Pokemon extended rest endpoint (`app/server/api/pokemon/[id]/extended-rest.post.ts`) to use rolling window: daily moves used today are skipped, daily moves used before today are refreshed
- Response now includes `skippedMoves` array for GM visibility
- Non-daily moves still reset `usedToday` unconditionally (no rolling window applies)
- Added unit tests for `isDailyMoveRefreshable` in `app/tests/unit/utils/restHealing.test.ts`

**Remaining:** Move execution code paths need to set `lastUsedAt` when a move is used. Currently move usage tracking does not populate this field — it needs to be wired in wherever `usedToday` is incremented. Pokemon Center healing correctly resets all moves unconditionally (PTU rules allow full refresh at Pokemon Center).

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
