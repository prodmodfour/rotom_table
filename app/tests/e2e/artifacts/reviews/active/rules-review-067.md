---
review_id: rules-review-067
trigger: orchestrator-routed
target_tickets: [ptu-rule-044, ptu-rule-062, ptu-rule-063]
reviewed_commits: []
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-20T00:00:00Z
reviewer: game-logic-reviewer
---

## Scope

Review of VTT terrain/movement batch B: ptu-rule-044 (Stuck/Slowed/Sprint/Speed CS enforcement on grid movement), ptu-rule-062 (terrain-aware speed selection), and ptu-rule-063 (Swim capability check for water terrain). All changes are in `app/composables/useGridMovement.ts`, `app/composables/useEncounterActions.ts`, and `app/server/api/encounters/[id]/next-turn.post.ts`.

## Mechanics Verified

### 1. Stuck Condition (ptu-rule-044) -- INCORRECT

**PTU Rule (p.231, p.253):**
> "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."
> "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move and cannot apply their Speed Evasion to attacks."

**Implementation (useGridMovement.ts:150-152):**
```typescript
if (conditions.includes('Stuck')) {
  modifiedSpeed = Math.floor(modifiedSpeed / 2)
}
```

**Issue: CRITICAL.** The implementation halves speed. PTU says Stuck means **zero movement** -- the combatant "cannot Shift at all." Speed should be reduced to 0, not halved. The ticket description itself contains the error: it says "movement actions cost double" which is wrong -- that is not what Stuck does in PTU. Stuck is a full movement lockout.

The comment in the code says "movement costs double -> effectively halve speed" but this is based on a misreading. The ticket's "Expected Behavior" section conflates Stuck with some other mechanic. The actual rule is unambiguous: Stuck = cannot shift = movement speed 0.

**Fix:** Change to `modifiedSpeed = 0` when Stuck is present. Also update the comment to reflect the actual rule.

### 2. Slowed Condition (ptu-rule-044) -- CORRECT

**PTU Rule (p.253):**
> "A Pokemon that is Slowed has its Movement halved (minimum 1)."

**Implementation (useGridMovement.ts:155-157):**
```typescript
if (conditions.includes('Slowed')) {
  modifiedSpeed = Math.floor(modifiedSpeed / 2)
}
```

This correctly halves movement. The minimum-1 floor is handled by the `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` at line 173. Correct.

### 3. Sprint Maneuver (ptu-rule-044) -- CORRECT

**PTU Rule (p.244):**
> "Maneuver: Sprint. Action: Standard. Range: Self. Effect: Increase your Movement Speeds by 50% for the rest of your turn."

**Implementation:**
- `useEncounterActions.ts:142-148`: When Sprint maneuver executed, adds 'Sprint' to `combatant.tempConditions`.
- `useGridMovement.ts:168-170`: `if (tempConditions.includes('Sprint')) { modifiedSpeed = Math.floor(modifiedSpeed * 1.5) }`
- `next-turn.post.ts:51`: Clears `tempConditions = []` on turn end.

Sprint uses a Standard Action (line 133-134 in useEncounterActions.ts confirms `useAction(combatantId, 'standard')`). The 50% bonus is applied correctly. The tempCondition is cleared at turn end ("rest of your turn"). All correct.

**Note:** PTU says "increase your Movement Speeds" (plural). The implementation applies +50% to the single computed speed, which is already the terrain-appropriate speed. This is acceptable since only one movement type is used per shift.

### 4. Speed Combat Stages and Movement (ptu-rule-044) -- INCORRECT

**PTU Rule (p.234-235):**
> "Speed Combat Stages and Movement: Combat Stages in the Speed Stat are special; they affect the movement capabilities of the Trainer or Pokemon. Quite simply, you gain a bonus or penalty to all Movement Speeds **equal to half your current Speed Combat Stage value rounded down**; if you are at Speed CS +6, you gain +3 to all Movement Speeds, for example. Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."

**Implementation (useGridMovement.ts:160-165, 180-189):**
```typescript
const speedStage = combatant.entity.stageModifiers?.speed ?? 0
if (speedStage !== 0) {
  const stageMultiplier = getSpeedStageMultiplier(speedStage)
  modifiedSpeed = Math.floor(modifiedSpeed * stageMultiplier)
}
```

Where `getSpeedStageMultiplier` returns the stat multiplier table (0.4x at -6 through 2.2x at +6).

**Issue: CRITICAL.** The implementation uses the **stat multiplier table** (the same one used for Attack/Defense/SpAtk/SpDef calculations). But PTU explicitly says Speed CS affects movement differently: it applies an **additive bonus equal to half the stage value**, NOT the stat multiplier.

The stat multiplier table (x0.4 to x2.2) is correct for calculating the Speed *stat* itself (for initiative, evasion, etc.). But for *movement*, the rule is different:

| Speed CS | Movement Modifier (correct) | Stat Multiplier (wrong, currently used) |
|----------|----------------------------|-----------------------------------------|
| +6       | +3                         | x2.2 (e.g. speed 5 -> 11)              |
| +4       | +2                         | x1.8 (e.g. speed 5 -> 9)               |
| +2       | +1                         | x1.4 (e.g. speed 5 -> 7)               |
| +1       | +0 (rounds down)           | x1.2 (e.g. speed 5 -> 6)               |
| -2       | -1                         | x0.8 (e.g. speed 5 -> 4)               |
| -4       | -2                         | x0.6 (e.g. speed 5 -> 3)               |
| -6       | -3                         | x0.4 (e.g. speed 5 -> 2)               |

Example: A Pokemon with Overland 5 at Speed CS +6 should have movement speed 5+3=8, not 5*2.2=11. The current implementation massively overstates the effect of positive stages and understates it for high-speed Pokemon.

**Additional rule:** Negative speed CS "may never reduce [movement] below 2." The current implementation has no such floor for CS-reduced movement (though `applyMovementModifiers` has a minimum-1 at the end, not minimum-2 as the rule specifies for CS reduction).

**Fix:**
```typescript
// Speed Combat Stage modifier: additive +/- half stage value
const speedStage = combatant.entity.stageModifiers?.speed ?? 0
if (speedStage !== 0) {
  const bonus = speedStage > 0
    ? Math.floor(speedStage / 2)
    : -Math.floor(Math.abs(speedStage) / 2)
  modifiedSpeed = Math.max(modifiedSpeed + bonus, 2)
}
```

Remove the `getSpeedStageMultiplier` function entirely (it duplicates the stat multiplier from `useCombat.ts` and misapplies it to movement).

### 5. Water Terrain / Swim Capability (ptu-rule-063) -- CORRECT WITH NOTES

**PTU Rule (p.231):**
> "Underwater: Underwater Terrain is any water that a Pokemon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability."

**Implementation:**
- `combatantCanSwim()` checks `pokemon.capabilities.swim > 0` for Pokemon type.
- For human combatants, returns `false`.
- `getTerrainCostForCombatant()` passes `canSwim` to `terrainStore.getMovementCost()`.
- Terrain store returns `Infinity` for water without swim (blocking), `2` for water with swim.

Pokemon swim check is correct. However:

**Note (LOW):** Trainers DO have a Swimming Speed in PTU (p.30: "Swimming Speed for a Trainer is equal to half of their Overland Speed"). `combatantCanSwim()` returns `false` for all human combatants. This means human trainers will be blocked from water terrain even though PTU says they can swim (just slowly). This is a pre-existing gap in the human character data model (no capabilities tracked), so it is not a regression from these changes. File as future enhancement.

**Note (LOW):** PTU classifies water as "Underwater Terrain" -- a **basic terrain type**, not inherently slow terrain. The terrain store assigns cost 2 to water (same as "difficult"/"slow" terrain). Per PTU, water terrain that a swimmer enters should cost 1 per cell (normal), with the swimmer using their Swim speed instead of Overland. The cost-2 for water with swim is debatable -- it could be argued as representing the transition difficulty, but strictly per PTU, Underwater is a basic terrain type with no inherent slow modifier. Water that is shallow/surface-level would be "Slow Terrain" with basic type Regular. This is a design choice, not a clear-cut error.

### 6. Earth Terrain / Burrow Capability (ptu-rule-062) -- CORRECT

**PTU Rule (p.231):**
> "Earth Terrain: Earth Terrain is underground terrain that has no existing tunnel that you are trying to Shift through. You may only Shift through Earth Terrain if you have a Burrow Capability."

**Implementation:**
- `combatantCanBurrow()` checks `pokemon.capabilities.burrow > 0`.
- Terrain store returns `Infinity` for earth without burrow (blocking), `1` for earth with burrow (normal cost).
- `getTerrainAwareSpeed()` returns `capabilities.burrow` speed for earth terrain.

Correct. Earth terrain is impassable without Burrow capability, normal cost with it, and the correct Burrow speed is selected.

### 7. Terrain-Aware Speed Selection (ptu-rule-062) -- CORRECT WITH NOTES

**PTU Rule (p.231):**
> "You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability. When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value."

**Implementation:** `getTerrainAwareSpeed()` selects speed based on terrain at the combatant's **current position**. If a Pokemon starts on water (Swim speed), moves to land (Overland speed), the speed used is Swim (from starting position).

**Note (MEDIUM):** PTU says when using multiple movement capabilities in one turn, you average them. The implementation uses only the speed for the starting terrain type. A Pokemon with Overland 7 and Swim 5 starting on water and moving to land should use averaged speed 6, not Swim 5. This is a known simplification. For a VTT grid where movement happens click-to-click, this is a reasonable compromise since computing mixed-terrain speed averaging mid-path is complex. However, it may produce incorrect results in mixed-terrain scenarios.

### 8. tempConditions Lifecycle (next-turn.post.ts) -- CORRECT

**Implementation (next-turn.post.ts:43-51):**
```typescript
const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
if (currentCombatant) {
  currentCombatant.hasActed = true
  currentCombatant.actionsRemaining = 0
  currentCombatant.shiftActionsRemaining = 0
  currentCombatant.tempConditions = []
}
```

This clears tempConditions when advancing past a combatant's turn. Sprint, Tripped, and Vulnerable all expire correctly. The clearing happens before advancing the turn index, which is correct.

### 9. Stuck + Slowed Stacking (ptu-rule-044)

**Implementation:** Stuck and Slowed stack multiplicatively (both halve speed independently). Since Stuck should actually be zero movement (see issue #1), this stacking question becomes moot -- if Stuck = 0 movement, adding Slowed on top doesn't matter.

### 10. Sprint Action Type (ptu-rule-044) -- CORRECT

**PTU Rule (p.244):** Sprint is a Standard Action.

**Implementation (useEncounterActions.ts:133-134):**
```typescript
if (['push', 'sprint', 'trip', 'grapple', 'disarm', 'dirty-trick'].includes(maneuverId)) {
  await encounterStore.useAction(combatantId, 'standard')
}
```

Correctly consumes a Standard Action.

## Issues Found

### CRITICAL

1. **Stuck should be zero movement, not halved.** PTU p.231: "Stuck means you cannot Shift at all." PTU p.253: "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move." The implementation halves speed instead of setting to 0. The ticket description itself contains the misreading ("movement actions cost double"). This is a binary condition: Stuck = cannot move. Period.

2. **Speed CS movement modifier uses wrong formula.** PTU p.234: "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down." The implementation applies the stat multiplier table (x0.4 to x2.2) instead of the additive bonus (+/- half stage). At Speed CS +6, a Pokemon with Overland 5 would get 11 instead of the correct 8. At Speed CS +1, a Pokemon with Overland 5 would get 6 instead of the correct 5 (since floor(1/2)=0). The entire `getSpeedStageMultiplier()` function is wrong and should be replaced with additive half-stage logic. Additionally, the minimum floor for CS-reduced movement should be 2 (per PTU), not 1 (current implementation).

### MEDIUM

3. **Mixed-terrain speed averaging not implemented.** PTU p.231: "When using multiple different Movement Capabilities in one turn, average the Capabilities and use that value." The implementation uses starting-position terrain speed for the entire move. Acceptable simplification for VTT click-to-move but produces incorrect results in mixed-terrain scenarios (e.g., Overland 7, Swim 5 moving from water to land should use 6, not 5).

### LOW

4. **Human trainers treated as non-swimmers.** PTU p.30: "Swimming Speed for a Trainer is equal to half of their Overland Speed." `combatantCanSwim()` returns `false` for all human combatants. Pre-existing data model gap, not a regression.

5. **Water terrain cost of 2 for swimmers is debatable.** PTU classifies "Underwater" as a basic terrain type (not inherently slow). A swimmer in water should arguably have movement cost 1, not 2. The cost-2 could be rationalized as "shallow water = slow terrain on regular base", but deep water (Underwater terrain type) for a swimmer should be cost 1.

## Verdict

**CHANGES_REQUIRED**

Two critical PTU rule implementation errors must be fixed before these tickets can be marked resolved:

1. **Stuck = zero movement**, not halved speed. Change `modifiedSpeed = Math.floor(modifiedSpeed / 2)` to `modifiedSpeed = 0` for the Stuck condition.

2. **Speed CS = additive half-stage bonus**, not stat multiplier. Replace `getSpeedStageMultiplier()` with additive `Math.floor(stage / 2)` logic, and enforce minimum movement speed of 2 for CS-reduced movement.

The medium and low issues can be tracked as separate follow-up tickets.
