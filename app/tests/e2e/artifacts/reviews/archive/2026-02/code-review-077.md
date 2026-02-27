---
review_id: code-review-077
trigger: orchestrator-routed
target_tickets: [ptu-rule-044, ptu-rule-062, ptu-rule-063]
reviewed_commits: [54c31e3, 49a7fb2]
verdict: APPROVED_WITH_ISSUES
reviewed_at: 2026-02-20T12:00:00Z
reviewer: senior-reviewer
---

## Scope

Batch B review of three VTT terrain/movement tickets:

1. **ptu-rule-063** (`combatantCanSwim`): Swim capability no longer hardcoded `false` -- reads Pokemon's `capabilities.swim`
2. **ptu-rule-062** (`getTerrainAwareSpeed`): Terrain-aware speed selection (Water -> Swim, Earth -> Burrow, default -> Overland)
3. **ptu-rule-044** (`applyMovementModifiers`): Movement condition enforcement (Stuck, Slowed, Speed CS, Sprint), Sprint tracked as tempCondition, tempConditions cleared on turn advance

### Files Reviewed

| File | Lines | Under 800? |
|------|-------|------------|
| `app/composables/useGridMovement.ts` | 334 | Yes |
| `app/components/vtt/GridCanvas.vue` | 311 | Yes |
| `app/composables/useGridRendering.ts` | 528 | Yes |
| `app/composables/useEncounterActions.ts` | 250 | Yes |
| `app/server/api/encounters/[id]/next-turn.post.ts` | 132 | Yes |

---

## Issues Found

### HIGH

#### H1: Stuck condition implemented incorrectly -- should prevent movement entirely, not halve speed

**File:** `app/composables/useGridMovement.ts`, lines 150-153

```typescript
// Stuck: movement costs double -> effectively halve speed
if (conditions.includes('Stuck')) {
  modifiedSpeed = Math.floor(modifiedSpeed / 2)
}
```

**PTU Rule (p.434):** "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."

Stuck does NOT halve movement -- it prevents all movement (Shift action cannot be used for movement). The current implementation halves speed, which is wrong. A Stuck combatant should have effective movement speed of 0 for grid purposes (no shifting). The comment says "movement costs double" which is also incorrect per PTU text.

**Fix:** Change to `modifiedSpeed = 0` when Stuck, or better: return 0 early since no further modifiers matter.

#### H2: Sprint mutates combatant object directly (reactive mutation)

**File:** `app/composables/useEncounterActions.ts`, lines 142-148

```typescript
if (maneuverId === 'sprint') {
  if (!combatant.tempConditions) {
    combatant.tempConditions = []
  }
  if (!combatant.tempConditions.includes('Sprint')) {
    combatant.tempConditions.push('Sprint')
  }
}
```

The `combatant` is obtained from `encounter.value?.combatants.find(c => c.id === combatantId)`, which is a reference into the reactive store. This code directly mutates the reactive object by:
1. Assigning a new array to `combatant.tempConditions` (property mutation)
2. Pushing onto the array (array mutation)

This violates the project's immutability rules. The `broadcastUpdate()` at line 176 will broadcast the mutated state, but this mutation is not going through the store's proper update mechanisms. Compare with Take a Breather which uses a proper server endpoint (`encounterCombatStore.takeABreather`) that returns a new encounter object.

**Fix:** Sprint should either use a server endpoint to persist tempConditions (like Take a Breather does), or at minimum create a new combatants array immutably and update the store properly. Without server persistence, Sprint's tempCondition will be lost on page refresh.

#### H3: Sprint tempCondition not persisted to database

**File:** `app/composables/useEncounterActions.ts`, lines 142-148

The Sprint tempCondition is set client-side only. It is not persisted to the database via any API call. Compare with Take a Breather (lines 151-154) which calls `encounterCombatStore.takeABreather()` -- a server endpoint that writes `combatant.tempConditions` into the DB.

If the GM refreshes the page or the WebSocket reconnects between Sprint execution and the next turn advance, the Sprint tempCondition is lost. The `broadcastUpdate()` will send it to connected Group views, but it is never saved.

**Fix:** Create a server endpoint or use an existing encounter update mechanism to persist tempConditions to the database after Sprint is applied.

### MEDIUM

#### M1: Speed CS minimum floor is 1, but PTU says minimum 2

**File:** `app/composables/useGridMovement.ts`, line 173

```typescript
return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
```

**PTU Rule (p.700):** "Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."

The PTU rule specifically states that Speed CS penalties cannot reduce movement below 2. The current code uses a minimum of 1. The minimum-2 floor should apply specifically after the Speed CS multiplier step, not after all modifiers (Slowed could still reduce below 2 since that's a separate condition).

**Fix:** Apply `Math.max(modifiedSpeed, 2)` specifically after the Speed CS step, then continue with Sprint. The final minimum of 1 can remain as the overall floor for other conditions.

#### M2: Speed CS multiplier applied to post-condition speed, but should apply to base

**File:** `app/composables/useGridMovement.ts`, lines 145-173

The order of operations is: base -> Stuck halve -> Slowed halve -> CS multiplier -> Sprint. However, the PTU Speed CS multiplier table is meant to apply to the base movement speed, not to a speed already halved by Stuck/Slowed. The conditions and CS are separate modifier systems.

The PTU text says "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed CS value" -- this is an additive modifier to the base speed. The multiplier table in the book appears to be for stat calculations, not movement. The text description says CS+6 gives +3 to movement speeds (half of 6), not multiply by 2.2.

However, since the PTU book lists multipliers in the same section as the movement text and the community generally uses multipliers, this is debatable. Filing as MEDIUM for awareness -- the multiplier approach is acceptable but the application order (post-Stuck/Slowed) is questionable.

#### M3: `pass` action mutates turnState directly

**File:** `app/composables/useEncounterActions.ts`, lines 166-170

```typescript
if (combatant.turnState) {
  combatant.turnState.hasActed = true
  combatant.turnState.standardActionUsed = true
  combatant.turnState.shiftActionUsed = true
}
```

Same mutation pattern as H2. The `combatant` reference from `findCombatant` points into the reactive store data. This is a pre-existing issue (not introduced by these tickets) but is in the same function as the Sprint change.

---

## What Looks Good

1. **`combatantCanSwim` / `combatantCanBurrow` helper design:** Clean, pure functions outside the composable closure. Proper optional chaining with `?? 0` fallback. Correctly handles the `pokemon` vs `human` type distinction.

2. **`getTerrainAwareSpeed` logic:** Clean terrain-to-capability mapping. Falls back to Overland correctly when the combatant lacks the terrain-specific capability (e.g., water terrain but no swim -- falls through to overland, and the terrain cost system separately blocks movement).

3. **`getTerrainCostGetter` pattern:** Elegant factory that returns `undefined` when no terrain exists (avoiding pathfinding overhead) or a combatant-bound closure when terrain is present. This is a clean abstraction.

4. **`getCombatant` callback in GridCanvas.vue (line 138-140):** Cleanly defined as a local function that searches `props.combatants`. No store leakage into the composable -- the composable receives a pure callback, not a store reference. This is the correct dependency inversion pattern.

5. **`getTerrainCostForCombatant` in useGridRendering:** Properly wires the combatant-aware terrain cost into both `drawMovementRange` and `drawExternalMovementPreview`, falling back to `getTerrainCostAt` when the combatant-aware variant is unavailable.

6. **tempConditions clearing in next-turn.post.ts (line 51):** `currentCombatant.tempConditions = []` correctly clears all tempConditions (Sprint, Tripped, Vulnerable) when the turn advances. This does not break Take a Breather's Tripped/Vulnerable because those are only relevant during the combatant's own turn (they're set during the turn and cleared at end of turn, which is exactly "until next turn" semantics).

7. **Speed stage multiplier table:** Exactly matches the PTU book (p.701-728).

8. **File sizes:** All files well under the 800-line limit.

---

## New Tickets Filed

### NEW-TICKET: ptu-rule-044-fix-stuck

**Title:** Fix Stuck condition to prevent movement entirely (not halve speed)
**Priority:** HIGH
**Description:** `applyMovementModifiers()` in `useGridMovement.ts` halves speed for Stuck, but PTU p.434 says "Stuck means you cannot Shift at all." Stuck combatants should have effective movement speed 0 on the VTT grid. The halving behavior belongs to Slowed only.

### NEW-TICKET: ptu-rule-044-persist-sprint

**Title:** Persist Sprint tempCondition to database via server endpoint
**Priority:** HIGH
**Description:** Sprint's tempCondition is applied client-side only in `useEncounterActions.ts`. Unlike Take a Breather (which uses `breather.post.ts`), Sprint is not persisted to the database. Page refresh or reconnection loses the Sprint state. Either extend an existing endpoint or create a dedicated one to persist tempConditions changes. Also fix the direct mutation of the reactive combatant object (use immutable update pattern).

### NEW-TICKET: ptu-rule-044-speed-cs-floor

**Title:** Apply minimum-2 floor after Speed CS penalties per PTU rules
**Priority:** MEDIUM
**Description:** PTU p.700 states negative Speed CS "may never reduce [movement] below 2." Current code has a minimum of 1 applied after all modifiers. The minimum-2 should be applied specifically after the Speed CS step.

---

## Verdict

**APPROVED_WITH_ISSUES**

The core architecture of the terrain-aware movement system (ptu-rule-062, ptu-rule-063) is well-designed. The `getCombatant` callback pattern, terrain cost getter factory, and capability-based swim/burrow checks are clean and correct.

However, ptu-rule-044 has three issues that need follow-up tickets:
- **H1 (Stuck):** Incorrect game rule implementation -- Stuck should block movement, not halve it
- **H2+H3 (Sprint persistence):** Client-only mutation without database persistence; also violates immutability rules
- **M1 (Speed CS floor):** Minor PTU accuracy issue (minimum 1 vs minimum 2)

None of these block the merge since the VTT is functional and the terrain system is a significant improvement. The issues are tracked as follow-up tickets and should be addressed in the next development cycle.
