---
review_id: rules-review-155
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-031
domain: player-view
commits_reviewed:
  - 6cfd225
  - bfaa1fb
mechanics_verified:
  - fog-of-war-visibility
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - (none -- design spec compliance, not PTU mechanic)
reviewed_at: 2026-02-26T06:15:00Z
follows_up: null
---

## Mechanics Verified

### Fog-of-War Token Visibility (Design Spec Compliance)

- **Rule:** "Fog: explored cells | Dimmed, terrain visible, no tokens" (`design-player-view-integration-001.md` section 3.5, Information Asymmetry table)
- **Implementation:** `usePlayerGridView.ts` line 90 now filters `visibleTokens` to only include combatants whose cell state is `'revealed'`. Previously, the filter included both `'revealed'` and `'explored'` states, which leaked token positions in explored cells.
- **Status:** CORRECT

**Before (bug):**
```typescript
return state === 'revealed' || state === 'explored'
```

**After (fix):**
```typescript
return state === 'revealed'
```

The fix aligns with the design spec's information asymmetry table, which defines three fog states:
- `hidden` -- Dark/blank (no tokens, no terrain)
- `explored` -- Dimmed, terrain visible, **no tokens**
- `revealed` -- Full visibility (tokens + terrain)

### PTU Rulebook Cross-Check

PTU 1.05 has no fog-of-war mechanic. Searched `books/markdown/core/` (all 12 chapter files) and `books/markdown/errata-2.md` for "fog of war" -- zero matches. The three-state fog system (hidden/revealed/explored) is entirely a custom VTT design decision for this application, not a PTU rule implementation.

Therefore, this review is strictly a **design spec compliance** check, not a PTU rules correctness check. The Game Logic Reviewer has no PTU ruling to make here.

### Scope of Change

The fix is minimal and correctly targeted:
- **1 file changed:** `app/composables/usePlayerGridView.ts`
- **1 condition removed:** `|| state === 'explored'` from the `visibleTokens` filter
- **JSDoc updated:** Removed the TODO comment referencing bug-031 and corrected the description from "explored cells show tokens dimmed" to "Hidden and explored cells hide tokens"
- **Ticket updated:** `bug-031.md` status changed to `in-progress` with resolution log entry

### Edge Case Observation (Non-Blocking)

The `visibleTokens` filter applies uniformly to ALL combatants, including the player's own tokens. If the GM sets a cell containing the player's own trainer/Pokemon to `'explored'` state, the player will not see their own token on the grid.

This is a design gap rather than a bug in this fix -- the design spec (section 3.5) does not explicitly address whether own tokens should always be visible regardless of fog state. The fix correctly implements what the spec says. If this edge case matters, it should be tracked as a separate enhancement (e.g., "own tokens always visible regardless of fog state"), not a change to this bug fix.

Note: The `fogOfWar.ts` store's `isVisible` getter (line 36-39) still returns `true` for both `'revealed'` and `'explored'` states. This is correct -- `isVisible` is used for rendering purposes (terrain, grid cells), not token visibility. The distinction between "cell is visible" (terrain shown) and "tokens are visible" (combatants shown) is intentional per the design spec.

## Summary

The fix correctly resolves the design spec divergence identified in bug-031. The `visibleTokens` computed property now only includes tokens in `'revealed'` fog cells, matching the information asymmetry table in `design-player-view-integration-001.md` section 3.5. No PTU game mechanics are involved -- fog of war is a custom VTT feature with no PTU rulebook equivalent.

## Rulings

No PTU rulings required. This change does not touch any PTU game mechanic (damage, capture, healing, stats, combat stages, evasion, etc.). The fog-of-war visibility system is a custom design decision outside PTU's scope.

## Verdict

**APPROVED** -- The fix correctly implements the design spec's information asymmetry requirements for explored fog cells. No game logic concerns.

## Required Changes

None.
