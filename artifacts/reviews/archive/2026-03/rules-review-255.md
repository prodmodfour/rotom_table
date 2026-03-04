---
review_id: rules-review-255
review_type: game-logic
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat+vtt-grid
commits_reviewed:
  - cf8d511f
  - a97ca619
  - ed381d37
  - 5fd80952
  - 260ca189
  - 0ab897c2
  - fc1b0dc2
  - 2a2e6476
  - 8cbc7e7f
files_reviewed:
  - app/server/services/intercept.service.ts
  - app/server/services/out-of-turn.service.ts
  - app/utils/lineOfAttack.ts
  - app/components/encounter/InterceptPrompt.vue
  - app/server/api/encounters/[id]/intercept-melee.post.ts
  - app/server/api/encounters/[id]/intercept-ranged.post.ts
  - app/types/combat.ts
  - app/utils/gridDistance.ts
  - books/markdown/core/07-combat.md (PTU p.227, p.231, p.241-242 reference)
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T13:20:00Z
follows_up: rules-review-249
---

## Review Scope

PTU rules compliance re-review of feature-016 P2 fix cycle: 9 commits addressing all 5 issues from rules-review-249 (1C/2H/2M). Verified each fix against the PTU 1.05 ruleset and active decrees.

Decrees verified: decree-002 (PTU alternating diagonal -- applied in step loops), decree-003 (passability -- no violations), decree-040 (flanking penalty ordering -- not affected by this code).

## Verification of rules-review-249 Issues

### CRIT-001: Full Action eligibility check corrected to `||` -- RESOLVED

**Rule:** PTU p.227: "Full Actions take both your Standard Action and Shift Action for a turn." PTU p.242: "Action: Full Action, Interrupt."

**File:** `app/server/services/intercept.service.ts` line 94

```typescript
if (ts.standardActionUsed || ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

The `||` operator correctly enforces that BOTH Standard and Shift must be available. A combatant who has used either action cannot perform a Full Action. This matches the PTU definition exactly: a Full Action "takes both" actions, so both must be unused. Commit cf8d511f.

### HIGH-001: Movement step loops now apply decree-002 alternating diagonal -- RESOLVED

**Rule:** decree-002: "All grid distance measurements (movement, range, area effects) use PTU's alternating diagonal rule (1-2-1)." PTU p.231: Diagonal movement alternates 1m/2m.

**File:** `app/server/services/intercept.service.ts`

Melee failure (lines 583-601):
```typescript
let diagCount = 0
while (moved < shiftDistance) {
  const isDiag = dirX !== 0 && dirY !== 0
  const stepCost = isDiag ? (diagCount % 2 === 0 ? 1 : 2) : 1
  if (moved + stepCost > shiftDistance) break
  ...
  if (isDiag) diagCount++
}
```

Ranged failure (lines 689-702): Same pattern with `diagCount` tracking and alternating cost.

Verified with the example from the original review: Interceptor at (0,0), target at (3,3), direction (1,1), shiftDistance=3.
- Step 1: diagonal, diagCount=0, cost=1, moved=1, position (1,1)
- Step 2: diagonal, diagCount=1, cost=2, moved+cost=3 <= 3, moved=3, position (2,2)
- Step 3: diagonal, diagCount=2, cost=1, moved+cost=4 > 3, BREAK
- Final: (2,2), moved=3m. Correct -- 1m + 2m = 3m for 2 diagonal cells.

This matches the PTU alternating diagonal rule per decree-002. Commit a97ca619.

### HIGH-002: Multi-tile token distance uses `ptuDistanceTokensBBox` -- RESOLVED

**Rule:** PTU p.242: "DC equal to three times the number of meters they have to move to reach the triggering Ally." Distance must be measured correctly for multi-tile tokens -- nearest occupied cell to nearest occupied cell.

**File:** `app/server/services/intercept.service.ts`

Detection (line 284): `ptuDistanceTokensBBox({ position: interceptor.position, size: interceptor.tokenSize }, { position: target.position, size: target.tokenSize })`

DC calculation (line 517): Same bbox distance function for the DC multiplier.

Ranged distance (line 670): `ptuDistanceTokensBBox({ position: interceptor.position, size: interceptor.tokenSize }, { position: targetSquare, size: 1 })`

All use edge-to-edge bounding box measurement, consistent with decree-002's mandate that range is measured from "the nearest occupied cell of one token to the nearest occupied cell of the other" (per `ptuDistanceTokensBBox` docs). Commit ed381d37.

### MED-001: `getCombatantSpeed` now applies movement modifiers -- RESOLVED

**Rule:** PTU p.231: Movement speed is affected by status conditions (Stuck, Tripped), Slowed (half speed), Speed Combat Stages, and Sprint (+50%). PTU p.253: Stuck prevents shifting. PTU p.251: Tripped requires Shift to stand.

**File:** `app/server/services/intercept.service.ts` lines 179-221

The function now applies all movement modifiers in the correct order:
1. Stuck: return 0 (PTU p.253)
2. Tripped: return 0 (PTU p.251 -- must spend Shift to stand)
3. Slowed: `Math.floor(speed / 2)` (PTU p.253)
4. Speed CS: `Math.trunc(clamped / 2)` additive, min 2 on negative (PTU p.234, p.700)
5. Sprint: `Math.floor(speed * 1.5)` (PTU p.240)
6. Minimum floor: `Math.max(speed, baseSpeed > 0 ? 1 : 0)` -- can always move at least 1 unless base is 0

This mirrors the `applyMovementModifiers` composable in `useGridMovement.ts`. I verified the implementations match line-for-line in logic. A Slowed combatant with Overland 6 now correctly has effective speed 3 for intercept detection purposes. Commit 5fd80952.

### MED-002: Bad Sleep inclusion rationale documented -- RESOLVED

**Rule:** PTU p.242: "Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed, or otherwise unable to move." PTU p.249: Bad Sleep is a variant of the Sleep condition.

**File:** `app/types/combat.ts` lines 155-171

Both `AOO_BLOCKING_CONDITIONS` and `INTERCEPT_BLOCKING_CONDITIONS` now have JSDoc comments explaining:
- Bad Sleep is a variant of Asleep per PTU p.249
- The rules text's "Sleeping"/"Asleep" logically encompasses both Sleep variants
- Explicit cross-reference to PTU page numbers

This is the correct interpretation. PTU's "Asleep" condition includes both normal Sleep and Bad Sleep (the latter being the "may hurt themselves" variant). The comment prevents future reviewers from questioning the inclusion. Commit 260ca189.

## PTU Rules Re-Verification (Post-Fix)

All rules from the original rules-review-249 verification table remain correct after the fix cycle:

| Rule Element | Status |
|---|---|
| Intercept Melee: Full Action + Interrupt cost | CORRECT (|| check ensures both available) |
| Intercept Melee: DC = 3x distance | CORRECT (bbox distance for multi-tile) |
| Intercept Melee: Success push + shift + take hit | CORRECT (unchanged) |
| Intercept Melee: Failure shift floor(check/3) | CORRECT (alternating diagonal applied) |
| Intercept Ranged: Full Action + Interrupt cost | CORRECT (same canIntercept check) |
| Intercept Ranged: Shift floor(check/2) | CORRECT (alternating diagonal applied) |
| Intercept Ranged: Success if reached target square | CORRECT (unchanged) |
| Loyalty 3+ / 6 tiering | CORRECT (unchanged) |
| Priority/Interrupt speed check | CORRECT (unchanged) |
| Cannot-miss exclusion | CORRECT (unchanged) |
| Blocking conditions (all 7 + Bad Sleep) | CORRECT (documented) |
| Disengage: Shift Action, 1m, no AoO | CORRECT (unchanged) |
| Movement modifiers in detection | CORRECT (getCombatantSpeed applies all) |

## Verdict

**APPROVED**

All 5 issues from rules-review-249 have been resolved correctly:
- CRIT-001: Full Action `||` check matches PTU p.227
- HIGH-001: Alternating diagonal complies with decree-002
- HIGH-002: Bbox distance correctly measures multi-tile token distances per PTU measurement rules
- MED-001: Movement modifiers applied per PTU p.231/234/253
- MED-002: Bad Sleep rationale documented with PTU page references

No new PTU rule violations found. All Intercept/Disengage mechanics remain faithful to PTU 1.05 p.241-242.
