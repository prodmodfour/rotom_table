---
ticket_id: refactoring-048
priority: P3
status: resolved
category: EXT-DUPLICATE
source: code-review-078
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Capture rate calculation logic is duplicated between `app/utils/captureRate.ts` (server-side) and `app/composables/useCapture.ts` (client-side `calculateCaptureRateLocal`). Both paths maintain identical arithmetic independently.

## Suggested Refactoring

Have `useCapture.ts:calculateCaptureRateLocal` delegate to `captureRate.ts:calculateCaptureRate` instead of reimplementing the formula. The utility is already a pure function usable in both contexts.

## Resolution Log

- **Resolved:** 2026-02-20
- **Changes:**
  - `app/composables/useCapture.ts` — replaced ~90 lines of duplicated capture rate arithmetic in `calculateCaptureRateLocal` with a delegation to `calculateCaptureRate()` from `~/utils/captureRate`. The composable now calls the shared utility and maps the `CaptureRateResult` into the `CaptureRateData` shape (adding `species`, `difficulty` via `getCaptureDescription()`, and rounding `hpPercentage`).
  - Removed unused imports (`PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS` from `~/constants/statusConditions`) — these are now only consumed by the canonical `captureRate.ts`.
  - Added explicit import of `calculateCaptureRate` and `getCaptureDescription` from `~/utils/captureRate`.
- **Verification:** `nuxi typecheck` passes with no errors in capture-related files. All pre-existing type errors are unrelated (encounter store test fixtures).
