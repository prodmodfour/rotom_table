---
review_id: code-review-174
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-082
domain: vtt
commits_reviewed:
  - 81324fe
  - 670c604
  - 69538ac
  - e432ad0
files_reviewed:
  - app/composables/useTouchInteraction.ts (new)
  - app/composables/useGridInteraction.ts
  - app/composables/useIsometricInteraction.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-26T08:35:00Z
follows_up: null
---

## Review Scope

Refactoring-082 (P4 EXT-DUPLICATE): `useGridInteraction.ts` and `useIsometricInteraction.ts` had duplicated touch handling code (single-finger pan, pinch-to-zoom, tap detection, one-finger-lift-from-pinch transition). The fix extracts a shared `useTouchInteraction.ts` composable (193 lines), and both consumers now delegate to it.

4 commits (1 extraction, 2 consumer replacements, 1 docs update). Line count changes:
- `useGridInteraction.ts`: 765 -> 631 (-134)
- `useIsometricInteraction.ts`: 830 -> 692 (-138) (note: 831 -> 692 = -139 was claimed; actual delta is -138)
- `useTouchInteraction.ts`: 0 -> 193 (new)
- Net: -79 lines removed (deduplication gain)

## Issues

### MEDIUM

**M1: `app-surface.md` not updated with new `useTouchInteraction.ts` composable.**

Line 137 of `app-surface.md` lists all VTT Grid composables but does not include `useTouchInteraction.ts`. New composables should be registered in the surface doc per project convention (checklist item: "If new endpoints/components/routes/stores: was `app-surface.md` updated?"). Add it to the VTT Grid composables list.

## What Looks Good

1. **Clean interface design.** The `UseTouchInteractionOptions` interface is minimal and well-typed: container ref, zoom/pan refs, min/max zoom bounds, render callback, and an `onTap` callback that passes screen coordinates back to the caller for grid-specific coordinate conversion. This correctly separates the "how to pan/zoom" concern from the "what does a tap mean" concern.

2. **Behavioral fidelity verified.** Both consumers wire up `useTouchInteraction` identically:
   - `useGridInteraction`: `onTap` converts screen coords to grid position via `screenToGrid()`, then delegates to `getTokenAtPosition()` for token hit-testing (2D grid).
   - `useIsometricInteraction`: `onTap` converts screen coords to grid position via `screenToGrid()`, but uses `getTokenAtScreenPosition()` for diamond-based isometric hit-testing.
   - Both support the `onTouchTap` override for player mode.

3. **Re-export preserves backward compatibility.** `TOUCH_TAP_THRESHOLD` is re-exported from `useGridInteraction.ts` because `GridCanvas.vue` imports it from there. The comment explaining why is helpful. No broken imports.

4. **State encapsulation.** Touch state refs (`isTouchPanning`, `isPinching`, `lastPinchDistance`, `lastPinchCenter`) are properly scoped inside the composable. Only `isTouchPanning` and `isPinching` are exposed as `readonly()` refs -- good defensive pattern.

5. **Commit granularity is correct.** Extraction in one commit, each consumer replacement in its own commit -- clean and bisectable.

6. **All files remain under 800 lines.** `useGridInteraction.ts` at 631, `useIsometricInteraction.ts` at 692, `useTouchInteraction.ts` at 193.

## Verdict

**APPROVED** -- The extraction is clean, the interface is well-designed, both consumers are correctly wired, and behavioral fidelity is preserved. The `app-surface.md` omission (M1) should be addressed but does not block approval since it is documentation-only and does not affect runtime behavior.

## Required Changes

None blocking. M1 (surface doc update) should be addressed in the next docs commit touching this area.
