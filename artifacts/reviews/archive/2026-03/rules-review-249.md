---
review_id: rules-review-249
review_type: game-logic
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat+vtt-grid
commits_reviewed:
  - a264318f
  - c26b81c9
  - f938c5ac
  - b7bdf700
  - c5dcbb11
  - 0eee0c38
  - 96754870
  - 1cb2f713
  - 9c12315f
files_reviewed:
  - app/server/services/out-of-turn.service.ts
  - app/utils/lineOfAttack.ts
  - app/components/encounter/InterceptPrompt.vue
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/server/api/encounters/[id]/disengage.post.ts
  - app/constants/combatManeuvers.ts
  - app/types/combat.ts
  - app/types/character.ts
  - books/markdown/core/07-combat.md (PTU p.241-242 reference)
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-03-02T11:35:00Z
follows_up: rules-review-240
---

## Review Scope

PTU rules compliance review for P2 of feature-016: Intercept Melee (R116, PTU p.242), Intercept Ranged (R117, PTU p.242), and Disengage Maneuver (PTU p.241, ptu-rule-095). Verified against the PTU 1.05 ruleset in `books/markdown/core/07-combat.md`.

Decrees verified: decree-002 (PTU alternating diagonal), decree-003 (passability), decree-006 (dynamic initiative). Decree-002 is violated by the movement step loops (see HIGH-001).

## PTU Rules Verified

### Intercept Melee (PTU p.242, lines 1247-1265)

| Rule Element | PTU Text | Implementation | Correct? |
|---|---|---|---|
| Action cost | "Full Action, Interrupt" | Consumes Standard + Shift + Interrupt | YES |
| Trigger | "An ally within Movement range is hit by an adjacent foe" | `detectInterceptMelee` checks adjacency + movement range | YES |
| DC | "three times the number of meters they have to move to reach the triggering Ally" | `dcRequired = 3 * distance` | YES (but see HIGH-002 re: multi-tile) |
| Success | "Push the triggering Ally 1 Meter away from you, and Shift to occupy their space, and are hit by the triggering attack" | `resolveInterceptMelee` pushes ally, shifts interceptor to ally's old position | YES |
| Failure | "still Shifts a number of meters equal a third of their check result" | `Math.floor(skillCheck / 3)` | YES |
| AoE note | "If the 1 meter push does not remove them from the Area of Effect, the Intercept has no effect" | Not implemented (deferred per spec Section D4) | ACCEPTABLE -- edge case, documented |
| "always be hit" | "Intercepts may not be used to move the Intercepting Pokemon or Trainer OUT of the way of an attack" | Detection excludes `interceptor.id === targetId` | YES |

### Intercept Ranged (PTU p.242, lines 1266-1278)

| Rule Element | PTU Text | Implementation | Correct? |
|---|---|---|---|
| Action cost | "Full Action, Interrupt" | Consumes Standard + Shift + Interrupt | YES |
| Trigger | "A Ranged X-Target attack passes within your Movement Range" | `detectInterceptRanged` checks line-of-attack reachability | YES |
| Square selection | "Select a Square within your Movement Range that lies directly between the source of the attack and the target" | `getLineOfAttackCells` with endpoint exclusion (`slice(1, -1)`) | YES |
| Shift distance | "Shift a number of Meters equal to half the result" | `Math.floor(skillCheck / 2)` | YES |
| Success condition | "If you succeed, you take the attack instead" | `reachedTarget = maxShift >= distanceToTarget` | YES |
| Failure | "you still Shift a number of Meters equal to half the result" | Same shift calc for both success and failure | YES |

### Shared Intercept Rules (PTU p.242, lines 1279-1298)

| Rule Element | PTU Text | Implementation | Correct? |
|---|---|---|---|
| Loyalty 3+ | "Pokemon must have a Loyalty of 3 or greater" | `checkInterceptLoyalty`: `loyalty < 3` blocks | YES |
| Loyalty 6 for non-trainer | "may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally" | `loyalty < 6` checks `target.entityId !== ownerId` | YES |
| Priority/Interrupt speed check | "only Intercept against Priority and Interrupt Moves if they are faster than the user" | `canInterceptMove`: `interceptor.initiative <= attacker.initiative` blocks | YES |
| Cannot-miss moves | "Moves that cannot miss (such as Aura Sphere or Swift) cannot be Intercepted" | `if (!move.canMiss) return results` | YES |
| Blocking conditions | "Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed, or otherwise unable to move" | `INTERCEPT_BLOCKING_CONDITIONS` includes all six + Bad Sleep | YES |

### Disengage (PTU p.241, line 1150-1153)

| Rule Element | PTU Text | Implementation | Correct? |
|---|---|---|---|
| Action cost | "Action: Shift" | `shiftActionUsed = true` | YES |
| Effect | "Shift 1 Meter" | Movement clamped to 1m via `combatant.disengaged` check in `useGridMovement` | YES |
| AoO exemption | "does not provoke an Attack of Opportunity" | `if (actor.disengaged) return false` in shift_away trigger check | YES |
| Turn-scoped flag | Disengage lasts for this turn only | `disengaged = false` at turn-end and round-start in `next-turn.post.ts` | YES |

## Issues

### CRITICAL

#### CRIT-001: Full Action eligibility check allows Intercept when one action already spent

**Rule:** PTU p.242: "Action: Full Action, Interrupt" -- PTU p.227: "Full Actions take both your Standard Action and Shift Action for a turn."

**File:** `app/server/services/out-of-turn.service.ts` line 726

The `canIntercept` function checks `ts.standardActionUsed && ts.shiftActionUsed`. This only blocks when BOTH actions are used. A Full Action requires BOTH Standard AND Shift to be available. If a combatant used their Standard Action (attacked) but not their Shift, the `&&` check passes, and the system incorrectly allows the Intercept -- consuming the already-spent Standard Action a second time.

Per PTU rules, you cannot perform a Full Action if either your Standard or Shift action is already consumed. The check must be `||`.

### HIGH

#### HIGH-001: Movement step loops violate decree-002 (PTU alternating diagonal)

**Rule:** decree-002 (PTU alternating diagonal for all distance calculations). PTU p.231: Diagonals alternate 1m/2m.

**Files:** `app/server/services/out-of-turn.service.ts` lines 1151-1163 and 1251-1258

Both Intercept Melee (failure: `floor(check/3)` shift) and Intercept Ranged (failure: `floor(check/2)` shift) use step-by-step movement that counts every step as 1 meter, even when moving diagonally. Per decree-002, diagonal movement costs alternate between 1m and 2m.

**Example violation:** Interceptor at (0,0), target at (3,3). Direction is (1,1) -- pure diagonal. With `shiftDistance=3`, the code moves 3 cells diagonally to (3,3). But per PTU alternating diagonal: step 1 costs 1m, step 2 costs 2m, step 3 costs 1m. Total = 4m. The combatant only has 3m of movement, so they should stop at (2,2) (costing 1+2=3m).

This produces incorrect final positions.

#### HIGH-002: Intercept Melee DC uses point distance instead of token-aware distance for multi-tile tokens

**Rule:** PTU p.242: "DC equal to three times the number of meters they have to move to reach the triggering Ally"

**File:** `app/server/services/out-of-turn.service.ts` lines 1085-1088

The DC calculation uses `ptuDiagonalDistance(target.position.x - interceptor.position.x, ...)` which measures top-left-to-top-left distance. For a Large (2x2) interceptor at (0,0) and a 1x1 target at (2,0), the raw delta distance is 2m. But the nearest cell of the 2x2 interceptor to the target is (1,0), which is only 1m away. The DC should be 3x1=3, not 3x2=6.

`ptuDistanceTokensBBox` in `gridDistance.ts` already computes the correct bounding-box distance between multi-tile tokens. It should be used here.

### MEDIUM

#### MED-001: `getCombatantSpeed` does not apply movement modifiers (Slowed, Speed CS, Sprint)

**Rule:** PTU p.231: Movement speed is affected by Slowed (half speed), Speed Combat Stages, and Sprint (+50%).

**File:** `app/server/services/out-of-turn.service.ts` lines 801-807

```typescript
function getCombatantSpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.overland || 5
  }
  return 5
}
```

This returns the raw base Overland speed for Pokemon and hardcoded 5 for humans. It does not apply movement modifiers that affect the combatant's effective movement range. A Slowed combatant with Overland 6 has effective speed 3, but the detection would still use 6, creating false-positive Intercept opportunities for combatants who cannot actually move that far.

The `applyMovementModifiers` function in `useGridMovement.ts` already handles all these modifiers and is exported as a pure function. Apply it to the base speed.

#### MED-002: `INTERCEPT_BLOCKING_CONDITIONS` includes `'Bad Sleep'` which is not explicitly listed in PTU rules

**Rule:** PTU p.242: "Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed, or otherwise unable to move."

**File:** `app/types/combat.ts` lines 165-167

'Bad Sleep' is included in the blocking conditions array but is not explicitly named in the PTU text. Including it is a correct interpretation -- 'Bad Sleep' is a variant of Asleep per PTU status definitions, and the PTU text's "Asleep" logically encompasses it. The `AOO_BLOCKING_CONDITIONS` array already includes it for consistency. However, the rationale should be documented with a comment to prevent future reviewers from questioning the inclusion.

## What Looks Good (PTU Compliance)

1. **Intercept Melee DC formula is correct.** `DC = 3 * distance` matches PTU p.242 exactly: "DC equal to three times the number of meters."

2. **Intercept Melee success resolution is faithful.** Push ally 1m away + shift to ally's old position + interceptor takes the hit. All three effects are implemented correctly per PTU.

3. **Intercept Melee failure shift is correctly calculated.** `floor(skillCheck / 3)` matches "a third of their check result" (PTU rounds down by convention).

4. **Intercept Ranged shift formula is correct.** `floor(skillCheck / 2)` matches "half the result" and "half the result" on both success and failure paths.

5. **Intercept Ranged success condition is correct.** Reaching the chosen square = taking the attack instead. Not reaching = still shifting but original target takes the hit.

6. **Loyalty requirements are correctly tiered.** Loyalty < 3 blocks entirely. Loyalty 3-5 allows only for trainer (via `ownerId`/`entityId` match). Loyalty 6+ allows for any ally.

7. **Priority/Interrupt move speed check uses initiative correctly.** "Faster than the user" = higher initiative. `interceptor.initiative <= attacker.initiative` blocks correctly (must be strictly greater).

8. **Cannot-miss move exclusion is correct.** The `canMiss` flag on the move object is checked before generating any Intercept opportunity.

9. **INTERCEPT_BLOCKING_CONDITIONS covers all PTU-listed conditions.** Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed are all present.

10. **Disengage is PTU-accurate.** Shift Action, 1m movement, no AoO provocation. All three elements match PTU p.241 verbatim.

11. **Disengage action type is correct.** The Maneuver entry uses `actionType: 'shift'` and `actionLabel: 'Shift Action'`, matching PTU "Action: Shift."

12. **Line-of-attack calculation correctly excludes endpoints.** The attacker's cell and target's cell are excluded from intermediate cells, matching PTU "between the source...and the target."

## Verdict

**CHANGES_REQUIRED**

CRIT-001 (Full Action `&&` vs `||`) is a rules-breaking bug. PTU explicitly states a Full Action requires both Standard and Shift. The current implementation allows Intercept with only one action remaining.

HIGH-001 (diagonal movement cost) violates decree-002 which mandates PTU alternating diagonal for ALL distance calculations. The step loops do not alternate diagonal costs, producing incorrect final positions.

HIGH-002 (multi-tile DC) produces incorrect DCs for Large/Huge/Gigantic Pokemon, making Intercept unfairly difficult for them. The codebase already has the correct utility function (`ptuDistanceTokensBBox`).

MED-001 (missing movement modifiers) creates false-positive Intercept opportunities for Slowed or debuffed combatants.

## Required Changes

1. **CRIT-001:** Fix `canIntercept` to use `||` instead of `&&` for the Standard/Shift action check.
2. **HIGH-001:** Apply PTU alternating diagonal cost tracking in both movement step loops (`resolveInterceptMelee` failure and `resolveInterceptRanged` failure).
3. **HIGH-002:** Use `ptuDistanceTokensBBox` for distance calculations in detection and DC.
4. **MED-001:** Apply `applyMovementModifiers` to `getCombatantSpeed` results.
5. **MED-002:** Add a comment documenting the 'Bad Sleep' inclusion rationale.
