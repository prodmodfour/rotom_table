---
review_id: rules-review-235
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat
commits_reviewed:
  - daae5825
  - 16c856d0
  - 2f56e6a9
  - a6e0f9c8
  - 926892a6
  - 6f493800
  - 2b73246c
  - 4e09f724
  - 0082cca9
  - 0734d15b
  - 68485037
  - 27b733da
  - 2c36d897
  - 5e42856c
mechanics_verified:
  - hold-action
  - priority-standard
  - priority-limited
  - priority-advanced
  - interrupt-framework
  - skipNextRound-penalty
  - league-battle-integration
  - aoo-expert-combat (ptu-rule-131)
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 2
ptu_refs:
  - core/07-combat.md#p227-hold-action
  - core/07-combat.md#p228-priority-actions
  - core/07-combat.md#p228-interrupt-actions
  - core/07-combat.md#p229-pokemon-switching-interrupts
  - core/07-combat.md#p240-struggle-attack
reviewed_at: 2026-03-01T20:15:00Z
follows_up: (none -- first review)
---

## Decrees Checked

| Decree | Domain | Applicable? | Status |
|--------|--------|-------------|--------|
| decree-003 | VTT movement | No | N/A -- this implementation does not touch pathfinding or token blocking |
| decree-006 | Initiative reorder | Yes | COMPLIANT -- `checkHoldQueue` uses absolute initiative values per decree-006 precedent (hold targets are not position-based). Comment at `out-of-turn.service.ts:443` explicitly cites decree-006. |
| decree-021 | League Battle two-phase | Yes | COMPLIANT -- Hold/Priority/Interrupt integrate with the existing three-phase system. Priority declared between turns within any phase. Hold operates within a single phase (per spec D3). `resetCombatantsForNewRound` handles `skipNextRound` for both Full Contact and League. |
| decree-033 | Fainted switch on turn | No | N/A -- no switching mechanics in this implementation |
| decree-038 | Sleep/condition decoupling | No | N/A -- no condition behavior changes in this implementation |
| decree-039 | Roar vs Trapped | No | N/A -- no forced switch mechanics |

---

## Mechanics Verified

### 1. Hold Action (R040)

- **Rule:** "Combatants can choose to hold their action until a specified lower Initiative value once per round." (`core/07-combat.md#p227`)
- **Implementation:**
  - `canHoldAction()` (`out-of-turn.service.ts:352-375`) validates: not already acted, HP > 0, not already held this round, not currently holding. All four constraints are correct.
  - `applyHoldAction()` (`out-of-turn.service.ts:382-411`) sets `holdAction.holdUsedThisRound = true`, `holdAction.isHolding = true`, and `hasActed = true` (to advance past the combatant in turn progression). This is a correct design: marking `hasActed` lets `next-turn.post.ts` advance, while the hold queue tracks the deferred action.
  - `hold-action.post.ts` validates that the requesting combatant IS the current turn's combatant (line 62). Correct -- you can only hold on your own turn.
  - `releaseHeldAction()` (`out-of-turn.service.ts:417-436`) resets `hasActed = false`, grants full action economy (Standard + Shift + Swift). Correct per PTU: the held combatant gets a full turn.
  - `release-hold.post.ts` splices the combatant into `turnOrder` at `currentTurnIndex`. Correct -- the held combatant takes their turn immediately at the insertion point.
  - `checkHoldQueue()` (`out-of-turn.service.ts:446-456`) uses `currentInitiative <= entry.holdUntilInitiative`. Correct: initiative goes high-to-low, so when the current initiative drops to or below the target, the held action triggers.
  - `resetCombatantsForNewRound()` in `next-turn.post.ts:577-582` resets `holdAction` state. Correct per PTU: hold is once per round, reset at round start.
  - Hold queue cleared at round end in `next-turn.post.ts:414-416`. Correct per PTU: unheld actions at round end are lost (spec F5).
  - `null` holdUntilInitiative represents "hold indefinitely until GM manually releases." This is a reasonable extension beyond strict PTU RAW (which specifies a target initiative value), but it is a useful GM tool and does not contradict the rules.
- **Status:** CORRECT

### 2. Priority (Standard) (R046)

- **Rule:** "If the user has not already acted this turn, an action with the Priority keyword may be declared to act immediately; the user takes their full turn, ignoring initiative. This counts as their turn for the round. A priority action may not be declared during someone else's turn; it must be declared between turns." (`core/07-combat.md#p228`)
- **Implementation:**
  - `canUsePriority('standard')` (`out-of-turn.service.ts:479-506`) validates: HP > 0, `priorityUsed === false`, `hasActed === false` (for standard/limited). Also blocks if `isHolding`. All correct.
  - `applyStandardPriority()` (`out-of-turn.service.ts:514-533`) sets `priorityUsed = true`, grants full action economy (Standard + Shift + Swift), resets `hasActed = false`. Correct.
  - `priority.post.ts` case `standard` (lines 96-101): inserts combatant into `turnOrder` at `currentTurnIndex` via splice. Correct -- the combatant takes their full turn immediately.
  - PTU says "This counts as their turn for the round." The code does NOT explicitly mark the combatant's original position for skipping. After the inserted turn, when the combatant's original slot comes up, `hasActed` should be `true` (set when their inserted turn ends via `next-turn.post.ts`), which would cause normal turn-end processing. However, the combatant's ID appears TWICE in the turnOrder after the splice (once at the insertion point, once at the original position). When the original slot arrives, `currentCombatant.hasActed = true` gets set again (already true), and `actionsRemaining = 0` (already 0). This works functionally but the combatant appears twice in the initiative tracker UI, which is cosmetically confusing. Not a PTU rule violation but a UI concern.
  - "Between turns" enforcement: the store's `betweenTurns` state provides the client-side window. The server endpoint does not enforce "between turns" -- it allows Priority to be called at any time as long as the combatant hasn't acted. This is acceptable since the GM controls when to call the endpoint.
- **Status:** CORRECT (with UI concern noted above about duplicate turnOrder entry)

### 3. Priority (Limited) (R046, R047)

- **Rule:** "Priority (Limited) keyword is like Priority except the user may not take their full turn; they may only take the action that itself has Priority and take the rest of their turn on their own Initiative Count. For example, Orders are Priority (Limited), meaning the user only uses their Standard Action and does not take a full turn." (`core/07-combat.md#p228`)
- **Implementation:**
  - `applyLimitedPriority()` (`out-of-turn.service.ts:542-554`) sets `priorityUsed = true` and `turnState.standardActionUsed = true`. Does NOT insert a turn or mark `hasActed`. Correct -- the combatant uses their Standard Action now and keeps Shift + Swift for their normal initiative.
  - `priority.post.ts` case `limited` (lines 103-106): no turn insertion, no turnOrder modification. Correct.
  - On their normal turn, `turnState.standardActionUsed === true` means they can only use Shift and Swift actions. This correctly implements "take the rest of their turn on their own Initiative Count."
- **Status:** CORRECT

### 4. Priority (Advanced) (R047)

- **Rule:** "Priority (Advanced) actions don't require that the user hasn't acted that turn; if they have, they simply give up their turn on the following round." (`core/07-combat.md#p228`)
- **Implementation:**
  - `canUsePriority('advanced')` correctly only checks `priorityUsed` and NOT `hasActed`. Correct.
  - `applyAdvancedPriority()` (`out-of-turn.service.ts:562-573`) sets `priorityUsed = true` and conditionally sets `skipNextRound = true` only when `combatant.hasActed === true`. The skip-next-round penalty is correctly applied only when the combatant had already acted.
  - **ISSUE (HIGH-001):** `applyAdvancedPriority()` does NOT set `turnState.standardActionUsed = true`. Advanced Priority "work similarly to Priority (Advanced, Limited) effects" -- it should consume a Standard Action for the Priority action taken. Compare with `applyLimitedPriority()` which correctly sets `standardActionUsed = true`. Without this, a combatant who uses Advanced Priority before their turn gets a full turn later (Standard + Shift + Swift) instead of just Shift + Swift. This gives them extra actions beyond what PTU allows.
  - `resetCombatantsForNewRound()` in `next-turn.post.ts:548-560` handles `skipNextRound`: pre-marks `hasActed = true`, sets `actionsRemaining = 0`, `shiftActionsRemaining = 0`, then clears the flag. The `turnState.hasActed` is also set to `true`. Correct implementation of the next-round penalty.
- **Status:** INCORRECT -- missing `standardActionUsed = true` (HIGH-001)

### 5. Interrupt Actions (R048)

- **Rule:** "Interrupt Moves may be declared in the middle of another combatant's turn to allow the user to take an action. They work similarly to Priority (Advanced, Limited) effects in that they only allow you to take the action that has Interrupt and not a full turn." (`core/07-combat.md#p228`)
- **Implementation:**
  - `canUseInterrupt()` (`out-of-turn.service.ts:583-596`) validates: HP > 0, `interruptUsed === false`. The "once per round" enforcement is a reasonable interpretation -- PTU does not explicitly state "once per round" for Interrupts, but the Interrupt rule says "they work similarly to Priority (Advanced, Limited) effects," and Priority is implicitly once per round ("This counts as their turn for the round"). AoO explicitly says "once per round" (p.241). The design spec states "Once per round" (C1). This is an acceptable design decision.
  - `createInterruptAction()` (`out-of-turn.service.ts:602-621`) creates a pending `OutOfTurnAction` with category `'interrupt'`, status `'pending'`. Uses the same infrastructure as AoO from P0. Correct.
  - `applyInterruptUsage()` (`out-of-turn.service.ts:630-645`) sets `interruptUsed = true` and conditionally sets `skipNextRound = true` for League Battle Pokemon. The skip penalty is per spec F3 and PTU p.229: "Interrupts may still be used but consume the next Round's Pokemon turn as usual."
  - **ISSUE (HIGH-002):** The `skipNextRound` flag in `applyInterruptUsage` is set for `isLeagueBattle && combatant.type === 'pokemon'`. However, PTU p.229 says "Interrupts may still be used but consume the next Round's Pokemon turn as usual." This text is in the context of Pokemon switching in League Battles -- specifically about Pokemon that were just switched in. The question is: does the skip penalty apply to ALL League Battle Pokemon Interrupts, or only to freshly-switched Pokemon? Reading the full context on p.229: "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon. Interrupts may still be used but consume the next Round's Pokemon turn as usual." The "Interrupts" sentence refers specifically to switched-in Pokemon that cannot be commanded. It means: even though the switched Pokemon cannot take a normal turn, it CAN still use Interrupts, but doing so costs next round's turn. This penalty should apply ONLY to switched-in Pokemon that are exercising the Interrupt exception, NOT to all Pokemon in League Battles. The current implementation applies the skip to all League Battle Pokemon Interrupts, which is too broad.
  - `interrupt.post.ts` supports both direct resolution (`resolution: 'accept'/'decline'`) and pending action creation. The dual-mode design is correct for the generic framework.
- **Status:** INCORRECT -- `skipNextRound` applied too broadly (HIGH-002)

### 6. skipNextRound Penalty Lifecycle

- **Rule:** See Priority (Advanced) p.228 and Interrupt p.229 as described above.
- **Implementation:**
  - `skipNextRound` field added to `Combatant` interface in `encounter.ts:78`. Correct.
  - `resetCombatantsForNewRound()` in `next-turn.post.ts:547-583` checks `skipNextRound` before resetting. If true: `hasActed = true`, `actionsRemaining = 0`, `shiftActionsRemaining = 0`, `turnState.hasActed = true`. Then `skipNextRound = false` is always cleared. Correct lifecycle.
  - `start.post.ts:60` initializes `skipNextRound: false` on encounter start. Correct.
- **Status:** CORRECT

### 7. AoO Expert Combat Fix (ptu-rule-131)

- **Rule:** PTU p.240: "if a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5." (`core/07-combat.md#p240`)
- **Implementation:**
  - `getStruggleAttackStats()` (`out-of-turn.service.ts:673-683`) returns `{ ac: 3, setDamage: 13, isExpert: true }` for Expert+ and `{ ac: 4, setDamage: 11, isExpert: false }` for non-Expert.
  - **ISSUE (MEDIUM-001):** The `setDamage` values appear to be pre-calculated averages of the damage base dice. DB 5 = 1d8+6, average = 10.5, which rounds to 11 in set damage mode. DB 4 = 1d8+5, average = 9.5, rounds to 10 in set damage mode. However, the code uses `setDamage: 13` for Expert (DB 5) and `setDamage: 11` for non-Expert (DB 4). These values are higher than the averages. Looking at the PTU damage base table more carefully: DB 5 = 2d6+8 (avg 15), DB 4 = 1d8+6 (avg 10.5 -> 11 set). Wait, let me reconsider -- DB values map to specific dice rolls. The PTU damage base chart (p.437): DB 4 = 1d8+6 (set: 11), DB 5 = 1d8+8 (set: 13). So DB 5 set damage = 13 and DB 4 set damage = 11. Both values are correct per the set damage table.
  - `checkExpertCombatSkill()` only checks for human combatants and looks at the `skills.Combat` / `skills.combat` property. Checks for 'Expert' or 'Master' ranks. Correct per PTU skill rank progression.
- **Status:** CORRECT (MEDIUM-001 withdrawn after verifying damage base chart)

### 8. League Battle Integration (decree-021)

- **Rule:** Per decree-021: trainers declare low-to-high speed, resolve high-to-low speed. Priority/Hold/Interrupt must integrate with this three-phase system.
- **Implementation:**
  - Spec D1-D3 defines how each mechanic integrates with League Battles. The code:
    - Priority: declared between turns within any phase (betweenTurns state is phase-agnostic). Correct.
    - Hold: operates within a phase (a trainer holds during declaration, a pokemon holds during pokemon phase). Hold queue is cleared at round end. Correct per spec D3.
    - Interrupt: triggered during any combatant's turn in any phase. The `interrupt.post.ts` endpoint does not filter by phase. Correct per spec D2.
  - `resetCombatantsForNewRound` handles skipNextRound for both battle types. The function is called at all round boundaries (Full Contact and League). Correct.
- **Status:** CORRECT

### 9. WebSocket Events

- **Rule:** N/A (no PTU rule, but P1 spec requires sync events).
- **Implementation:**
  - Four new event types in `ws.ts`: `priority_declared` (line 505-510), `hold_action` (line 512-517), `hold_released` (line 519-524), `interrupt_triggered` (line 526-531). All use `broadcastToEncounter` correctly.
  - Server-side broadcasts in the endpoint files use `broadcastToEncounter` directly from the API handlers. Correct pattern (same as P0 AoO events).
  - The store's `updateFromWebSocket` method syncs `holdAction` and `skipNextRound` on combatants (lines 678-679), and `holdQueue` on the encounter (lines 649-651). Correct.
- **Status:** CORRECT

### 10. app-surface.md Update

- **ISSUE (MEDIUM-002):** The `app-surface.md` file has NOT been updated with the four new API endpoints (`hold-action.post.ts`, `release-hold.post.ts`, `priority.post.ts`, `interrupt.post.ts`) or the two new components (`HoldActionButton.vue`, `PriorityActionPanel.vue`). The app-surface.md grep returned zero matches for any P1 terms. The spec lists these as new files but the surface map was not updated.

---

## Summary

The P1 implementation of the Priority / Interrupt / Hold Action system is architecturally sound and largely correct in its PTU rule implementation. The service layer follows the established immutable pattern. The hold queue mechanic correctly uses absolute initiative values per decree-006. The Priority declaration window via `betweenTurns` state is a clean client-side solution. The Interrupt framework reuses the P0 `OutOfTurnAction` infrastructure correctly. League Battle integration respects decree-021's three-phase system.

Two HIGH issues require code changes before approval:

1. **Advanced Priority missing `standardActionUsed`**: Allows a full turn later instead of just Shift + Swift when the combatant hasn't acted yet.
2. **Interrupt `skipNextRound` applied too broadly**: The penalty should only apply to switched-in League Battle Pokemon that cannot be commanded (the specific PTU p.229 exception), not to all League Battle Pokemon using Interrupts.

---

## Rulings

1. **Hold Action `null` initiative target**: Approved as a reasonable GM tool extension. PTU specifies "a specified lower Initiative value" but supporting an indefinite hold (GM-triggered release) does not contradict this -- it simply adds flexibility for ad-hoc situations.

2. **Interrupt once-per-round**: Approved. PTU does not explicitly state this for Interrupts, but the "they work similarly to Priority (Advanced, Limited) effects" language, combined with the AoO explicit once-per-round precedent, makes this a reasonable and balanced interpretation.

3. **Priority "between turns" enforcement**: The server does not enforce the between-turns constraint; it relies on the client/GM to call the endpoint at the right time. Approved -- this is consistent with the GM-mediated design philosophy of the app.

4. **Standard Priority duplicate turnOrder entry**: After `turnOrder.splice()`, the combatant appears twice in the turn order (at the insertion point and at their original position). Functionally works because `hasActed` prevents double-acting, but the UI will show the combatant listed twice in the initiative tracker. Not a PTU rule issue -- flagging as a UI observation for future cleanup.

---

## Verdict

**CHANGES_REQUIRED**

Two HIGH-severity issues must be fixed before P1 approval.

---

## Required Changes

### HIGH-001: Advanced Priority must consume Standard Action

**File:** `app/server/services/out-of-turn.service.ts`, function `applyAdvancedPriority()` (line 562)

**Problem:** When a combatant who has NOT yet acted uses Advanced Priority, the function does not set `turnState.standardActionUsed = true`. This means when their normal initiative arrives, they get a full turn (Standard + Shift + Swift) instead of just Shift + Swift. PTU p.228 states Advanced Priority only allows "the action that has [Priority]" -- it should consume the Standard Action, same as Limited Priority.

**Fix:** Add `turnState.standardActionUsed = true` to the returned combatant, matching the pattern in `applyLimitedPriority()`:

```typescript
export function applyAdvancedPriority(combatant: Combatant): Combatant {
  const alreadyActed = combatant.hasActed
  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      priorityUsed: true
    },
    turnState: {
      ...combatant.turnState,
      standardActionUsed: true
    },
    skipNextRound: alreadyActed ? true : combatant.skipNextRound
  }
}
```

### HIGH-002: Interrupt skipNextRound scope is too broad for League Battles

**File:** `app/server/services/out-of-turn.service.ts`, function `applyInterruptUsage()` (line 630)

**Problem:** The function applies `skipNextRound = true` for ALL League Battle Pokemon Interrupts. But PTU p.229 says this penalty applies specifically to Pokemon that were switched in during a League Battle and cannot be commanded that round. The full quote: "they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round... Interrupts may still be used but consume the next Round's Pokemon turn as usual." The "Interrupts" sentence is an exception to the cannot-be-commanded rule, not a general League Battle Interrupt penalty.

**Fix:** Add a parameter to `applyInterruptUsage` indicating whether the Pokemon was switched in this round and cannot be commanded. Only apply `skipNextRound` in that specific case:

```typescript
export function applyInterruptUsage(
  combatant: Combatant,
  isLeagueBattle: boolean,
  isSwitchedInThisRound?: boolean
): Combatant {
  return {
    ...combatant,
    outOfTurnUsage: {
      ...(combatant.outOfTurnUsage ?? getDefaultOutOfTurnUsage()),
      interruptUsed: true
    },
    // Only switched-in League Battle Pokemon that can't be commanded
    // forfeit next round turn when using Interrupt (PTU p.229)
    skipNextRound: isLeagueBattle && combatant.type === 'pokemon' && isSwitchedInThisRound
      ? true
      : combatant.skipNextRound
  }
}
```

The caller in `interrupt.post.ts` should determine `isSwitchedInThisRound` by checking `combatant.turnState.canBeCommanded === false`.

### MEDIUM-002: app-surface.md not updated

**File:** `.claude/skills/references/app-surface.md`

**Problem:** Four new API endpoints and two new UI components are not listed in the app surface map.

**Fix:** Add the following entries to the appropriate sections:
- API: `POST /api/encounters/:id/hold-action`, `POST /api/encounters/:id/release-hold`, `POST /api/encounters/:id/priority`, `POST /api/encounters/:id/interrupt`
- Components: `HoldActionButton.vue`, `PriorityActionPanel.vue`
- Store state: `betweenTurns` boolean, `holdAction`/`releaseHold`/`declarePriority`/`declareInterrupt` actions
