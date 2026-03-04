---
review_id: rules-review-196
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-038
domain: healing
commits_reviewed:
  - 3d6a238
  - 80b5d9b
  - e4178d6
mechanics_verified:
  - currentAp-clamping-safety-guard
  - per-character-new-day-decree-compliance
  - extended-rest-decree-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/06-playing-the-game.md#Action-Points-(p221)
  - core/07-combat.md#Resting-(p252)
reviewed_at: 2026-02-28T13:25:00Z
follows_up: rules-review-192
---

## Scope

Re-review of bug-038 fix cycle changes. The previous rules-review-192 APPROVED the original bug-038 fix (boundAp preservation). This review covers the three additional commits addressing code-review-216 feedback: `Math.max(0, ...)` clamping and per-character new-day unit tests.

The original rules-review-192 already verified the core mechanics (boundAp preservation, currentAp formula, drainedAp reset, encounter-end clearing, scene-end clearing). This review focuses only on whether the fix cycle changes maintain that correctness.

## Mechanics Verified

### 1. currentAp Clamping Safety Guard (3d6a238)

- **Rule:** Action Points cannot be negative. PTU p.221 describes AP as a pool resource with a maximum; spending AP reduces it toward zero, not below. There is no PTU mechanic that produces negative AP.
- **Change:** All three endpoints now use `Math.max(0, calculateMaxAp(level) - boundAp)` instead of `calculateMaxAp(level) - boundAp`.
- **Analysis:** If `boundAp` exceeds `maxAp` (an edge case that should not occur in normal play but could arise from manual DB edits or future code bugs), the unclamped formula would produce a negative `currentAp`. Negative AP has no meaning in PTU and would be a data integrity error. The `Math.max(0, ...)` clamp ensures `currentAp` is never negative. This matches the existing pattern in `calculateAvailableAp()` at `restHealing.ts:233`.
- **Status:** CORRECT. Defensive clamping does not change behavior for any valid game state (where `boundAp <= maxAp`) and prevents invalid data for edge cases.

### 2. Per-Character New-Day Decree Compliance (80b5d9b)

- **Decrees:** decree-016, decree-019, decree-028.
- **Change:** New test file `character-new-day.test.ts` verifies decree compliance for the per-character endpoint. No production code changed.
- **Test correctness:**
  - "does NOT clear boundAp on new day" -- asserts `updateCall.data` lacks `boundAp` property. This correctly validates decree-016 (bound AP persists).
  - "calculates currentAp as maxAp minus existing boundAp" -- uses level 10, boundAp 2, expects currentAp 5 (maxAp 7 - 2). Formula matches PTU p.221 AP pool rules.
  - "clamps currentAp to zero when boundAp exceeds maxAp" -- level 1 (maxAp 5), boundAp 8, expects 0. Validates the Math.max guard.
  - "clears drainedAp to zero" -- validates decree-019 (drainedAp is a daily counter).
  - "resets restMinutesToday and injuriesHealedToday" -- validates decree-019 daily counter reset.
- **Status:** CORRECT. Tests validate the right PTU invariants and decree requirements. No PTU rule violations introduced.

### 3. Extended-Rest Clamping (3d6a238)

- **Rule:** Same as section 1. AP cannot be negative.
- **Decree:** decree-016 -- extended rest clears drained AP but NOT bound AP.
- **Change:** `extended-rest.post.ts:97` changed from `maxAp - character.boundAp` to `Math.max(0, maxAp - character.boundAp)`.
- **Analysis:** The extended-rest endpoint was already correctly preserving `boundAp` (verified in rules-review-192). The only change is adding the zero clamp, which is a pure safety guard. The comment "Bound AP remains off-limits (decree-016)" is preserved.
- **Status:** CORRECT. No change to decree compliance; purely defensive.

## Summary

The fix cycle changes are mechanically inert for valid game states -- they only add a floor clamp that activates when `boundAp > maxAp`, which cannot happen during normal PTU play. The per-character new-day tests correctly validate decree-016, decree-019, and decree-028 compliance. No new PTU mechanics were introduced or modified.

## Verdict

**APPROVED** -- no PTU rule issues. All three applicable decrees (016, 019, 028) remain correctly implemented. The `Math.max(0, ...)` clamp is consistent with PTU's non-negative AP invariant.

## Required Changes

None.
