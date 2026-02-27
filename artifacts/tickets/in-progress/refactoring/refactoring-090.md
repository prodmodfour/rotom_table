---
ticket_id: refactoring-090
ticket_type: refactoring
priority: P4
status: in-progress
category: CODE-HYGIENE
domain: healing
source: rules-review-173 MED-1
created_by: slave-collector (plan-20260227-174900)
created_at: 2026-02-27T18:10:00
affected_files:
  - app/server/services/rest-healing.service.ts
---

## Summary

The `refreshDailyMoves()` function only processes daily-frequency moves. Non-daily moves with `usedToday > 0` are returned unchanged. The previous inline code in the Pokemon extended-rest endpoint used to reset `usedToday` on non-daily moves too, but that field is unused for non-daily frequency enforcement (`moveFrequency.ts` uses `lastTurnUsed`, `usedThisScene`, etc.).

## Current Behavior

After extended rest, non-daily moves may retain stale `usedToday` values. These values have no functional effect but are untidy data.

## Suggested Fix

Optionally reset `usedToday: 0` on all moves (not just daily) during extended rest, for data cleanliness. This is cosmetic — no gameplay impact.

## Impact

No gameplay impact. Cosmetic data hygiene only.

## Resolution Log

- **Commit:** `87f9f64` — refactor: reset usedToday on all moves during extended rest
- **Files changed:**
  - `app/server/services/rest-healing.service.ts` — added non-daily move `usedToday` clearing with `cleanedNonDaily` counter; updated write-back condition in `refreshDailyMovesForOwnedPokemon`
  - `app/tests/unit/services/restHealing.service.test.ts` — added test for non-daily cleaning, updated existing test assertions
