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
| `784004b5` | refactor: replace hardcoded AC 6 check with calculateAccuracyThreshold in useCapture | `app/composables/useCapture.ts` |
| `67718020` | feat: pass accuracy params through CapturePanel and show dynamic threshold | `app/components/capture/CapturePanel.vue` |
| `656a2042` | feat: compute and pass accuracy params from encounter combatant data | `app/components/encounter/CombatantCaptureSection.vue` |
| `23ae58af` | feat: pass accuracy params in player capture request handler | `app/composables/usePlayerRequestHandlers.ts` |
| `557b3164` | feat: server-side accuracy validation uses client-computed threshold | `app/server/api/capture/attempt.post.ts`, `app/composables/useCapture.ts`, `app/components/capture/CapturePanel.vue`, `app/composables/usePlayerRequestHandlers.ts` |
| `430857a3` | fix: update hardcoded AC 6 references in UI text and tests | `app/components/player/PlayerCapturePanel.vue`, `app/tests/unit/api/captureAttempt.test.ts` |
| `c9a8e3b4` | fix: eliminate double Math.max(1,...) clamping in Poke Ball accuracy threshold | `app/composables/useCapture.ts` |
| `f620d391` | docs: correct misleading claim that useMoveCalculation uses calculateAccuracyThreshold | `.claude/skills/references/app-surface.md` |
| `cba0dd2d` | docs: add server trust rationale comment for client-provided accuracyThreshold | `app/server/api/capture/attempt.post.ts` |
| `8e5d7212` | docs: clarify targetSpeedEvasion is total evasion, capped at 9 internally | `app/composables/useCapture.ts` |

### Changes Made

1. **useCapture.ts**: `rollAccuracyCheck()` now accepts `CaptureAccuracyParams` (throwerAccuracyStage, targetSpeedEvasion, flankingPenalty, roughTerrainPenalty) and computes the threshold inline as a single expression matching `useMoveCalculation.ts:416`. Returns `threshold` instead of `total`.
2. **CapturePanel.vue**: Accepts `accuracyParams` prop, passes to `rollAccuracyCheck`. Template shows dynamic threshold instead of hardcoded "AC 6". Passes threshold to server via `attemptCapture`.
3. **CombatantCaptureSection.vue**: Computes `CaptureAccuracyParams` from encounter combatant data — trainer accuracy CS from `getStageModifiers`, target Speed Evasion from combatant record.
4. **usePlayerRequestHandlers.ts**: `handleApproveCapture` computes accuracy params from trainer/Pokemon combatants before calling `rollAccuracyCheck`.
5. **capture/attempt.post.ts**: Server accepts `accuracyThreshold` parameter (defaults to 6 for backwards compat), validates roll against it. Includes rationale comment explaining why client-provided threshold is trusted.
6. **PlayerCapturePanel.vue**: Updated label from "AC 6 accuracy check" to "accuracy check".
7. **captureAttempt.test.ts**: Updated test descriptions/expectations, added two new tests for custom threshold validation.

### Fix Cycle (code-review-312 + rules-review-285)

8. **useCapture.ts** (C1/HIGH-1): Eliminated double `Math.max(1,...)` clamping — replaced `calculateAccuracyThreshold` call + second clamp with single-expression formula `Math.max(1, 6 + Math.min(9, speedEvasion) - accuracyStage - flankingPenalty + roughTerrainPenalty)`. Removed unused `calculateAccuracyThreshold` import.
9. **app-surface.md** (H1): Corrected misleading claim that `useMoveCalculation.ts` uses `calculateAccuracyThreshold` — it uses an inline formula.
10. **attempt.post.ts** (M1): Added documentation comment explaining why server trusts client-provided `accuracyThreshold`.
11. **useCapture.ts** (MED-1): Clarified `targetSpeedEvasion` doc comment to indicate it accepts total Speed Evasion (stat-derived + bonus; capped at 9 internally).
