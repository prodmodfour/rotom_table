# 2026-03-27 — Pre-Implementation Documentation: Findings 138–140

Phase 3 complete. Wrote three convention notes identified in post 55 (adversarial plan review).

## Notes written

### 1. `status-application-must-use-applyStatus.md`

Convention: all status condition application in effect handlers must go through the `applyStatus` utility. Documents the three invariants it centralizes (type immunity, auto-CS, event emission) and shows the correct vs incorrect patterns. Cites finding 140 as the motivating example. References: [[effect-utility-catalog]], [[effect-handler-contract]], [[type-grants-status-immunity]], [[shotgun-surgery-smell]], [[duplicate-code-smell]], [[single-responsibility-principle]].

### 2. `trigger-event-field-semantics.md`

Reference: what each TriggerEvent field means per event type. The `amount` field carries different values depending on `type` — damage value on `damage-dealt`, roll value on `accuracy-check`. Documents all base fields and transient fields with their "populated on" event types. Includes the new `accuracyRoll` field that will be added in Phase 4. Cites finding 139 as the motivating example. References: [[combat-event-log-schema]], [[effect-handler-contract]], [[effect-trigger-event-bus]], [[inappropriate-intimacy-smell]].

### 3. `utility-self-targeting-convention.md`

Convention: in utility functions accepting `target?: 'self' | EntityId`, the values `'self'` and `undefined` are semantically equivalent. Both ID resolution and lens resolution must agree — the critical invariant. Documents the bug pattern (ID resolves to user but lens resolves to opponent via `resolveTargetLens` fallback) and the fix pattern (extract `isSelfTarget` boolean). Notes the underlying [[primitive-obsession-smell]] as a future refactoring target. Cites findings 120, 135, 138 as the recurrence pattern. References: [[effect-utility-catalog]], [[primitive-obsession-smell]], [[combat-lens-sub-interfaces]].

## Backlinks added

- `effect-utility-catalog.md` — added links to `status-application-must-use-applyStatus` and `utility-self-targeting-convention`
- `effect-handler-contract.md` — added links to `trigger-event-field-semantics` and `status-application-must-use-applyStatus`

## Status

Phase 3 complete. Ready for Phase 4 (implementation per approved plan in post 54).
