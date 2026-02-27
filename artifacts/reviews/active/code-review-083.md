---
review_id: code-review-083
follows_up: code-review-077
trigger: manual-re-review
target_tickets: [ptu-rule-067, ptu-rule-068, ptu-rule-069]
original_tickets: [ptu-rule-044, ptu-rule-062, ptu-rule-063]
reviewed_commits: [8ecdb47, 9f2fe2b, 74ba0fd, 06926ba, 21cb5e5]
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-20T15:00:00Z
reviewer: senior-reviewer
---

## Scope

Follow-up re-review of the three fix tickets (ptu-rule-067, ptu-rule-068, ptu-rule-069) that were filed from the original VTT movement batch review (code-review-077, rules-review-067). Verifying that all CRITICAL, HIGH, and MEDIUM issues from both original reviews are resolved and checking for new issues introduced by the fixes.

### Original Issues Tracked

| ID | Severity | Issue | Fix Ticket | Status |
|----|----------|-------|------------|--------|
| CR-077 H1 | HIGH | Stuck halves instead of blocking movement | ptu-rule-067 | See below |
| CR-077 H2 | HIGH | Sprint mutates reactive object directly | ptu-rule-069 | RESOLVED |
| CR-077 H3 | HIGH | Sprint tempCondition not persisted to DB | ptu-rule-069 | RESOLVED |
| CR-077 M1 | MEDIUM | Speed CS floor is 1, should be 2 | ptu-rule-068 | RESOLVED |
| CR-077 M2 | MEDIUM | Speed CS uses stat multiplier, not additive | ptu-rule-068 | RESOLVED |
| RR-067 C1 | CRITICAL | Stuck = zero movement, not halved | ptu-rule-067 | See below |
| RR-067 C2 | CRITICAL | Speed CS = additive half-stage, not multiplier | ptu-rule-068 | RESOLVED |

### Files Reviewed

| File | Lines | Under 800? |
|------|-------|------------|
| `app/composables/useGridMovement.ts` | 327 | Yes |
| `app/composables/useEncounterActions.ts` | 247 | Yes |
| `app/stores/encounterCombat.ts` | 164 | Yes |
| `app/server/api/encounters/[id]/sprint.post.ts` | 95 | Yes |
| `app/server/api/encounters/[id]/next-turn.post.ts` | 133 | Yes |

---

## Issue Resolution Verification

### ptu-rule-068: Speed CS additive formula + minimum floor of 2 -- RESOLVED

**Original issues:** CR-077 M1+M2, RR-067 C2

The fix correctly replaced the multiplicative `getSpeedStageMultiplier()` function with additive half-stage logic:

```typescript
const clamped = Math.max(-6, Math.min(6, speedStage))
const stageBonus = Math.floor(clamped / 2)
modifiedSpeed = modifiedSpeed + stageBonus
if (stageBonus < 0) {
  modifiedSpeed = Math.max(modifiedSpeed, 2)
}
```

Verification:
- Speed CS +6 on Overland 5: `5 + floor(6/2) = 5 + 3 = 8` (correct per PTU p.234)
- Speed CS +1 on Overland 5: `5 + floor(1/2) = 5 + 0 = 5` (correct, rounds down)
- Speed CS -6 on Overland 5: `5 + floor(-6/2) = 5 + (-3) = 2`, then `max(2, 2) = 2` (correct, minimum floor of 2)
- Speed CS -6 on Overland 3: `3 + (-3) = 0`, then `max(0, 2) = 2` (correct, floor enforced)
- The `clamped` variable correctly bounds input to [-6, +6]
- `Math.floor` on negative values works correctly: `Math.floor(-3/2) = Math.floor(-1.5) = -2` for CS -3
- Wait -- `Math.floor(clamped / 2)` where `clamped = -3`: `Math.floor(-3/2) = Math.floor(-1.5) = -2`. But the PTU rule says "half your current Speed Combat Stage value rounded down." For negative stages, "rounded down" (floor) makes the penalty larger than truncation would. CS -3 gives -2 penalty instead of -1. This is the mathematically stricter reading and is acceptable -- it makes negative CS slightly more impactful, which is a defensible interpretation of "rounded down." The Game Logic Reviewer should confirm if PTU intends "rounded toward zero" (truncation) or "rounded down" (floor) for negative stages.

**Verdict:** RESOLVED. The `getSpeedStageMultiplier()` function is removed, additive logic is correct, minimum floor of 2 is properly enforced for negative bonuses only.

### ptu-rule-069: Sprint server persistence + immutable update -- RESOLVED

**Original issues:** CR-077 H2+H3

Three changes were made:

1. **`app/server/api/encounters/[id]/sprint.post.ts` (new file):** Server endpoint that persists Sprint tempCondition to the database. Uses `loadEncounter`/`findCombatant`/`getEntityName` from the shared encounter service. Creates a new array via spread (`[...combatant.tempConditions, 'Sprint']`) rather than `.push()`. Adds a move log entry. Follows the same pattern as `breather.post.ts`.

2. **`app/stores/encounterCombat.ts`:** Added `sprint()` method -- a thin `$fetch` wrapper matching the `takeABreather()` pattern. Clean.

3. **`app/composables/useEncounterActions.ts`:** Sprint handling replaced from direct mutation to:
   ```typescript
   encounterStore.encounter = await encounterCombatStore.sprint(
     encounterStore.encounter.id, combatantId
   )
   ```
   The server returns a fresh encounter object which replaces the store reference. No reactive mutation.

**Verdict:** RESOLVED. Sprint is now persisted server-side and the client uses immutable store replacement. The endpoint follows established patterns (breather.post.ts). The response shape is consistent with other encounter action endpoints.

### ptu-rule-067: Stuck = zero movement -- PARTIALLY RESOLVED (NEW CRITICAL BUG)

**Original issues:** CR-077 H1, RR-067 C1

The fix changed line 152 from `Math.floor(modifiedSpeed / 2)` to `modifiedSpeed = 0`. The comment was updated to reference PTU 1.05 p.231. However, the fix is **defeated by the minimum speed floor at line 180.**

---

## Issues Found

### CRITICAL

#### C1: Stuck = 0 is overridden by minimum speed floor, resulting in speed 1

**File:** `app/composables/useGridMovement.ts`, lines 150-153, 179-180

The Stuck fix sets `modifiedSpeed = 0`, but the function's return statement undoes this:

```typescript
// Line 152: Stuck sets speed to 0
if (conditions.includes('Stuck')) {
  modifiedSpeed = 0
}

// ...

// Line 180: But this restores it to 1 for any combatant with base speed > 0
return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
```

**Trace for a Stuck combatant with Overland 5:**
1. `modifiedSpeed = 5` (base speed)
2. Stuck: `modifiedSpeed = 0`
3. Line 180: `Math.max(0, 5 > 0 ? 1 : 0)` = `Math.max(0, 1)` = **1**

The Stuck combatant ends up with effective movement speed **1**, not **0**. They can still move 1 cell per shift. PTU says "cannot Shift at all."

**Worse case -- Stuck + positive Speed CS + Sprint:**
1. `modifiedSpeed = 5`
2. Stuck: `modifiedSpeed = 0`
3. Speed CS +6: `stageBonus = 3`, `modifiedSpeed = 0 + 3 = 3`
4. Sprint: `modifiedSpeed = floor(3 * 1.5) = 4`
5. Line 180: `Math.max(4, 1) = 4`

A Stuck combatant with Speed CS +6 and Sprint could move 4 cells. This is completely wrong. Stuck is absolute -- no modifier should override it.

**Fix:** Early return when Stuck is detected. If the combatant is Stuck, return 0 immediately. Speed CS, Sprint, and the minimum floor should not apply:

```typescript
// Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
if (conditions.includes('Stuck')) {
  return 0
}
```

This also makes the function cleaner -- no need to track whether Stuck was applied through the rest of the modifier chain.

### HIGH

#### H1: No unit test coverage for `applyMovementModifiers`

**Files:** No test file exists for `useGridMovement.ts` movement modifiers

The `applyMovementModifiers` function contains non-trivial conditional logic (Stuck, Slowed, Speed CS additive with floor, Sprint multiplicative, overall floor) across 5 branches. This function has been the source of 3 CRITICAL bugs and 2 MEDIUM bugs across two review cycles, and currently has a fourth CRITICAL bug (C1 above).

There are zero unit tests for:
- Stuck producing speed 0
- Slowed halving speed
- Speed CS additive bonus/penalty
- Speed CS minimum floor of 2
- Sprint +50%
- Stuck + Sprint interaction (Stuck should win)
- Slowed + Speed CS interaction
- Minimum speed floor behavior

Per Lesson 1 from the senior reviewer lessons file: "When reviewing refactoring that expands a function's behavioral scope, check whether test coverage exists for the delta." This function has been modified three times with zero test coverage. The complexity and bug history make this a HIGH issue, not a nice-to-have.

**Fix:** Add unit tests for `applyMovementModifiers` covering at minimum: Stuck=0, Slowed halving, Speed CS +6 additive, Speed CS -6 with floor of 2, Sprint +50%, and the Stuck+Sprint interaction.

### MEDIUM

#### M1: `pass` action still mutates reactive store object (unfiled from original review)

**File:** `app/composables/useEncounterActions.ts`, lines 163-167

```typescript
if (combatant.turnState) {
  combatant.turnState.hasActed = true
  combatant.turnState.standardActionUsed = true
  combatant.turnState.shiftActionUsed = true
}
```

This was flagged as M3 in code-review-077 but no follow-up ticket was created. The `combatant` is a reference into the reactive store via `findCombatant()`. The Sprint mutation (H2) was fixed, but this identical pattern for `pass` remains. This should be ticketed and fixed using a server endpoint or immutable store update, consistent with the Sprint fix pattern.

**Action:** File a ticket for this reactive mutation.

---

## What Looks Good

1. **Sprint endpoint (`sprint.post.ts`):** Clean implementation following established patterns. Uses shared service functions (`loadEncounter`, `findCombatant`, `getEntityName`). Immutable array creation via spread. Proper input validation. Move log entry with informative notes. Consistent error handling. Response shape matches breather endpoint.

2. **Sprint store method:** One-liner `$fetch` wrapper matching `takeABreather()` exactly. Minimal, correct.

3. **Sprint client integration:** The `handleExecuteAction` function now follows the same pattern as Take a Breather -- calls the store method, receives a fresh encounter object, replaces the store reference. No more direct mutation.

4. **Speed CS additive logic:** Clean implementation with proper clamping, correct `Math.floor` for rounding, and the minimum-2 floor applied only when the bonus is negative (positive CS should not be floored at 2). Well-commented with PTU page references.

5. **Stuck comment update:** The JSDoc and inline comments now correctly reference PTU 1.05 p.231 and p.253, eliminating the original misleading "movement costs double" comment.

6. **File sizes:** All files remain well under the 800-line limit. Sprint endpoint is 95 lines -- appropriately sized for a single-purpose endpoint.

---

## New Tickets Required

### NEW-TICKET: ptu-rule-067-fix-floor

**Title:** Fix Stuck speed 0 being overridden by minimum floor to 1
**Priority:** CRITICAL
**Description:** `applyMovementModifiers()` in `useGridMovement.ts` correctly sets `modifiedSpeed = 0` for Stuck, but the minimum speed floor at line 180 (`Math.max(modifiedSpeed, speed > 0 ? 1 : 0)`) restores it to 1. Additionally, Speed CS and Sprint modifiers applied after Stuck can increase a Stuck combatant's speed above 0. Fix: early return 0 when Stuck is detected, before any other modifiers are applied.

### NEW-TICKET: movement-modifier-tests

**Title:** Add unit tests for applyMovementModifiers (Stuck, Slowed, Speed CS, Sprint)
**Priority:** HIGH
**Description:** `applyMovementModifiers()` has been the source of 4 bugs across 2 review cycles with zero test coverage. Add unit tests covering: Stuck=0, Slowed halving, Speed CS additive with floor of 2, Sprint +50%, Stuck+Sprint interaction (Stuck wins), and edge cases (CS -6 on low speed, Slowed minimum 1).

### NEW-TICKET: pass-action-mutation

**Title:** Fix pass action direct mutation of reactive turnState
**Priority:** MEDIUM
**Description:** `handleExecuteAction` in `useEncounterActions.ts` directly mutates `combatant.turnState` properties for the `pass` action (lines 163-167). Same pattern as the Sprint mutation that was fixed in ptu-rule-069. Should use a server endpoint or immutable store update. Originally flagged as M3 in code-review-077 but never ticketed.

---

## Verdict

**CHANGES_REQUIRED**

Of the 7 original issues across both reviews, 6 are fully resolved. The Stuck fix (ptu-rule-067) is only partially effective -- the minimum speed floor at line 180 overrides `modifiedSpeed = 0` back to 1, and positive Speed CS / Sprint modifiers can further increase a Stuck combatant's speed. This is a CRITICAL correctness bug that must be fixed before these tickets can be closed.

The fix is straightforward: early-return 0 when Stuck is detected, bypassing all subsequent modifiers and the minimum floor. The lack of unit tests for this function (4 bugs in 2 review cycles, zero tests) should also be addressed to prevent further regressions.
