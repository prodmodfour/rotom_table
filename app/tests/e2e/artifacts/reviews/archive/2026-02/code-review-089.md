---
review_id: code-review-089
ticket: refactoring-044
commits: [9cc51f5, b7bbf0b]
status: approved
date: 2026-02-20
---

# Code Review 089: refactoring-044 — Surface capture action consumption error

## Scope

Reviewed the addition of a `warning` ref to `useCapture()` composable that surfaces a user-visible message when the standard action POST fails after a successful capture, replacing a silent `console.error`.

## Files Reviewed

- `app/composables/useCapture.ts` (full file, 300 lines)
- `app/components/encounter/CombatantCard.vue` (only consumer of `useCapture()`)

## Checklist

| Check | Result |
|---|---|
| `warning` ref declared | Yes (line 58) |
| `warning` exposed as `readonly` | Yes (line 294) |
| `warning` cleared at start of `attemptCapture` | Yes (line 237) |
| `console.error` removed | Yes, fully removed — no `console.error/warn/log` remains in file |
| Immutability | Correct — uses `ref.value =` assignment, exposed via `readonly()` |
| No behavioral changes beyond scope | Correct — only the error handling path changed |
| Ticket Resolution Log updated | Yes |
| Ticket status set to resolved | Yes |

## Analysis

### Composable Change (9cc51f5)

The implementation is clean and minimal:

1. **New `warning` ref** at line 58, typed `<string | null>`, initialized to `null`.
2. **Cleared at `attemptCapture` entry** (line 237) alongside `error.value = null` -- correct placement.
3. **Set on action consumption failure** (line 264) with a clear, actionable message telling the GM what happened and what to do.
4. **Exposed as `readonly`** (line 294) -- matches the pattern used by `loading` and `error`.
5. **`console.error` fully removed** -- no logging statements remain in the file.

The `warning` is intentionally NOT cleared in `getCaptureRate()` or `calculateCaptureRateLocal()`, which is correct: those functions never set warnings, and `getCaptureRate` is a separate operation that should not silently dismiss a capture warning the GM hasn't seen yet.

### Consumer Analysis

Only one component consumes `useCapture()`: `CombatantCard.vue`. It destructures only `calculateCaptureRateLocal` (a pure synchronous function) and never calls `attemptCapture`. The `warning` ref is irrelevant to this consumer.

No Vue component currently calls `attemptCapture` -- only E2E test helpers do. This means the `warning` ref is currently "plumbed but not displayed." This is acceptable because:

- The composable's contract is now correct (errors surfaced, not swallowed)
- When a capture UI is built that calls `attemptCapture`, the `warning` ref is already available for display
- The ticket scope was specifically about the composable-level fix, not building UI for it

### No Test Coverage

There are no unit tests for `useCapture.ts` at all (no files in `tests/unit/` matching capture). The warning ref is untested. However, this is a pre-existing gap, not introduced by this change. The ticket scope was a composable-level refactoring to stop swallowing errors, and the fix is minimal enough that the risk is low.

## Verdict

**APPROVED.** The fix is correct, minimal, follows project patterns (readonly ref, clear-on-entry), and removes the silent error swallowing as specified in the ticket. No issues found.
