---
review_id: rules-review-075
review_type: rules
reviewer: game-logic-reviewer
follows_up: [rules-review-072, rules-review-073]
trigger: changes-required-followup
target_tickets: [ptu-rule-072, ptu-rule-068]
commits_reviewed:
  - 072f167
  - ca0ea5c
  - 1f56392
mechanics_verified:
  - stuck-early-return
  - speed-cs-symmetric-rounding
  - slowed-halving
  - sprint-50-percent
  - modifier-interaction-order
  - minimum-speed-floors
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md line 434 (Stuck movement block)
  - core/07-combat.md lines 1722-1723 (Stuck condition definition)
  - core/07-combat.md lines 692-700 (Speed CS movement modifier)
  - core/07-combat.md lines 1231-1236 (Sprint maneuver)
  - core/07-combat.md lines 1718-1721 (Slowed condition)
reviewed_at: 2026-02-20T06:00:00Z
---

## Review Scope

Follow-up review of three commits that address the CRITICAL (ptu-rule-072) and HIGH (ptu-rule-068) issues flagged in rules-review-072 and rules-review-073. Both prior reviews issued CHANGES_REQUIRED verdicts. This review verifies whether the fixes now correctly implement PTU 1.05 rules and whether the 38 unit tests encode correct game mechanics.

## Prior Issues Being Resolved

1. **rules-review-072 CRITICAL:** Stuck = 0 overridden by minimum speed floor (line 180) back to 1, and by Speed CS minimum floor of 2. Stuck combatants could move 1-2 cells.
2. **rules-review-072 HIGH:** `Math.floor(clamped / 2)` produces asymmetric penalties for odd negative Speed CS (-1 gives -1 instead of 0, -3 gives -2 instead of -1).
3. **rules-review-073 CRITICAL (Issue A):** Same as #1 above -- `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` undoes Stuck.
4. **rules-review-073 HIGH (Issue B):** Speed CS can add movement back to a Stuck combatant (CS +6 gives 0+3=3).
5. **rules-review-073 MEDIUM (Issue C):** Same as #2 above -- `Math.floor` over-penalizes odd negative stages.

## Fix 1: Stuck Early-Return (commit 072f167)

**PTU Rule:**
- p.231: "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."
- p.253 (condition definition): "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move and cannot apply their Speed Evasion to attacks."

**Implementation (useGridMovement.ts lines 83-87):**
```typescript
// Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
// Early-return so no downstream modifier (Speed CS, Sprint, min floor) can override
if (conditions.includes('Stuck')) {
  return 0
}
```

**Verification:**

The Stuck check is now the FIRST condition evaluated in `applyMovementModifiers()` (lines 83-87), positioned before Slowed (line 90), Speed CS (line 99), Sprint (line 111), and the minimum speed floor (line 116). The `return 0` statement exits the function immediately, bypassing all downstream logic.

This resolves all three prior issues simultaneously:
- Prior Issue A (minimum guard): `return 0` exits before `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` at line 116. RESOLVED.
- Prior Issue B (Speed CS override): `return 0` exits before `modifiedSpeed + stageBonus` at line 103. RESOLVED.
- Sprint on Stuck: `return 0` exits before `Math.floor(modifiedSpeed * 1.5)` at line 112. RESOLVED.

**Status: CORRECT** -- The early-return pattern is the cleanest way to implement an absolute movement block. No code path can produce a non-zero result for a Stuck combatant.

## Fix 2: Math.trunc for Symmetric Speed CS Rounding (commit ca0ea5c)

**PTU Rule (p.234-235, lines 692-700):**
> "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."

**Implementation (useGridMovement.ts lines 94-108):**
```typescript
const speedStage = combatant.entity.stageModifiers?.speed ?? 0
if (speedStage !== 0) {
  const clamped = Math.max(-6, Math.min(6, speedStage))
  const stageBonus = Math.trunc(clamped / 2)
  modifiedSpeed = modifiedSpeed + stageBonus
  if (stageBonus < 0) {
    modifiedSpeed = Math.max(modifiedSpeed, 2)
  }
}
```

**Verification -- Math.trunc result table:**

| Speed CS | `Math.trunc(cs/2)` | Expected (PTU "equally") | Correct? |
|----------|--------------------|--------------------------|----------|
| +6       | +3                 | +3                       | YES      |
| +5       | +2                 | +2                       | YES      |
| +4       | +2                 | +2                       | YES      |
| +3       | +1                 | +1                       | YES      |
| +2       | +1                 | +1                       | YES      |
| +1       | 0                  | 0                        | YES      |
| -1       | 0                  | 0                        | YES      |
| -2       | -1                 | -1                       | YES      |
| -3       | -1                 | -1                       | YES      |
| -4       | -2                 | -2                       | YES      |
| -5       | -2                 | -2                       | YES      |
| -6       | -3                 | -3                       | YES      |

The PTU example confirms CS +6 yields +3, and the "equally" language requires that |bonus(+n)| = |penalty(-n)| for all n. `Math.trunc` achieves this by rounding toward zero for both positive and negative values.

**Symmetry verification:**
- CS +1 / CS -1: both produce magnitude 0. SYMMETRIC.
- CS +3 / CS -3: both produce magnitude 1. SYMMETRIC.
- CS +5 / CS -5: both produce magnitude 2. SYMMETRIC.
- CS +6 / CS -6: both produce magnitude 3. SYMMETRIC.

**Minimum floor of 2 (p.700, "may never reduce it below 2"):**
The guard `Math.max(modifiedSpeed, 2)` only triggers when `stageBonus < 0`. This correctly applies only to negative CS movement penalties. Positive CS does not trigger the floor. This is correct -- the PTU says "Being at a negative Combat Stage... may never reduce it below 2."

**Status: CORRECT** -- `Math.trunc` produces the exact values expected by PTU rules across all 12 valid CS values (-6 to +6).

## Fix 3: Unit Tests (commit 1f56392)

### Test Structure Assessment

The test file (`app/tests/unit/composables/useGridMovement.test.ts`) contains 38 tests organized into 7 describe blocks:

1. **No conditions (baseline)** -- 3 tests
2. **Stuck condition** -- 6 tests
3. **Slowed condition** -- 5 tests
4. **Speed Combat Stage modifier** -- 13 tests
5. **Sprint** -- 3 tests
6. **Condition interactions** -- 6 tests
7. **Minimum speed floor** -- 2 tests

### Test-by-Test PTU Correctness Verification

#### Baseline (3 tests)
- `base speed 5 -> 5`: No modifiers. CORRECT.
- `base speeds 1, 3, 8, 10 unchanged`: No modifiers. CORRECT.
- `base speed 0 -> 0`: No minimum floor for zero-speed entities. CORRECT.

#### Stuck (6 tests)
- `Stuck + base 5 -> 0`: PTU p.231 "cannot Shift at all." CORRECT.
- `Stuck + base 1/10/100 -> 0`: Same rule regardless of speed. CORRECT.
- `Stuck + CS +6 -> 0`: Stuck overrides all modifiers. CORRECT.
- `Stuck + Sprint -> 0`: Stuck overrides Sprint. CORRECT.
- `Stuck + CS +6 + Sprint -> 0`: Stuck overrides all combinations. CORRECT.
- `Stuck + CS -6 -> 0`: Stuck overrides negative CS minimum floor of 2. CORRECT.

#### Slowed (5 tests)
- `Slowed + base 5 -> 2`: `floor(5/2) = 2`. CORRECT per PTU p.231 "movement speed is halved."
- `Slowed + base 6 -> 3`: `floor(6/2) = 3`. CORRECT.
- `Slowed + base 7 -> 3`: `floor(7/2) = 3`. CORRECT (floors down).
- `Slowed + base 1 -> 1`: `floor(1/2) = 0`, minimum floor raises to 1. CORRECT per p.253 "halved (minimum 1)."
- `Slowed + base 0 -> 0`: Zero-speed entity stays 0. CORRECT.

#### Speed CS (13 tests)
- `CS +6, base 5 -> 8`: `5 + trunc(6/2) = 5 + 3 = 8`. CORRECT. Matches PTU example.
- `CS +4, base 5 -> 7`: `5 + trunc(4/2) = 5 + 2 = 7`. CORRECT.
- `CS +2, base 5 -> 6`: `5 + trunc(2/2) = 5 + 1 = 6`. CORRECT.
- `CS +1, base 5 -> 5`: `5 + trunc(1/2) = 5 + 0 = 5`. CORRECT.
- `CS -6, base 5 -> 2`: `5 + trunc(-6/2) = 5 + (-3) = 2`, floor 2. CORRECT. Note: raw result is 2 which equals the floor; floor has no effect but is checked.
- `CS -6, base 3 -> 2`: `3 + (-3) = 0`, floor raises to 2. CORRECT per p.700 "never reduce below 2."
- `CS -1, base 5 -> 5`: `5 + trunc(-1/2) = 5 + 0 = 5`. CORRECT (symmetric with +1).
- `CS +1 vs -1 symmetry`: Both produce 0 magnitude change. CORRECT.
- `CS +3 vs -3 symmetry, base 10`: +3 gives `10+1=11`, -3 gives `10-1=9`. Bonus magnitude +1, penalty magnitude +1. CORRECT.
- `CS +5 vs -5 symmetry, base 10`: +5 gives `10+2=12`, -5 gives `10-2=8`. Bonus +2, penalty +2. CORRECT.
- `CS +10 clamped to +6, base 5 -> 8`: Clamped, same as CS +6. CORRECT per PTU "may never be raised higher than +6."
- `CS -10 clamped to -6, base 5 -> 2`: Clamped, same as CS -6. CORRECT per PTU "or lower than -6."

**Edge case note on CS -3 symmetry test:** The test uses `base = 10`. CS +3 gives `10 + trunc(3/2) = 10 + 1 = 11`, so `posBonus = 1`. CS -3 gives `10 + trunc(-3/2) = 10 + (-1) = 9`, so `negPenalty = 10 - 9 = 1`. `posBonus === negPenalty`. CORRECT.

**Edge case note on CS -5 symmetry test:** CS +5 gives `10 + 2 = 12`, `posBonus = 2`. CS -5 gives `10 + (-2) = 8`, `negPenalty = 2`. CORRECT. Note the test wisely uses `base = 10` so the minimum floor of 2 does not interfere with the symmetry measurement.

#### Sprint (3 tests)
- `Sprint + base 5 -> 7`: `floor(5 * 1.5) = floor(7.5) = 7`. CORRECT per PTU "Increase your Movement Speeds by 50%."
- `Sprint + base 3 -> 4`: `floor(3 * 1.5) = floor(4.5) = 4`. CORRECT.
- `Sprint + base 1 -> 1`: `floor(1 * 1.5) = floor(1.5) = 1`. CORRECT (minimum floor also applies).

#### Condition Interactions (6 tests)
- `Slowed + CS +6, base 5 -> 5`: `floor(5/2) = 2`, then `2 + 3 = 5`. CORRECT -- Slowed first, then CS additive.
- `Slowed + CS -6, base 5 -> 2`: `floor(5/2) = 2`, then `2 + (-3) = -1`, floor 2. CORRECT.
- `Slowed + Sprint, base 6 -> 4`: `floor(6/2) = 3`, then `floor(3 * 1.5) = 4`. CORRECT.
- `Slowed + CS +4 + Sprint, base 8 -> 9`: `floor(8/2) = 4`, then `4 + 2 = 6`, then `floor(6 * 1.5) = 9`. CORRECT.
- `Stuck + Slowed, base 5 -> 0`: Stuck early-returns before Slowed applies. CORRECT.
- `CS +6, base 10 -> 13`: `10 + 3 = 13`. CORRECT.
- `CS -6, base 10 -> 7`: `10 + (-3) = 7`, above floor 2. CORRECT.

#### Minimum Speed Floor (2 tests)
- `Slowed + base 1 -> 1`: `floor(1/2) = 0`, final floor `Math.max(0, 1) = 1`. CORRECT per p.253 Slowed "minimum 1."
- `Slowed + base 0 -> 0`: `floor(0/2) = 0`, final floor `Math.max(0, 0) = 0`. CORRECT -- zero-speed entities stay at 0.

### Test Correctness Summary

All 38 test assertions encode correct PTU mechanics. Every expected value has been verified against the rulebook formulas. The symmetry tests are particularly well-designed -- they use a high base speed (10) to avoid the minimum floor of 2 interfering with the measurement, which would produce a false positive.

## Modifier Application Order

The implementation applies modifiers in this order:
1. **Stuck** (early-return) -- absolute block, no other modifier matters
2. **Slowed** -- halve base speed
3. **Speed CS** -- additive bonus/penalty with minimum floor of 2 for negatives
4. **Sprint** -- +50% of current effective speed
5. **Minimum floor** -- at least 1 for non-zero base speed

PTU does not specify an explicit stacking order for simultaneous conditions. The chosen order is reasonable:
- Slowed reduces the base before CS adjusts it, so CS effectively operates on the halved speed. This is the conservative (player-unfavorable) interpretation, which is standard for debuffs in PTU.
- Sprint boosts the final modified speed, matching the PTU text "Increase your Movement Speeds" (plural, current effective speeds).
- The minimum-1 floor at the end prevents the pathological case where multiple debuffs reduce speed to 0 when the entity should still be able to crawl (distinct from Stuck which is an explicit "cannot move" condition).

## Pre-Existing Issues (unchanged from prior reviews)

These items were noted in rules-review-072 and rules-review-073 and are NOT regressions from these fixes:

1. **MEDIUM:** Mixed-terrain speed averaging not implemented (PTU p.231: "When using multiple different Movement Capabilities in one turn, average the Capabilities and use that value"). Known simplification.
2. **LOW:** Human trainers treated as non-swimmers (PTU p.30: swimming speed = half overland). Data model gap.

## Summary

| Mechanic | Status | Commits |
|----------|--------|---------|
| Stuck early-return | CORRECT | 072f167 |
| Speed CS Math.trunc | CORRECT | ca0ea5c |
| Slowed halving | CORRECT (unchanged) | -- |
| Sprint +50% | CORRECT (unchanged) | -- |
| Modifier order | CORRECT | 1f56392 |
| Minimum speed floors | CORRECT | 1f56392 |
| 38 unit test assertions | ALL CORRECT | 1f56392 |

## Verdict

**APPROVED** -- Both fixes correctly implement PTU 1.05 rules. The Stuck early-return (commit 072f167) resolves the CRITICAL issue from rules-review-072 and the CRITICAL + HIGH issues from rules-review-073. The Math.trunc change (commit ca0ea5c) resolves the HIGH issue from rules-review-072 and the MEDIUM issue from rules-review-073. All 38 unit test assertions have been verified against the PTU rulebook and encode correct game mechanics. No new issues found.

Both ptu-rule-072 and ptu-rule-068 are ready to be marked as resolved.
