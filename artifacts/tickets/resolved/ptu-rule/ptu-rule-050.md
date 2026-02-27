---
ticket_id: ptu-rule-050
priority: P3
status: resolved
domain: capture
matrix_source:
  rule_id: capture-R020
  audit_file: matrix/capture-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

The `pokeBallType` parameter in the capture endpoint is dead code. No ball modifier lookup table exists — the GM must manually calculate ball-specific modifiers and pass them directly.

## Expected Behavior (PTU Rules)

Different Poke Ball types apply specific modifiers to the capture rate (e.g., Great Ball -10, Ultra Ball -15, type-specific balls with conditional bonuses).

## Actual Behavior

The parameter exists but is unused. All ball-specific modifiers must be manually entered by the GM.

## Fix Log

**2026-02-20:** Removed dead `pokeBallType` parameter from two source files:

1. `app/server/api/capture/attempt.post.ts` — Removed `pokeBallType?: string` from `CaptureAttemptRequest` interface. Updated `modifiers` comment to clarify it covers ball modifiers (pre-calculated by GM).
2. `app/composables/useCapture.ts` — Removed `pokeBallType?: string` from `attemptCapture` params and removed it from the API call body.

**Rationale:** The parameter was declared but never consumed by any logic. The existing `modifiers` field already serves this purpose — the GM pre-calculates ball-specific modifiers and passes them as a numeric value. Implementing a full ball modifier lookup table (25 ball types with conditional modifiers like Level Ball, Timer Ball, etc.) would be a feature enhancement, not a dead-code cleanup. The `modifiers` comment was updated to make the intended usage clear.
