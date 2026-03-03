---
ticket_id: ptu-rule-131
category: PTU-INCORRECT
severity: MEDIUM
priority: P3
domain: capture
status: in-progress
title: "Poke Ball accuracy check should use central calculateAccuracyThreshold utility"
source: code-review-281 M2
created_by: slave-collector (plan-20260302-150500)
created_at: 2026-03-02
blocked_by: null
unblocked_by: decree-042
---

## Summary

`rollAccuracyCheck()` in `app/composables/useCapture.ts` reimplements its own d20 accuracy logic with a hardcoded `roll >= 6` check. The codebase already has a central accuracy system: `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion)` in `utils/damageCalculation.ts`, used by `useMoveCalculation.ts` for all move accuracy rolls.

The Poke Ball check should call `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` instead of hardcoding the threshold, so it stays consistent with the move system and automatically picks up any future modifier changes.

## Context

This is a pre-existing gap identified during the bug-043 review (AC 6 enforcement fix). The bug-043 fix correctly scoped to just enforcing the AC 6 threshold. Unifying with the central utility is a separate concern.

**decree-042 resolved:** Poke Ball throws use the full accuracy system — thrower's accuracy stages, target's Speed Evasion, flanking penalties, and rough terrain modifiers all apply. This means the full utility integration is required with real modifier values, not zeros.

## Current State (two separate systems)

1. **Moves** (`useMoveCalculation.ts:407`): Rolls 1d20, computes threshold via `calculateAccuracyThreshold(moveAC, accuracyStage, evasion)`, applies flanking penalty, rough terrain penalty. Per-target comparison.
2. **Poke Ball** (`useCapture.ts:234`): Rolls its own 1d20, hardcodes `roll >= 6`, ignores all modifiers.

## PTU Reference

- PTU p.236: "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- PTU p.214: Poke Ball throws are "AC6 Status Attack Roll"
- PTU ch9 p.271: "Resolve the attack like you would any other."
- PTU ch9 p.1810 (Snag Machine): "-2 penalty on all Poke Ball attack rolls" — confirms Poke Ball throws are modifiable attack rolls
- **decree-042**: Full accuracy system applies (accuracy stages, Speed Evasion, flanking, terrain)

## Affected Files

- `app/composables/useCapture.ts` — `rollAccuracyCheck()` → refactor to use `calculateAccuracyThreshold()`
- `app/server/api/capture/attempt.post.ts` — server-side validation must mirror the same threshold logic

## Suggested Fix

1. Refactor `rollAccuracyCheck()` to call `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` with real modifier values
2. Pass thrower's accuracy combat stages and target's Speed Evasion into the capture flow
3. Apply flanking and rough terrain penalties consistent with the move accuracy system
4. Update server-side validation in `capture/attempt.post.ts` to mirror the same threshold calculation

## Impact

Low gameplay impact — modifiers only matter in edge cases with extreme combat stage shifts. High code health impact — eliminates a duplicated accuracy system and ensures consistency.

## Resolution Log

### Commits

| Hash | Description | Files |
|------|-------------|-------|
| `feb43aac` | refactor: replace hardcoded AC 6 check with calculateAccuracyThreshold in useCapture | `app/composables/useCapture.ts` |
| `a6da1c6e` | feat: pass accuracy params through CapturePanel and show dynamic threshold | `app/components/capture/CapturePanel.vue` |
| `b7e070a1` | feat: compute and pass accuracy params from encounter combatant data | `app/components/encounter/CombatantCaptureSection.vue` |
| `28ec7da9` | feat: pass accuracy params in player capture request handler | `app/composables/usePlayerRequestHandlers.ts` |
| `62b8f57e` | feat: server-side accuracy validation uses client-computed threshold | `app/server/api/capture/attempt.post.ts`, `app/composables/useCapture.ts`, `app/components/capture/CapturePanel.vue`, `app/composables/usePlayerRequestHandlers.ts` |
| `ac95e811` | fix: update hardcoded AC 6 references in UI text and tests | `app/components/player/PlayerCapturePanel.vue`, `app/tests/unit/api/captureAttempt.test.ts` |

### Changes Made

1. **useCapture.ts**: `rollAccuracyCheck()` now accepts `CaptureAccuracyParams` (throwerAccuracyStage, targetSpeedEvasion, flankingPenalty, roughTerrainPenalty) and delegates to `calculateAccuracyThreshold(6, ...)` from `damageCalculation.ts`. Returns `threshold` instead of `total`.
2. **CapturePanel.vue**: Accepts `accuracyParams` prop, passes to `rollAccuracyCheck`. Template shows dynamic threshold instead of hardcoded "AC 6". Passes threshold to server via `attemptCapture`.
3. **CombatantCaptureSection.vue**: Computes `CaptureAccuracyParams` from encounter combatant data — trainer accuracy CS from `getStageModifiers`, target Speed Evasion from combatant record.
4. **usePlayerRequestHandlers.ts**: `handleApproveCapture` computes accuracy params from trainer/Pokemon combatants before calling `rollAccuracyCheck`.
5. **capture/attempt.post.ts**: Server accepts `accuracyThreshold` parameter (defaults to 6 for backwards compat), validates roll against it.
6. **PlayerCapturePanel.vue**: Updated label from "AC 6 accuracy check" to "accuracy check".
7. **captureAttempt.test.ts**: Updated test descriptions/expectations, added two new tests for custom threshold validation.
