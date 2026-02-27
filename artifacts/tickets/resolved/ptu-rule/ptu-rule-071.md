---
ticket_id: ptu-rule-071
priority: P2
status: resolved
domain: scenes
source: code-review-081
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/pages/gm/index.vue
---

## Summary

Weather changes skip undo/redo snapshot capture, making weather actions non-undoable.

## Issue

In `handleSetWeather()` (gm/index.vue line ~375), `encounterStore.captureSnapshot()` is not called before `encounterStore.setWeather()`, and `refreshUndoRedoState()` is not called after. Every other encounter action (damage, heal, stages, status, move execution, token movement) follows the snapshot-before-mutation pattern.

## Fix

Add `captureSnapshot('Set Weather')` before the weather change and `refreshUndoRedoState()` after, matching the pattern of all other action handlers.

## Resolution Log

### 2026-02-20 — Fix applied

**Changes to `app/pages/gm/index.vue` — `handleSetWeather()`:**

1. Added descriptive snapshot label: `weather ? 'Set Weather: ${weather}' : 'Cleared Weather'`
2. Added `encounterStore.captureSnapshot(label)` before the `setWeather()` call
3. Added `refreshUndoRedoState()` after the `setWeather()` call

This aligns `handleSetWeather` with the same snapshot-before-mutation pattern used by all other action handlers in `useEncounterActions.ts` (damage, heal, stages, status, move execution, maneuvers, token movement).

**Verified:** No other weather-related mutations exist outside this handler — `setWeather` is only called from `handleSetWeather` in the GM page. The store's `syncEncounterState` method updates weather fields but is a sync receiver (not a user action), so it correctly does not capture snapshots.
