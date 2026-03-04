---
review_id: rules-review-241
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-019
domain: vtt-grid
commits_reviewed:
  - 314f9780
  - 80c475f9
  - 9266dbe6
  - 2fc862fe
mechanics_verified:
  - Tripped (movement block)
  - Stuck (movement block)
  - Slowed (half movement)
  - Speed CS movement modifier
  - Sprint movement modifier
  - Condition interaction priority
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 231
  - core/07-combat.md#Page 234
  - core/07-combat.md#Page 248
  - core/07-combat.md#Page 251
reviewed_at: 2026-03-01T22:50:00Z
follows_up: null
---

## Mechanics Verified

### Tripped (R025) -- NEW Implementation
- **Rule:** "Tripped: A Pokemon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions." (`core/07-combat.md#Page 251`)
- **Implementation:** `applyMovementModifiers()` in `app/composables/useGridMovement.ts:110-119` checks both `conditions.includes('Tripped')` and `tempConditions.includes('Tripped')`, returning 0 (zero speed) as an early-return before Slowed/Speed CS/Sprint modifiers. This prevents any grid movement for Tripped combatants. The GM removes Tripped via the status system when the combatant uses their Shift Action to stand up.
- **Status:** CORRECT

**Reasoning:** PTU states the combatant "needs to spend a Shift Action getting up before they can take further actions." Since the Shift Action IS the movement action in PTU combat, a Tripped combatant's entire Shift is consumed by standing up -- they cannot also move. Returning speed 0 is the correct VTT enforcement. The stand-up AoO trigger (`stand_up` in `app/constants/aooTriggers.ts:33-36`) is already implemented separately, so when the GM clears Tripped, the AoO detection system fires correctly per PTU p.241: "An adjacent foe stands up."

**tempConditions check (commit 80c475f9):** This is correct and necessary. Take a Breather (PTU p.245) explicitly says "They then become Tripped" -- this Tripped condition is applied as a `tempCondition` (cleared at next turn start), not as a persistent `statusCondition`. Without checking `tempConditions`, a combatant who just Took a Breather could still move on the grid, violating the rule. The Trip maneuver and Blindness-induced Tripped come through `statusConditions`, so both sources are covered.

### Stuck (R022) -- Pre-existing, Verified
- **Rule:** "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features." (`core/07-combat.md#Page 231`); "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move and cannot apply their Speed Evasion to attacks." (`core/07-combat.md#Page 248`)
- **Implementation:** `applyMovementModifiers()` in `app/composables/useGridMovement.ts:104-108` checks `conditions.includes('Stuck')` and returns 0 as an early-return. Stuck is only checked in `statusConditions` (not `tempConditions`).
- **Status:** CORRECT

**Note on Stuck not checking tempConditions:** Stuck is never applied as a tempCondition in the codebase. Take a Breather *cures* Stuck (PTU p.245: "cured of all Volatile Status effects and the Slow and Stuck conditions") but does not *apply* it. No other mechanic generates Stuck as a tempCondition. The asymmetry with Tripped (which checks both) is correct.

### Slowed (R024) -- Pre-existing, Verified
- **Rule:** "Slowed: A Pokemon that is Slowed has its Movement halved (minimum 1)." (`core/07-combat.md#Page 248`)
- **Implementation:** `applyMovementModifiers()` in `app/composables/useGridMovement.ts:122-125` applies `Math.floor(modifiedSpeed / 2)`. The minimum 1 is enforced by the final return line: `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` (line 149).
- **Status:** CORRECT

**Rounding:** PTU says "halved (minimum 1)" with no explicit rounding rule. `Math.floor` (round down) is the standard convention for PTU fractional values and is the correct choice.

### Speed Combat Stage Modifier -- Pre-existing, Verified
- **Rule:** "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down" (`core/07-combat.md#Page 234`)
- **Implementation:** `app/composables/useGridMovement.ts:132-141` -- clamps to [-6, +6], applies `Math.trunc(clamped / 2)` as additive modifier, enforces minimum 2 floor when negative CS is applied.
- **Status:** CORRECT

**Math.trunc vs Math.floor:** `Math.trunc(-5/2) = -2` and `Math.floor(-5/2) = -3`. The code uses `Math.trunc` which produces symmetric results: CS +5 gives +2, CS -5 gives -2. The PTU text says "rounded down" for the absolute value calculation, and the comment notes this is intentional for symmetric positive/negative results. This is a reasonable interpretation since PTU says "reduces movement equally" for negative stages.

### Sprint Maneuver -- Pre-existing, Verified
- **Rule:** "Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md#Sprint Maneuver`)
- **Implementation:** `app/composables/useGridMovement.ts:143-146` checks `tempConditions.includes('Sprint')` and applies `Math.floor(modifiedSpeed * 1.5)`.
- **Status:** CORRECT

### Condition Interaction Priority
- **Implementation order in `applyMovementModifiers()`:**
  1. Stuck check (early-return 0)
  2. Tripped check (early-return 0)
  3. Slowed (halve)
  4. Speed CS (additive)
  5. Sprint (+50%)
  6. Minimum floor (1 if base > 0, else 0)
- **Status:** CORRECT

**Reasoning:** Stuck and Tripped are absolute blocks -- no modifier should override them (tests verify Sprint and Speed CS +6 cannot override). Slowed halving before Speed CS additive bonus is correct because the CS bonus is an independent modifier on top of the halved speed. Sprint applies last because it multiplies the fully-modified speed.

## Decree Compliance

- **decree-003:** Not directly affected by this change. Movement blocking/passability is unchanged.
- **decree-010:** Not directly affected. Multi-tag terrain is independent of status-movement integration.
- **decree-011:** Speed averaging correctly calls `applyMovementModifiers` after averaging (line 290), so Stuck/Tripped/Slowed modifiers are applied on top of averaged speeds. Correct.

## Test Coverage Assessment

**8 new test cases for Tripped (commit 314f9780 + 80c475f9):**
1. Basic Tripped returns 0 -- GOOD
2. Tripped returns 0 regardless of base speed (1, 10, 100) -- GOOD
3. Tripped overrides Speed CS +6 -- GOOD
4. Tripped overrides Sprint -- GOOD
5. Stuck + Tripped both block -- GOOD
6. Tripped + Slowed: Tripped wins -- GOOD
7. Tripped as tempCondition (Take a Breather) blocks -- GOOD
8. Tripped as both status and temp condition blocks -- GOOD

**Pre-existing test coverage (38 tests, verified all pass):**
- 3 baseline tests (no conditions)
- 6 Stuck tests (including override of Sprint, Speed CS, and combined)
- 5 Slowed tests (halving, floor, minimum speed)
- 12 Speed CS tests (positive/negative, symmetry, clamping)
- 3 Sprint tests (+50%, floor, min speed)
- 7 condition interaction tests (Slowed+CS, Slowed+Sprint, all three combined)
- 2 minimum floor tests

**Total: 46 tests, all passing.** Coverage is thorough. No missing edge cases identified.

## Edge Cases Reviewed

**Tripped cured mid-movement:** Not applicable. Movement in PTU is atomic (one Shift Action = one path). The Tripped check happens when speed is calculated before any movement begins. If Tripped is cleared, the combatant's next Shift Action will have full speed. The AoO `stand_up` trigger fires when Tripped is removed, per PTU p.241.

**Isometric grid:** `applyMovementModifiers` is a pure function that returns a speed value regardless of grid mode. Both 2D and isometric grids consume the same speed value from `getSpeed()` / `getMaxPossibleSpeed()`. No isometric-specific concerns.

**Multi-cell tokens (Large/Huge):** Speed modifiers are applied to the combatant's speed value, which is grid-mode-independent. Multi-cell footprint checks happen in pathfinding after speed is determined. No interaction.

**Frozen + Tripped:** Frozen is not a movement-blocking condition in PTU (it prevents actions, not movement). It is handled separately in the combat action system, not in `applyMovementModifiers`. No interaction concern.

## Regression Analysis

The implementation uses early-return pattern (same as Stuck), inserted between the existing Stuck check and Slowed check. The code path for non-Tripped combatants is unchanged -- the new `if` block is only entered when Tripped is present. No existing movement logic is modified. All 38 pre-existing tests continue to pass. No regressions.

## Summary

Feature-019 correctly implements the VTT Status-Movement Integration for all three target rules:

- **R022 (Stuck):** Pre-existing, correctly blocks all grid movement (speed 0).
- **R024 (Slowed):** Pre-existing, correctly halves movement speed with minimum 1.
- **R025 (Tripped):** Newly implemented, correctly blocks grid movement (speed 0) by checking both `statusConditions` and `tempConditions`. The dual-source check is necessary and correct because Tripped can originate from either the Trip maneuver/Blindness (statusConditions) or Take a Breather (tempConditions).

The implementation is faithful to PTU 1.05 rules. All 46 unit tests pass. Documentation updates (app-surface.md, R025 audit reclassification, feature-019 ticket) are accurate and complete.

## Rulings

1. **Tripped = speed 0 (not reduced speed):** CORRECT. PTU p.251 says "needs to spend a Shift Action getting up before they can take further actions." The entire Shift Action is consumed by standing up, leaving no movement. This is mechanically distinct from Slowed (partial reduction).

2. **tempConditions check for Tripped:** CORRECT and NECESSARY. Take a Breather (PTU p.245) applies Tripped as a temporary condition. Without this check, post-Breather combatants could illegally move on the grid.

3. **Stuck does NOT need tempConditions check:** CORRECT. No game mechanic generates Stuck as a tempCondition. Take a Breather *cures* Stuck rather than *applying* it.

4. **Math.trunc for Speed CS:** ACCEPTABLE. Produces symmetric results for positive/negative stages. The PTU text is ambiguous about the sign convention for negative stages; symmetric interpretation is the most fair.

## Verdict

**APPROVED** -- No issues found. All mechanics are correctly implemented per PTU 1.05 rules. Test coverage is comprehensive.

## Required Changes

None.
