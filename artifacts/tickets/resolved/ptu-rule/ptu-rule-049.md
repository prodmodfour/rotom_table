---
ticket_id: ptu-rule-049
priority: P2
status: resolved
domain: capture
matrix_source:
  rule_ids:
    - capture-R002
    - capture-R003
  audit_file: matrix/capture-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Status condition definitions for capture modifiers have two issues: (1) Badly Poisoned is listed as a separate persistent condition; if both Poisoned and Badly Poisoned are applied, it gives +20 capture bonus instead of +10. (2) Bad Sleep volatile condition is entirely missing from status condition definitions.

## Expected Behavior (PTU Rules)

- Poisoned and Badly Poisoned should not stack for capture bonus purposes — only one applies (+10)
- Bad Sleep is a volatile condition that should exist and grant capture modifier

## Actual Behavior

Both Poisoned and Badly Poisoned can contribute to capture rate. Bad Sleep is not defined.

## Resolution Log

### 2026-02-20: Fix Poisoned/Badly Poisoned stacking (commit 89bdc13)
- Added `hasPoisonBonus` guard in `captureRate.ts` and `useCapture.ts` `calculateCaptureRateLocal`
- When iterating status conditions, Poisoned and Badly Poisoned now share a single +10 bonus slot
- If both are present, only the first encountered contributes +10; the second is skipped
- Files changed: `app/utils/captureRate.ts`, `app/composables/useCapture.ts`

### 2026-02-20: Add Bad Sleep volatile condition (commit 3bb0d3b)
- Added `'Bad Sleep'` to `StatusCondition` type union in `app/types/combat.ts`
- Added `'Bad Sleep'` to `VOLATILE_CONDITIONS` array in `app/constants/statusConditions.ts`
- Added CSS class mapping `'Bad Sleep': 'condition--sleep'` in `getConditionClass`
- Bad Sleep now contributes +5 to capture rate as a volatile condition
- Automatically cleared by encounter end, Take a Breather, and faint (all use `VOLATILE_CONDITIONS`)
- Automatically appears in GMActionModal volatile conditions UI (uses `VOLATILE_CONDITIONS`)
- Validated by `VALID_STATUS_CONDITIONS` in combatant service (uses `ALL_STATUS_CONDITIONS`)
- Files changed: `app/types/combat.ts`, `app/constants/statusConditions.ts`

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
