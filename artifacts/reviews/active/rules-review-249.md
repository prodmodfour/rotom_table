---
review_id: rules-review-249
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat+vtt-grid
commits_reviewed:
  - 96754870
  - 1cb2f713
  - f938c5ac
  - c26b81c9
  - 93f0017f
  - e2c202e9
  - 98ef7972
mechanics_verified:
  - intercept-melee-detection
  - intercept-melee-resolution
  - intercept-ranged-detection
  - intercept-ranged-resolution
  - intercept-blocking-conditions
  - intercept-loyalty-requirement
  - intercept-priority-speed-check
  - intercept-cannot-miss-filter
  - intercept-full-action-cost
  - disengage-maneuver
  - disengage-aoo-exemption
  - disengage-movement-clamp
  - line-of-attack-bresenham
  - ptu-diagonal-distance-usage
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/07-combat.md#Page-228 (Full Action definition)
  - core/07-combat.md#Page-242 (Intercept Melee)
  - core/07-combat.md#Page-242 (Intercept Ranged)
  - core/07-combat.md#Page-242 (Intercept Additional Rules)
  - core/07-combat.md#Page-241 (Disengage)
reviewed_at: 2026-03-02T12:15:00Z
follows_up: rules-review-240
---

## Mechanics Verified

### 1. Intercept Melee Detection (R116)

- **Rule:** "Trigger: An ally within Movement range is hit by an adjacent foe." (`core/07-combat.md#Page-242`)
- **Implementation:** `detectInterceptMelee()` in `out-of-turn.service.ts` (line 823-888). Checks: (1) move can miss, (2) attacker is adjacent to target via `areAdjacent()`, (3) each potential interceptor is an ally of the target, (4) interceptor is within movement range of the target using `ptuDiagonalDistance()`, (5) passes `canIntercept()` eligibility, (6) loyalty check for Pokemon, (7) speed check for priority/interrupt moves.
- **Status:** CORRECT. All trigger conditions match PTU p.242. Movement range uses PTU diagonal distance (decree-002 compliant). Adjacency check correctly validates melee context.

### 2. Intercept Melee Resolution (R116)

- **Rule:** "You must make an Acrobatics or Athletics Check, with a DC equal to three times the number of meters they have to move to reach the triggering Ally; If you succeed, you Push the triggering Ally 1 Meter away from you, and Shift to occupy their space, and are hit by the triggering attack. On Failure to make the Check, the user still Shifts a number of meters equal a third of their check result." (`core/07-combat.md#Page-242`)
- **Implementation:** `resolveInterceptMelee()` in `out-of-turn.service.ts` (lines 1064-1194). DC = `3 * distance` (line 1089). Success: push ally 1m away via `calculatePushDirection()`, interceptor shifts to ally's old position (line 1104). Failure: shift `floor(skillCheck / 3)` meters toward target (line 1141).
- **Status:** CORRECT. DC formula matches (3x meters). Success path correctly pushes ally 1m and moves interceptor to their space. Failure shift of `floor(check/3)` correctly implements "a third of their check result" with implicit floor. Action economy correctly consumes Standard + Shift actions and sets `interruptUsed = true`.

### 3. Intercept Ranged Detection (R117)

- **Rule:** "Trigger: A Ranged X-Target attack passes within your Movement Range." (`core/07-combat.md#Page-242`)
- **Implementation:** `detectInterceptRanged()` in `out-of-turn.service.ts` (lines 906-976). Checks: (1) move can miss, (2) move `targetCount === 1` (single target), (3) attacker NOT adjacent to target (confirming ranged), (4) Bresenham line of attack has intermediate cells, (5) interceptor can reach at least one intermediate cell via `canReachLineOfAttack()`.
- **Status:** NEEDS REVIEW -- see MED-001 below. The `targetCount !== 1` restriction limits this to single-target only, but PTU says "Ranged X-Target" which includes multi-target moves (e.g., "2 Targets"). See medium issue MED-001.

### 4. Intercept Ranged Resolution (R117)

- **Rule:** "Make an Acrobatics or Athletics Check; you may Shift a number of Meters equal to half the result towards the chosen square. If you succeed, you take the attack instead of its intended target. If you fail, you still Shift a number of Meters equal to half the result." (`core/07-combat.md#Page-242`)
- **Implementation:** `resolveInterceptRanged()` in `out-of-turn.service.ts` (lines 1206-1288). Shift distance = `floor(skillCheck / 2)` (line 1229). Success = `maxShift >= distanceToTarget` (line 1237). Both success and failure cases move the interceptor by `distanceMoved` meters (capped at distance to target).
- **Status:** CORRECT. The shift distance formula `floor(check/2)` correctly implements "half the result." Success determination is correctly based on whether the shift reaches the target square, not a DC. Both outcomes apply the shift movement as specified. Action economy correctly consumed.

### 5. Intercept Blocking Conditions

- **Rule:** "Pokemon and Trainers cannot attempt Intercepts if they are Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed, or otherwise unable to move." (`core/07-combat.md#Page-242`)
- **Implementation:** `INTERCEPT_BLOCKING_CONDITIONS` in `types/combat.ts` (line 165-167): `['Asleep', 'Bad Sleep', 'Confused', 'Enraged', 'Frozen', 'Stuck', 'Paralyzed']`. Checked in `canIntercept()` (lines 699-736).
- **Status:** CORRECT. All six named conditions are present. `Bad Sleep` is correctly included as a variant of Asleep. The `canIntercept()` function also checks for Fainted/Dead and HP <= 0 as additional guards. The "or otherwise unable to move" clause is implicitly covered by the Stuck condition and the HP/Fainted checks.

### 6. Intercept Loyalty Requirement

- **Rule:** "Pokemon must have a Loyalty of 3 or greater to make Intercept Melee and Intercept Range Maneuvers, and may only Intercept attacks against their Trainer. At Loyalty 6, Pokemon may Intercept for any Ally." (`core/07-combat.md#Page-242`)
- **Implementation:** `checkInterceptLoyalty()` in `out-of-turn.service.ts` (lines 743-765). Non-Pokemon always allowed. Pokemon with `loyalty < 3` rejected. Pokemon with `3 <= loyalty < 6` can only intercept when `target.entityId === pokemon.ownerId` (i.e., their trainer). Pokemon with `loyalty >= 6` can intercept for any ally.
- **Status:** CORRECT. All three loyalty thresholds are correctly implemented. The trainer-only restriction at Loyalty 3-5 correctly checks `target.entityId !== ownerId`. Default loyalty of 0 (via `?? 0`) correctly prevents Pokemon without loyalty data from intercepting.

### 7. Intercept Priority/Interrupt Speed Check

- **Rule:** "Pokemon and Trainers may only Intercept against Priority and Interrupt Moves if they are faster than the user of those Moves." (`core/07-combat.md#Page-242`)
- **Implementation:** `canInterceptMove()` in `out-of-turn.service.ts` (lines 771-785). Checks `interceptor.initiative <= attacker.initiative` for priority/interrupt moves.
- **Status:** CORRECT. The rule says "faster than" which maps to strictly greater initiative. The code uses `<=` to block when interceptor is equal or slower, allowing only when strictly greater. This correctly implements "faster than" since equal speed does not count as faster. Per decree-006, initiative is dynamically updated on speed changes.

### 8. Intercept Cannot-Miss Move Filter

- **Rule:** "Moves that cannot miss (such as Aura Sphere or Swift) cannot be Intercepted." (`core/07-combat.md#Page-242`)
- **Implementation:** Both `detectInterceptMelee()` (line 828) and `detectInterceptRanged()` (line 911) check `if (!move.canMiss) return results` early, filtering out cannot-miss moves before any eligibility checks.
- **Status:** CORRECT. Early return prevents Intercept opportunities from being generated for cannot-miss moves.

### 9. Intercept Full Action Cost

- **Rule:** "Full Actions take both your Standard Action and Shift Action for a turn." (`core/07-combat.md#Page-228`). Intercept is listed as "Action: Full Action, Interrupt."
- **Implementation:** `canIntercept()` in `out-of-turn.service.ts` (lines 724-728):
  ```typescript
  const ts = combatant.turnState
  if (ts.standardActionUsed && ts.shiftActionUsed) {
    return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
  }
  ```
- **Status:** INCORRECT -- see HIGH-001 below. Uses `&&` instead of `||`.

### 10. Disengage Maneuver

- **Rule:** "Maneuver: Disengage. Action: Shift. Effect: You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity." (`core/07-combat.md#Page-241`)
- **Implementation:** `disengage.post.ts` (lines 48-68). Validates shift action is available (`shiftActionUsed` check). Sets `disengaged = true` and `shiftActionUsed = true`. Move log records action type as `'shift'`.
- **Status:** CORRECT. Consumes Shift Action, sets disengaged flag for AoO exemption. The `COMBAT_MANEUVERS` entry in `combatManeuvers.ts` correctly lists `actionType: 'shift'`, `ac: null`, and descriptive text.

### 11. Disengage + AoO Integration

- **Rule:** Disengage movement does not provoke AoO (`core/07-combat.md#Page-241`).
- **Implementation:** P0 established the `disengaged` flag check in `validateTriggerPreconditions()` at `out-of-turn.service.ts` (line 157): `if (actor.disengaged) return false` for `shift_away` triggers. Client-side mirror in `useGridMovement.ts` (line 648): `if (mover.disengaged) return []`.
- **Status:** CORRECT. Both server and client correctly exempt disengaged combatants from shift_away AoO triggers.

### 12. Disengage Movement Clamp

- **Rule:** "You may Shift 1 Meter." (`core/07-combat.md#Page-241`) -- Disengage limits movement to 1m.
- **Implementation:** `useGridMovement.ts` (lines 206-208): `if (combatant.disengaged) { return Math.min(modifiedSpeed, 1) }`. Also applied in second speed computation path (lines 254-256).
- **Status:** CORRECT. Movement speed is clamped to 1m when the disengaged flag is set. Uses `Math.min(modifiedSpeed, 1)` so it never exceeds 1m regardless of base speed.

### 13. Line-of-Attack (Bresenham's Algorithm)

- **Rule:** "Select a Square within your Movement Range that lies directly between the source of the attack and the target of the attack." (`core/07-combat.md#Page-242`)
- **Implementation:** `getLineOfAttackCells()` in `lineOfAttack.ts` (lines 24-58). Standard Bresenham's line algorithm from attacker to target. `canReachLineOfAttack()` (lines 73-106) excludes first (attacker) and last (target) cells, finds the closest reachable intermediate cell within movement range.
- **Status:** CORRECT. Bresenham's algorithm is a standard and appropriate choice for determining which grid cells lie "directly between" two positions. Excluding endpoints is correct since the interceptor must step INTO the path between source and target, not stand on the source or target cell. Distance calculations use `ptuDiagonalDistance` per decree-002.

### 14. PTU Diagonal Distance Usage

- **Rule:** Per decree-002, all grid distances use PTU alternating diagonal rule.
- **Implementation:** All distance calculations in detection and resolution functions use `ptuDiagonalDistance()` from `gridDistance.ts`. This includes: interceptor-to-target distance for Melee DC calculation, interceptor movement range checks, and Ranged line-of-attack reachability.
- **Status:** CORRECT. Consistent use of PTU diagonal distance throughout.

---

## Issues

### HIGH-001: `canIntercept()` Full Action check uses wrong boolean operator

**Severity:** HIGH
**File:** `app/server/services/out-of-turn.service.ts`, lines 724-728
**Rule:** PTU p.228: "Full Actions take both your Standard Action and Shift Action for a turn."

The `canIntercept()` function checks:
```typescript
if (ts.standardActionUsed && ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

This uses `&&` (AND), meaning it only blocks Intercept when **both** actions have already been consumed. However, a Full Action requires **both** Standard and Shift to be available. If a combatant has already used their Standard Action but not their Shift (or vice versa), the function would incorrectly allow the Intercept.

**Correct logic:**
```typescript
if (ts.standardActionUsed || ts.shiftActionUsed) {
  return { allowed: false, reason: 'No Full Action available (Standard + Shift required)' }
}
```

**Impact:** A combatant who has already used their Standard Action could still attempt an Intercept, violating the Full Action requirement. This would allow illegal Intercepts in mid-turn scenarios.

---

### MED-001: Intercept Ranged restricted to single-target but PTU says "X-Target"

**Severity:** MEDIUM
**File:** `app/server/services/out-of-turn.service.ts`, line 914
**Rule:** PTU p.242: "Trigger: A Ranged X-Target attack passes within your Movement Range."

The detection function checks:
```typescript
if (move.targetCount !== 1) return results
```

This restricts Intercept Ranged to single-target attacks only. However, PTU uses "X-Target" notation to mean any attack that targets a specific number of targets (1 Target, 2 Targets, 3 Targets, etc.), as opposed to AoE attacks (Cone, Burst, Line, Blast). A "Ranged 2 Targets" move like Water Shuriken would be excluded by this check, but per RAW it qualifies as a "Ranged X-Target attack."

The practical question is whether intercepting one target out of a multi-target attack makes mechanical sense. The RAW is ambiguous here -- the interceptor can only occupy one square and take one hit, so for multi-target it would only protect one of the targets.

**Recommendation:** File a `decree-need` ticket for human ruling on whether "X-Target" should include multi-target (2+) ranged attacks for Intercept Ranged, or only single-target. The current implementation is a reasonable conservative interpretation but may miss RAW-valid intercept opportunities.

---

### MED-002: Intercept Ranged does not validate the target square lies between attacker and target

**Severity:** MEDIUM
**File:** `app/server/api/encounters/[id]/intercept-ranged.post.ts`, lines 122-132
**Rule:** PTU p.242: "Select a Square within your Movement Range that lies **directly between** the source of the attack and the target of the attack."

The endpoint validates the target square is "on the line of attack" (line 125):
```typescript
const isOnLine = attackLine.some(c => c.x === targetSquare.x && c.y === targetSquare.y)
```

This validation only fires when `attacker.position && originalTarget?.position` are both available. If `originalTarget` is not found (e.g., the pending action was declined or the action ID is missing), the validation is skipped entirely (line 123 conditional). In that edge case, any target square would be accepted without verifying it's on the line of attack.

**Recommendation:** Make the validation mandatory. If the original target cannot be determined, reject the request rather than proceeding without line-of-attack validation:

```typescript
if (!attacker.position || !originalTarget?.position) {
  throw createError({
    statusCode: 400,
    message: 'Cannot validate line of attack: original target position unavailable'
  })
}
```

---

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-002 (PTU diagonal distance) | COMPLIANT | All distance calculations use `ptuDiagonalDistance()` |
| decree-003 (token passability) | NOT DIRECTLY TESTED | Push direction in Intercept Melee checks occupied cells but does not explicitly reference rough terrain for enemy squares. The push is 1m (single cell), so passability rules are less relevant here. No violation. |
| decree-006 (dynamic initiative) | COMPLIANT | Speed check in `canInterceptMove()` uses `interceptor.initiative` which is dynamically updated per decree-006 |
| decree-040 (flanking after cap) | NOT APPLICABLE | No evasion calculations in P2 scope |

## Summary

The P2 implementation of Intercept Melee/Ranged and Disengage is largely faithful to PTU 1.05 rules. The core formulas are correct:

- **Intercept Melee:** DC = 3x distance, success push + swap, failure shift = floor(check/3)
- **Intercept Ranged:** Shift = floor(check/2), success = reaching target square
- **Disengage:** Shift Action, 1m clamp, AoO exemption via disengaged flag

The loyalty requirements (3+ for trainer, 6 for any ally), blocking conditions (Asleep, Confused, Enraged, Frozen, Stuck, Paralyzed), priority/interrupt speed check, and cannot-miss move filter are all correctly implemented.

One HIGH issue exists: the Full Action availability check in `canIntercept()` uses `&&` instead of `||`, which would allow illegal Intercepts when only one of the two required actions has been consumed. Two MEDIUM issues: the single-target restriction for Intercept Ranged may be narrower than PTU RAW intended, and the line-of-attack validation can be bypassed when the original target is not found.

## Rulings

1. **Intercept Melee failure shift distance:** `floor(check/3)` is the correct interpretation of "a third of their check result." PTU does not specify rounding, and flooring is the standard PTU convention for fractional results.
2. **Intercept Ranged success condition:** Success is determined by whether `floor(check/2) >= distance_to_chosen_square`, matching the PTU text that success means reaching the chosen square.
3. **Bresenham's algorithm for "directly between":** Bresenham's line is an appropriate algorithm for determining cells that lie directly between two grid positions. This is a standard approach in tactical grid systems.

## Verdict

**CHANGES_REQUIRED**

HIGH-001 must be fixed before approval -- the `&&` to `||` change in `canIntercept()` is a single-character fix that prevents illegal Intercepts. MED-001 should produce a `decree-need` ticket for future clarification. MED-002 should harden the validation path.

## Required Changes

1. **[HIGH-001]** Fix `canIntercept()` in `app/server/services/out-of-turn.service.ts` line 726: change `ts.standardActionUsed && ts.shiftActionUsed` to `ts.standardActionUsed || ts.shiftActionUsed`.
2. **[MED-001]** File a `decree-need` ticket for whether "Ranged X-Target" in Intercept Ranged should include multi-target (2+) attacks, or only single-target. Current implementation is acceptable as conservative interpretation pending ruling.
3. **[MED-002]** In `app/server/api/encounters/[id]/intercept-ranged.post.ts`, make the line-of-attack validation mandatory instead of conditionally skipped. If original target position is unavailable, reject the request with a 400 error.
