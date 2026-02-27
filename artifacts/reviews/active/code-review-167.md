---
review_id: code-review-167
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ux-004
domain: player-view
commits_reviewed:
  - e3facc8
  - dabee52
  - a9fb82b
  - fd35f50
files_reviewed:
  - app/composables/usePlayerGridView.ts
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/GroupGridCanvas.vue
  - app/components/player/PlayerGridView.vue
  - app/tests/e2e/artifacts/tickets/ux/ux-004.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-26T05:25:00Z
follows_up: null
---

## Review Scope

ux-004 (P3): Wire `getDisplayHp` into VTTToken for player mode HP masking. The ticket requires enemy HP bars in player mode to display rounded 25% increments instead of exact HP percentages, per the design spec's information asymmetry table (Own = full info, Allied = name + exact HP, Enemy = name + HP percentage only).

4 commits across 3 source files and 1 ticket doc. Total delta: +81 lines, -3 lines.

### Commit-by-Commit

1. **e3facc8** (`usePlayerGridView.ts`): Added `roundToDisplayTier()` function and updated `getDisplayHp()` to use it for enemies. Clean, well-documented, correct thresholds.
2. **dabee52** (`VTTToken.vue`): Added `displayHpOverride` prop. When provided, `hpPercent` computed uses it instead of exact HP. Correct clamping to 0-100.
3. **a9fb82b** (`GridCanvas.vue`): Added `roundToDisplayTier()` (duplicated from composable) and `getDisplayHpOverride()`. Wired `:display-hp-override` to VTTToken in template.
4. **fd35f50** (ticket doc): Resolution log with verification notes.

## Issues

### HIGH

**H1: Duplicated `roundToDisplayTier` function -- DRY violation with drift risk**

`roundToDisplayTier` is defined identically in two locations:
- `app/composables/usePlayerGridView.ts` lines 124-132
- `app/components/vtt/GridCanvas.vue` lines 173-181

The GridCanvas copy has a comment "Matches the tiers in usePlayerGridView.roundToDisplayTier" which is a textbook indicator that the code will drift. When someone updates the tier thresholds in the composable, they will not know to update GridCanvas (or vice versa). The comment acknowledges coupling but solves it with documentation instead of code.

**Required fix:** Extract `roundToDisplayTier` to a shared utility (e.g., `app/utils/displayHp.ts`) and import it in both locations. Alternatively, since `GridCanvas` already receives `combatants` and computes HP independently, the function could be imported from the composable module directly. The key is single source of truth.

### MEDIUM

**M1: `getDisplayHp` in composable is not consumed -- dead code path**

The `getDisplayHp` function in `usePlayerGridView.ts` (lines 138-149) is exported in the composable's return value, but `PlayerGridView.vue` does not destructure or use it. The actual HP masking is done entirely in `GridCanvas.vue` via `getDisplayHpOverride`, which reimplements the same logic locally.

This means the composable's `getDisplayHp` function (the original motivation for the ticket) remains unused client-side, and the actual masking logic lives in GridCanvas. There are now two independent implementations of the same business rule: one in the composable that nobody calls, and one in the component that actually drives rendering.

**Required fix:** Either (a) remove `getDisplayHp` from the composable and acknowledge GridCanvas as the sole implementation, or (b) have GridCanvas delegate to the composable's function (passed via prop or called from `usePlayerGridView`). Having two parallel, unused-vs-used implementations is confusing for future developers.

**M2: Ticket resolution log references wrong commit hashes**

The resolution log in `ux-004.md` lists commit hashes `aa0a8fe`, `9363563`, `4d90081` but the actual commits are `e3facc8`, `dabee52`, `a9fb82b`. These appear to be stale hashes from an earlier attempt or rebase. Incorrect commit references in resolution logs make traceability useless.

**Required fix:** Update the resolution log to reference the actual commit hashes.

## What Looks Good

1. **Correct tier design.** The 25%-increment rounding with a 10% "critical" tier is a smart design choice. It prevents the confusing case where an enemy at 1-24% HP would snap to 0% (appearing fainted when they are not). The midpoint thresholds (88, 63, 38, 25) are reasonable rounding breakpoints.

2. **VTTToken prop design.** Using an optional `displayHpOverride` prop is clean and follows the Open/Closed Principle. VTTToken does not need to know about player mode, information asymmetry, or combatant sides. It just receives a number and uses it. The `undefined` check with `!== undefined` correctly distinguishes "not provided" from "provided as 0" (fainted).

3. **No regression on Group View.** Verified: `GroupGridCanvas.vue` does not pass `playerMode` to GridCanvas, so `getDisplayHpOverride()` returns `undefined` for all tokens. Group view continues to show exact HP bars. No side effects.

4. **No regression on IsometricCanvas.** Verified: `IsometricCanvas.vue` does not use `VTTToken` at all, so the new prop has zero impact on isometric rendering.

5. **Correct side classification.** The `getDisplayHpOverride` function in GridCanvas correctly treats `players` and `allies` sides as allied (returning `undefined` for exact HP), and only rounds HP for combatants on the `enemies` side. This matches the information asymmetry table from the design spec.

6. **Defensive clamping in VTTToken.** `Math.max(0, Math.min(100, props.displayHpOverride))` ensures the override percentage is always within valid range, even if a caller passes invalid data. Good defensive programming.

7. **Commit granularity.** Each commit changes exactly one file (except the final docs commit) and has a clear, focused purpose. This is the correct granularity for review and bisect.

## Verdict

**CHANGES_REQUIRED** -- 1 HIGH, 2 MEDIUM issues.

## Required Changes

1. **(H1)** Extract `roundToDisplayTier` to a shared utility file (e.g., `app/utils/displayHp.ts`) and import it in both `usePlayerGridView.ts` and `GridCanvas.vue`. Single source of truth for tier thresholds.

2. **(M1)** Resolve the dual-implementation of HP masking logic. Either remove `getDisplayHp` from the composable (if GridCanvas owns this responsibility) or refactor GridCanvas to delegate to the composable. Two parallel implementations of the same business rule is a maintenance hazard.

3. **(M2)** Fix the commit hashes in the `ux-004.md` resolution log to reference the actual commits (`e3facc8`, `dabee52`, `a9fb82b`).
