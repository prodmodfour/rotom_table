---
review_id: rules-review-073
follows_up: rules-review-067
trigger: orchestrator-routed
target_tickets: [ptu-rule-044, ptu-rule-062, ptu-rule-063]
reviewed_commits: [8ecdb47, 9f2fe2b]
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-20T12:00:00Z
reviewer: game-logic-reviewer
---

## Scope

Re-review of the VTT movement batch (ptu-rule-044, ptu-rule-062, ptu-rule-063) following fixes for the two CRITICAL issues identified in rules-review-067:
1. Stuck condition changed from speed halving to `modifiedSpeed = 0` (commit `8ecdb47`)
2. Speed CS changed from stat multiplier table to additive `Math.floor(stage / 2)` (commit `9f2fe2b`)

This review verifies whether the fixes correctly implement PTU 1.05 rules and checks for any interaction bugs between the corrected mechanics.

## Mechanics Verified

### 1. Stuck Condition -- PARTIALLY FIXED (2 remaining issues)

**PTU Rule (p.231, p.253):**
> "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."
> "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move."

**Implementation (useGridMovement.ts:150-153):**
```typescript
// Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
if (conditions.includes('Stuck')) {
  modifiedSpeed = 0
}
```

The Stuck handler itself is now correct -- it sets speed to 0 instead of halving. However, two interaction bugs prevent it from working properly:

**Issue A: CRITICAL -- Minimum speed guard undoes Stuck.**
Line 180:
```typescript
return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
```
When Stuck sets `modifiedSpeed = 0`, this final guard evaluates `Math.max(0, 1)` = **1** (since the `speed` parameter -- the *original base speed* -- is > 0). A Stuck combatant can still move 1 cell. The minimum-1 guard was written assuming `modifiedSpeed` of 0 only occurs when the base speed is 0 (a zero-speed entity), but Stuck introduces a new path where a nonzero-base-speed entity should have effective speed 0.

**Issue B: HIGH -- Speed CS and Sprint can add movement back to a Stuck combatant.**
Speed CS is applied *after* Stuck (lines 160-172). If a Stuck combatant has Speed CS +6:
- Line 152: `modifiedSpeed = 0` (Stuck)
- Line 166: `stageBonus = Math.floor(6/2) = 3`
- Line 167: `modifiedSpeed = 0 + 3 = 3`

The combatant now has speed 3 despite being Stuck. PTU is unambiguous: "cannot Shift at all." No other modifier should override Stuck. Similarly, while Sprint on 0 stays 0 (`Math.floor(0 * 1.5) = 0`), the minimum guard at line 180 still bumps it to 1.

**Fix:** Stuck should short-circuit all other modifiers. If Stuck is present, return 0 immediately without applying Speed CS, Sprint, Slowed, or the minimum guard:

```typescript
const applyMovementModifiers = (combatant: Combatant, speed: number): number => {
  const conditions = combatant.entity.statusConditions ?? []

  // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
  // Short-circuit: no other modifier can override Stuck
  if (conditions.includes('Stuck')) {
    return 0
  }

  let modifiedSpeed = speed
  const tempConditions = combatant.tempConditions ?? []

  // Slowed, Speed CS, Sprint applied below...
  // ...

  // Minimum speed is 1 (can always move at least 1 cell)
  return Math.max(modifiedSpeed, 1)
}
```

### 2. Slowed Condition -- CORRECT

**PTU Rule (p.231):**
> "Slowed means your movement speed is halved."
> (p.253): "A Pokemon that is Slowed has its Movement halved (minimum 1)."

**Implementation (useGridMovement.ts:155-158):**
```typescript
if (conditions.includes('Slowed')) {
  modifiedSpeed = Math.floor(modifiedSpeed / 2)
}
```

Correctly halves movement. The minimum-1 floor is enforced by line 180. Correct.

### 3. Speed Combat Stages -- PARTIALLY FIXED (1 remaining issue)

**PTU Rule (p.234-235):**
> "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down"

**Implementation (useGridMovement.ts:160-172):**
```typescript
const clamped = Math.max(-6, Math.min(6, speedStage))
const stageBonus = Math.floor(clamped / 2)
modifiedSpeed = modifiedSpeed + stageBonus
if (stageBonus < 0) {
  modifiedSpeed = Math.max(modifiedSpeed, 2)
}
```

The fix correctly replaced the multiplicative stat table with additive half-stage logic, and correctly enforces the minimum-2 floor for negative CS. However:

**Issue C: MEDIUM -- `Math.floor` over-penalizes at odd negative stages.**

`Math.floor(x / 2)` for negative values rounds towards negative infinity, not towards zero. PTU says "half your current Speed Combat Stage value rounded down." The example given (CS +6 yields +3) confirms `floor(6/2) = 3`. For negative stages, the symmetric expectation ("reduces your movement equally") means the penalty magnitude should be `floor(abs(stage) / 2)`:

| Speed CS | Expected penalty | `Math.floor(clamped/2)` result | Correct? |
|----------|-----------------|-------------------------------|----------|
| -1       | 0               | -1                            | WRONG    |
| -2       | -1              | -1                            | Correct  |
| -3       | -1              | -2                            | WRONG    |
| -4       | -2              | -2                            | Correct  |
| -5       | -2              | -3                            | WRONG    |
| -6       | -3              | -3                            | Correct  |

At odd negative stages (-1, -3, -5), the penalty is 1 too high. A Pokemon at Speed CS -1 should have no movement penalty (half of 1 rounded down = 0), but gets -1 instead.

**Fix:** Use `Math.trunc(clamped / 2)` instead of `Math.floor(clamped / 2)`. `Math.trunc` truncates towards zero, which matches PTU's "rounded down" for both positive and negative values. Alternatively, use the formula from rules-review-067:
```typescript
const bonus = speedStage > 0
  ? Math.floor(speedStage / 2)
  : -Math.floor(Math.abs(speedStage) / 2)
```

### 4. Speed CS Minimum Floor of 2 -- CORRECT WITH INTERACTION BUG

**PTU Rule (p.700):**
> "may never reduce it below 2"

**Implementation (useGridMovement.ts:169-171):**
```typescript
if (stageBonus < 0) {
  modifiedSpeed = Math.max(modifiedSpeed, 2)
}
```

The minimum-2 floor for CS-reduced movement is correctly implemented. However, when combined with Stuck (per Issue B above), a Stuck combatant with negative CS would get speed 2 instead of 0. This is resolved by the Stuck short-circuit fix in Issue A.

### 5. Sprint Maneuver -- CORRECT

**PTU Rule (p.244):**
> "Maneuver: Sprint. Action: Standard. Range: Self. Effect: Increase your Movement Speeds by 50% for the rest of your turn."

**Implementation chain:**
1. `useEncounterActions.ts:133-134`: Sprint consumes a Standard Action via `useAction(combatantId, 'standard')`. Correct.
2. `useEncounterActions.ts:142-146`: Sprint calls `encounterCombatStore.sprint()` which hits the server endpoint.
3. `sprint.post.ts:37-38`: Adds 'Sprint' to `combatant.tempConditions` array. Correctly uses immutable spread (`[...combatant.tempConditions, 'Sprint']`). Correct.
4. `useGridMovement.ts:174-177`: `if (tempConditions.includes('Sprint')) { modifiedSpeed = Math.floor(modifiedSpeed * 1.5) }`. +50% applied correctly.
5. `next-turn.post.ts:51`: Clears `tempConditions = []` when advancing past the combatant's turn. "Rest of your turn" expiry is correct.

All five links in the Sprint chain are correct.

### 6. tempConditions Lifecycle -- CORRECT

**Implementation (next-turn.post.ts:43-52):**
```typescript
const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
if (currentCombatant) {
  currentCombatant.hasActed = true
  currentCombatant.actionsRemaining = 0
  currentCombatant.shiftActionsRemaining = 0
  currentCombatant.tempConditions = []
}
```

Clears all tempConditions (Sprint, Tripped, Vulnerable) when advancing past a combatant's turn. The clearing happens before advancing the turn index. Correct.

### 7. Water Terrain / Swim Capability (ptu-rule-063) -- CORRECT WITH NOTES

**PTU Rule (p.231):**
> "You may not move through Underwater Terrain during battle if you do not have a Swim Capability."

**Implementation:**
- `combatantCanSwim()` (lines 23-29): Checks `pokemon.capabilities.swim > 0` for Pokemon. Returns `false` for humans. Correct for Pokemon; human gap pre-existing.
- `getTerrainCostForCombatant()` (lines 208-213): Passes correct `canSwim`/`canBurrow` to terrain store. Correct.
- Swim check no longer hardcoded to `false`. The TODO comment from the original code has been resolved.

**Pre-existing note (LOW):** Human trainers still treated as non-swimmers. PTU p.30: "Swimming Speed for a Trainer is equal to half of their Overland Speed." This is a data model gap (no capabilities tracked for humans), not a regression from these changes. Already noted in rules-review-067.

### 8. Earth Terrain / Burrow Capability (ptu-rule-062) -- CORRECT

**PTU Rule (p.231):**
> "Earth Terrain is underground terrain... You may only Shift through Earth Terrain if you have a Burrow Capability."

**Implementation:**
- `combatantCanBurrow()` (lines 35-41): Checks `pokemon.capabilities.burrow > 0`. Returns `false` for humans. Correct.
- Earth terrain returns `Infinity` cost without Burrow (blocking), `1` with Burrow (normal). Correct.
- `getTerrainAwareSpeed()` (lines 48-65): Returns `capabilities.burrow` speed for earth terrain. Correct.

### 9. Terrain-Aware Speed Selection (ptu-rule-062) -- CORRECT WITH NOTES

**Implementation (useGridMovement.ts:48-65):** Selects Swim speed for water, Burrow speed for earth, Overland for everything else, based on current position terrain.

**Pre-existing note (MEDIUM):** Mixed-terrain speed averaging still not implemented. PTU p.231: "When using multiple different Movement Capabilities in one turn, average the Capabilities and use that value." Same note as rules-review-067; known simplification, not a regression.

### 10. Modifier Application Order

Current order: Stuck -> Slowed -> Speed CS -> Sprint -> Minimum guard.

Once Stuck is fixed to short-circuit (Issue A), the remaining order (Slowed -> Speed CS -> Sprint) is reasonable. PTU does not specify an explicit ordering for stacking these modifiers. The current order produces sensible results:
- Slowed first: halve base speed
- Speed CS: add/subtract from halved speed
- Sprint: boost the result by 50%

This order means Sprint boosts the already-modified speed, which matches the PTU Sprint text "Increase your Movement Speeds" (the current effective speed, not the base).

## Issues Found

### CRITICAL

1. **(Issue A) Stuck combatants can still move 1 cell.** Line 180: `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` evaluates to 1 when Stuck sets `modifiedSpeed = 0` but base `speed > 0`. Stuck should short-circuit and return 0 before this guard executes.

### HIGH

2. **(Issue B) Speed CS can override Stuck.** Speed CS +6 on a Stuck combatant produces speed 3 (0 + 3). Stuck should prevent all movement regardless of other modifiers. Fixed by the same short-circuit approach as Issue A.

### MEDIUM

3. **(Issue C) `Math.floor` over-penalizes odd negative Speed CS.** `Math.floor(-1/2) = -1` but PTU expects 0. `Math.floor(-3/2) = -2` but PTU expects -1. Use `Math.trunc(clamped / 2)` instead.

### PRE-EXISTING (from rules-review-067, unchanged)

4. Mixed-terrain speed averaging not implemented (MEDIUM, known simplification).
5. Human trainers treated as non-swimmers (LOW, data model gap).
6. Water terrain cost of 2 for swimmers debatable (LOW, design choice).

## Verdict

**CHANGES_REQUIRED**

The Stuck fix (commit `8ecdb47`) correctly changes the condition handler to `modifiedSpeed = 0`, but two interaction bugs prevent it from working:

1. **CRITICAL:** The minimum speed guard at line 180 bumps Stuck from 0 back to 1. The fix must have Stuck return 0 immediately, bypassing all subsequent modifiers and the minimum guard.

2. **HIGH:** Speed CS applied after Stuck can add movement back (e.g., CS +6 gives speed 3 despite Stuck). Same fix as #1 -- Stuck short-circuits.

The Speed CS fix (commit `9f2fe2b`) correctly replaces the stat multiplier with additive logic and adds the minimum-2 floor, but:

3. **MEDIUM:** `Math.floor(clamped / 2)` should be `Math.trunc(clamped / 2)` to avoid over-penalizing odd negative stages (-1 gives -1 instead of 0, -3 gives -2 instead of -1, -5 gives -3 instead of -2).

Items 1 and 2 are the same fix (Stuck short-circuit). Item 3 is a one-token change (`Math.floor` to `Math.trunc`). Two code changes total.
