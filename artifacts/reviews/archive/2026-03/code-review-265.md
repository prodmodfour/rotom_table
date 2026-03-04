---
review_id: code-review-265
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-019
domain: vtt-grid
commits_reviewed:
  - 314f9780
  - 80c475f9
  - 9266dbe6
  - 2fc862fe
files_reviewed:
  - app/composables/useGridMovement.ts
  - app/tests/unit/composables/useGridMovement.test.ts
  - artifacts/matrix/vtt-grid/audit/tier-6-partial-items.md
  - artifacts/tickets/open/feature/feature-019.md
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T23:10:00Z
follows_up: null
---

## Review Scope

Feature-019: VTT Status-Movement Integration. 4 commits by slave-2. Three matrix rules:

- **R022 (Stuck)**: Developer claims already implemented. Verified.
- **R024 (Slowed)**: Developer claims already implemented. Verified.
- **R025 (Tripped)**: Newly implemented across 2 commits (feat + fix).

Files changed: 2 source files (composable + test file), 2 doc files (audit + ticket), 1 reference file (app-surface).

## Decree Compliance

- **decree-003** (tokens passable, enemy = rough terrain): Not affected by this change. Movement modifiers are orthogonal to pathfinding through occupied squares. No conflict.
- **decree-010** (multi-tag terrain): Not affected. Tripped blocks movement entirely regardless of terrain. No conflict.
- **decree-011** (average speeds across terrain boundaries): Tripped returns 0 before any terrain averaging happens (early-return in `applyMovementModifiers`). The averaging functions (`getAveragedSpeedForPath`, `buildSpeedAveragingFn`) call `applyMovementModifiers` after computing the averaged base, so Tripped correctly overrides the result. No conflict.

## PTU Rules Verification

### R025 Tripped (PTU 1.05 p.251 / Chapter 7 Status Conditions)

PTU text: "A Pokemon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions."

**Developer interpretation**: Since the Shift Action IS movement in PTU, a Tripped combatant cannot move on the grid. The GM removes Tripped via the status system when the combatant stands up.

**Verification**: This interpretation is correct. In PTU, the Shift Action is your movement phase. While Tripped, you must spend your entire Shift Action standing up -- leaving no movement capacity. Returning speed 0 is the correct mechanical encoding. The GM workflow is: (1) combatant is Tripped, (2) grid shows 0 movement, (3) GM removes Tripped status when the combatant uses their Shift to stand, (4) no further movement occurs that turn since the Shift is consumed.

**Edge case noted**: The "Kip Up" feature (PTU p.146, Expert Acrobatics) allows standing up as a Swift Action instead of a Shift Action, preserving the Shift for movement. This is not currently modeled in the VTT but is a GM-adjudicated feature, not a system mechanical rule. The GM would remove Tripped manually and the combatant could then move normally. No code change needed.

### R022 Stuck (PTU 1.05 p.231)

PTU text: "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."

**Verified**: `applyMovementModifiers` returns 0 immediately for `conditions.includes('Stuck')`. Correct.

### R024 Slowed (PTU 1.05 p.231)

PTU text: "Slowed means your movement is halved."

**Verified**: `modifiedSpeed = Math.floor(modifiedSpeed / 2)` applied after Stuck/Tripped checks. Correct.

### Stuck vs Tripped tempConditions Asymmetry

The developer checked `tempConditions` for Tripped but not for Stuck. I verified this is correct:
- **Stuck** is only ever applied via `statusConditions` (Trip maneuver, status endpoint). No code path adds Stuck to `tempConditions`.
- **Tripped** can come from `statusConditions` (Trip maneuver, Blindness) OR `tempConditions` (Take a Breather -- `breather.post.ts` lines 152-163 add Tripped to `tempConditions`).

The asymmetric handling is intentional and correct.

## Code Quality Analysis

### Commit 1: `314f9780` (feat: block VTT movement for Tripped)

- Follows the exact same early-return pattern as Stuck (line 106-108 vs 118-120). Consistent.
- Placed after Stuck and before Slowed in the modifier chain. Order is correct: Stuck > Tripped > Slowed > Speed CS > Sprint. Both Stuck and Tripped short-circuit to 0 before any other modifier can inflate the speed.
- JSDoc updated in 3 locations to include Tripped alongside Stuck and Slowed. Thorough.
- 6 test cases covering: Tripped alone, various base speeds, Speed CS override, Sprint override, Stuck+Tripped combo, Tripped+Slowed combo. Good coverage of interaction matrix.

### Commit 2: `80c475f9` (fix: also check tempConditions)

- Correctly identifies that Tripped can arrive via two channels (statusConditions and tempConditions).
- Uses `||` operator: `conditions.includes('Tripped') || tempConditions.includes('Tripped')`. Correct -- either source should block movement.
- Comment explains both sources with concrete examples (Trip maneuver, Take a Breather). Helpful for future maintainers.
- 2 additional tests: tempCondition-only Tripped, and dual-source (both status and temp). Edge cases covered.

### Commit 3: `9266dbe6` (docs: update R025 audit)

- Reclassifies R025 from "Approximation" to "Correct". Accurate.
- Updated actual behavior description includes both `conditions.includes('Tripped')` and `tempConditions.includes('Tripped')`. Comprehensive.
- Mentions AoO `stand_up` trigger type already existing. Verified this claim -- the AoO system does have this trigger.

### Commit 4: `2fc862fe` (docs: update feature-019 ticket + app-surface)

- Ticket status changed from `open` to `in-progress`. Correct for this stage.
- Resolution log documents R022/R024 as pre-existing with commit references. Good provenance tracking.
- R025 resolution log includes both commits with descriptions. Clear.
- `app-surface.md` updated with detailed description of `useGridMovement.ts` status-movement integration (Stuck/Tripped block, Slowed halves, Speed CS additive, Sprint +50%). Thorough.

### Isometric Grid Compatibility

Verified that the isometric grid (`IsometricCanvas.vue`, `useIsometricInteraction.ts`) uses `movement.getSpeed()` and `movement.getMaxPossibleSpeed()` from the same `useGridMovement` composable. The Tripped check flows through correctly for both 2D and isometric rendering modes.

### File Size

`useGridMovement.ts` is 691 lines. Within the 800-line limit.

### Test Coverage

8 new tests added (6 in commit 1, 2 in commit 2), bringing total `applyMovementModifiers` test count to 46. Tests cover:
- Tripped alone (multiple base speeds)
- Tripped vs Speed CS +6
- Tripped vs Sprint
- Stuck + Tripped combo
- Tripped + Slowed combo
- Tripped as tempCondition only
- Tripped as both statusCondition and tempCondition

No missing edge cases identified. The developer correctly recognized that Tripped is a total block (speed 0), so testing varying base speeds confirms the early-return behavior.

### Immutability

No mutation issues. `applyMovementModifiers` is a pure function that creates a local `modifiedSpeed` variable and returns a value. No combatant state is modified.

## What Looks Good

1. **Correct PTU interpretation**: Tripped = speed 0 is the mechanically faithful reading of "must spend Shift Action to stand up." The developer's reasoning is well-documented in both code comments and commit messages.

2. **Consistent pattern**: The Tripped check mirrors the Stuck pattern exactly -- early-return of 0 before any downstream modifiers. This makes the code predictable and easy to extend for future movement-blocking conditions.

3. **tempConditions handling**: The developer proactively identified that Tripped can arrive from Take a Breather (as a tempCondition) and added the check in a separate commit with separate tests. Good separation of concerns in commit granularity.

4. **Cross-mode verification**: Both 2D and isometric grids flow through the same `applyMovementModifiers` function via `getSpeed()`/`getMaxPossibleSpeed()`. No separate code path to maintain.

5. **Thorough documentation**: All JSDoc comments, audit entries, ticket resolution logs, and app-surface references were updated. No loose ends.

6. **Pre-existing R022/R024 verification**: The developer correctly identified that Stuck and Slowed were already implemented before this ticket was filed, avoiding redundant work. The resolution log documents this with commit references.

## Verdict

**APPROVED**

All three matrix rules (R022, R024, R025) are correctly handled. The new Tripped implementation follows PTU rules faithfully, matches the existing Stuck pattern, handles both `statusConditions` and `tempConditions` sources, and is thoroughly tested with 8 new test cases. No decree violations. No regressions in existing movement logic. Documentation is comprehensive.

## Required Changes

None.
