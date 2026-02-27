# Rules Review 079

**Ticket:** refactoring-044
**Commits:** 9cc51f5, b7bbf0b
**File:** `app/composables/useCapture.ts`
**Reviewer:** Game Logic Reviewer
**Date:** 2026-02-20

## Scope

Refactoring-044 replaced a silent `console.error` with a reactive `warning` ref when the standard action POST fails after a successful capture attempt. This is purely an error-handling/UX change.

## PTU Mechanics Audit

### Capture Rate Calculation — NOT CHANGED
- `calculateCaptureRateLocal()` is completely untouched (lines 88-217)
- Base 100, level modifier (`-level * 2`), HP thresholds, evolution modifier, status condition bonuses (persistent +10, volatile +5), Poisoned/Badly Poisoned dedup, injury modifier (+5 per injury), Stuck (+10), Slow (+5) -- all correct per PTU Core p.246

### Accuracy Roll — NOT CHANGED
- `rollAccuracyCheck()` is completely untouched (lines 282-289)
- 1d20 roll, AC 6 target -- correct per PTU Core

### Capture Attempt Flow — NOT CHANGED
- `attemptCapture()` API call body is unchanged (pokemonId, trainerId, accuracyRoll, modifiers, pokeBallType)
- Server-side capture logic (`/api/capture/attempt`) is not touched by this commit
- Success/failure flow is identical

### Action Consumption Logic — NOT CHANGED (only error path altered)
- The `if (params.encounterContext)` block still fires on successful capture
- The POST to `/api/encounters/${encounterId}/action` with `actionType: 'standard'` is unchanged
- The only change: the `catch` block now sets `warning.value` instead of calling `console.error`

### Warning Message PTU Accuracy — CORRECT
- Message: "Capture succeeded but standard action was not consumed -- please adjust action economy manually"
- PTU Core p.227 confirms throwing a Poke Ball is a Standard Action
- The composable's own JSDoc (line 221-222) correctly references this rule
- The warning accurately describes the failure scenario: capture is irreversible, but the action economy tracking failed, requiring manual GM adjustment

## Changes Summary

| Line | Change | PTU Impact |
|------|--------|------------|
| 58 | Added `warning` ref declaration | None |
| 237 | Clear `warning` at start of `attemptCapture` | None |
| 264 | Replace `console.error` with `warning.value = ...` | None (error path only) |
| 294 | Expose `warning` as `readonly` in return object | None |

## Verdict

**PASS** -- No PTU game mechanics were altered. The capture rate formula, accuracy roll, action consumption logic, and attempt flow are all identical to pre-commit state. The only change is surfacing an existing error condition to the UI via a reactive ref, which is a pure code quality improvement. The warning message text is PTU-accurate.
