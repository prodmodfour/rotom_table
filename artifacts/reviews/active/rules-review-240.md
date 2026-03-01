---
review_id: rules-review-240
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-016
domain: combat
commits_reviewed:
  - 828ec965
  - 3c0813eb
  - d2590ee6
  - fdca3850
  - 332c6854
  - 9fa2d636
  - 13c1b3dc
  - 757b297d
  - 18c06bb5
  - e6c161a1
  - 504eb9c2
mechanics_verified:
  - hold-action
  - hold-queue-release
  - priority-standard
  - priority-limited
  - priority-advanced
  - interrupt-framework
  - interrupt-skipNextRound-scope
  - skipNextRound-penalty-lifecycle
  - aoo-expert-combat
  - league-battle-integration
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#p76-hold-action
  - core/07-combat.md#p228-priority-actions
  - core/07-combat.md#p228-interrupt-actions
  - core/07-combat.md#p229-pokemon-switching-interrupts
  - core/07-combat.md#p240-struggle-attack
reviewed_at: 2026-03-01T22:45:00Z
follows_up: rules-review-235
---

## Decrees Checked

| Decree | Domain | Applicable? | Status |
|--------|--------|-------------|--------|
| decree-006 | Initiative reorder | Yes | COMPLIANT -- `checkHoldQueue` uses absolute initiative values per decree-006. Hold queue comparison is `currentInitiative <= entry.holdUntilInitiative` which is order-independent. |
| decree-021 | League Battle two-phase | Yes | COMPLIANT -- Hold/Priority/Interrupt integrate with the three-phase system. `resetCombatantsForNewRound` handles `skipNextRound` for both Full Contact and League. Priority declared between turns within any phase. |
| decree-032 | Cursed tick on Standard Action | No | N/A -- no condition behavior changes in these commits |
| decree-033 | Fainted switch on turn | No | N/A -- no switching mechanics touched |
| decree-040 | Flanking after evasion cap | No | N/A -- no evasion mechanics touched |

---

## Previous Issues Resolution

### rules-review-235 HIGH-001: Advanced Priority must consume Standard Action

- **Original finding:** `applyAdvancedPriority()` did not set `turnState.standardActionUsed = true`, allowing a combatant who used Advanced Priority before their turn to retain their full Standard Action.
- **Fix (fdca3850):** Added `turnState: { ...combatant.turnState, standardActionUsed: true }` to `applyAdvancedPriority()` return object at `out-of-turn.service.ts:571-574`.
- **Verification:** The function now returns a combatant with `standardActionUsed: true`, matching the pattern in `applyLimitedPriority()`. When the combatant's normal initiative arrives, they will only have Shift + Swift actions available. This correctly implements PTU p.228: "Priority (Advanced) actions don't require that the user hasn't acted that turn" -- the action itself (which IS the Priority action) consumes the Standard Action.
- **Status:** RESOLVED

### rules-review-235 HIGH-002: Interrupt skipNextRound applied too broadly

- **Original finding:** `applyInterruptUsage()` applied `skipNextRound = true` for ALL League Battle Pokemon Interrupts. PTU p.229 specifies the penalty only for switched-in Pokemon that cannot be commanded.
- **Fix (9fa2d636):** The function now checks `combatant.turnState?.canBeCommanded === false` in addition to `isLeagueBattle` and `combatant.type === 'pokemon'`. The variable is named `isUncommandablePokemon` for clarity.
- **PTU rule text (p.229):** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round... Interrupts may still be used but consume the next Round's Pokemon turn as usual."
- **Verification:** The `canBeCommanded` field is set to `false` by the switching service for freshly switched-in Pokemon and reset to `true` by `resetCombatantsForNewRound` at round boundaries. The `skipUncommandablePokemon` function in `next-turn.post.ts:638-660` uses this same field to skip turns. The interrupt fix correctly narrows the penalty to the specific PTU p.229 scenario: Pokemon that were switched in this round and cannot be commanded. Regular Pokemon using Interrupts in League Battles do NOT forfeit their next turn.
- **Status:** RESOLVED

### rules-review-235 MEDIUM-002: app-surface.md not updated

- **Fix (e6c161a1):** `app-surface.md` now includes all four new API endpoints (`hold-action.post.ts`, `release-hold.post.ts`, `priority.post.ts`, `interrupt.post.ts`), both new components (`HoldActionButton.vue`, `PriorityActionPanel.vue`), the Hold/Priority/Interrupt system summary section, new store getters and actions, WebSocket events, and updated `out-of-turn.service.ts` function listing.
- **Status:** RESOLVED

---

## Mechanics Verified

### 1. Hold Action (R040) -- re-verified after fix cycle

- **Rule:** "Combatants can choose to hold their action until a specified lower Initiative value once per round." (`core/07-combat.md#p76`)
- **Implementation:** All hold mechanics remain correct from rules-review-235. The fix cycle addressed two code-review issues:
  - **Turn advancement after hold (d2590ee6):** `hold-action.post.ts:93-100` now increments `currentTurnIndex` after the hold is declared, so the next combatant becomes active immediately. This matches PTU behavior -- holding your action means your turn is deferred, so the next combatant in initiative acts. The round wrap-around check (`currentTurnIndex >= turnOrder.length` for non-League battles) is correct.
  - **Hold queue returns all matches (757b297d):** `checkHoldQueue()` now returns an `Array<{ combatantId: string }>` instead of a single entry. Multiple combatants holding until overlapping initiative values will all be flagged for release.
- **Status:** CORRECT

### 2. Priority (Standard) (R046) -- re-verified after fix cycle

- **Rule:** "If the user has not already acted this turn, an action with the Priority keyword may be declared to act immediately; the user takes their full turn, ignoring initiative. This counts as their turn for the round." (`core/07-combat.md#p228`)
- **Implementation:**
  - **Duplicate turn order entry removed (3c0813eb):** After `turnOrder.splice(currentTurnIndex, 0, combatantId)` inserts the Priority turn, the code now finds and removes the combatant's original entry: `const originalIndex = turnOrder.indexOf(combatantId, currentTurnIndex + 1)` followed by `turnOrder.splice(originalIndex, 1)`. This correctly ensures the combatant appears exactly once in the turn order at the inserted position. The search starts at `currentTurnIndex + 1` which is correct -- the just-inserted entry is at `currentTurnIndex`, so the original (shifted right by 1) is found after it.
  - **Between-turns state wired in (828ec965):** `encounter.ts:459` sets `this.betweenTurns = true` after `nextTurn()` receives the server response. The GM page renders `PriorityActionPanel` when `isBetweenTurns && encounter.isActive`. The `handlePriorityProceed` handler calls `exitBetweenTurns()` to dismiss the panel. This correctly provides the "between turns" declaration window per PTU p.228: "it must be declared between turns."
  - `applyStandardPriority()` grants full action economy (`hasActed: false`, `actionsRemaining: 2`, `shiftActionsRemaining: 1`). Correct per PTU: "the user takes their full turn."
- **Status:** CORRECT

### 3. Priority (Limited) (R046, R047) -- unchanged

- **Rule:** "Priority (Limited) keyword is like Priority except the user may not take their full turn; they may only take the action that itself has Priority and take the rest of their turn on their own Initiative Count." (`core/07-combat.md#p228`)
- **Implementation:** `applyLimitedPriority()` sets `priorityUsed = true` and `standardActionUsed = true`. No turn insertion. At normal initiative, the combatant has only Shift + Swift available. Correct.
- **Status:** CORRECT

### 4. Priority (Advanced) (R047) -- re-verified after fix cycle

- **Rule:** "Priority (Advanced) actions don't require that the user hasn't acted that turn; if they have, they simply give up their turn on the following round." (`core/07-combat.md#p228`)
- **Implementation:**
  - `canUsePriority('advanced')` correctly only checks `priorityUsed` and NOT `hasActed`. Correct.
  - `applyAdvancedPriority()` now sets `standardActionUsed = true` (fix fdca3850). This consumes the Standard Action for the Priority action taken.
  - `skipNextRound` is conditionally set only when `combatant.hasActed === true`. Correct -- the penalty applies only if the user has already acted.
  - The `resetCombatantsForNewRound()` function correctly handles `skipNextRound`: pre-marks `hasActed = true`, sets `actionsRemaining = 0`, `shiftActionsRemaining = 0`, and `turnState.hasActed = true`. Then clears the flag. Correct lifecycle.
- **PTU analysis:** PTU says Advanced Priority actions "don't require that the user hasn't acted that turn." This implies: (a) if they haven't acted yet, they take the Priority action (consuming their Standard Action) and get Shift + Swift on their normal turn; (b) if they have acted, they take the Priority action but "give up their turn on the following round." The code correctly handles both branches.
- **Status:** CORRECT

### 5. Interrupt Actions (R048) -- re-verified after fix cycle

- **Rule:** "Interrupt Moves may be declared in the middle of another combatant's turn to allow the user to take an action. They work similarly to Priority (Advanced, Limited) effects in that they only allow you to take the action that has Interrupt and not a full turn." (`core/07-combat.md#p228`)
- **Implementation:**
  - `canUseInterrupt()` checks HP > 0 and `interruptUsed === false`. Once-per-round enforcement is a reasonable interpretation (see ruling #2 from rules-review-235, still valid).
  - **Decline before eligibility (13c1b3dc):** The interrupt endpoint now handles `resolution === 'decline'` before the eligibility check. Declining an interrupt is purely an acknowledgment and should not require eligibility validation. This is correct -- a GM should always be able to decline.
  - **skipNextRound narrowed (9fa2d636):** See HIGH-002 resolution above. The penalty now only applies to uncommandable Pokemon in League Battles, matching PTU p.229.
  - The Interrupt framework correctly creates pending `OutOfTurnAction` objects for GM resolution, consistent with the AoO pattern from P0.
- **Status:** CORRECT

### 6. skipNextRound Penalty Lifecycle -- re-verified

- **Rule:** PTU p.228 (Advanced Priority) and PTU p.229 (Interrupt for switched-in Pokemon).
- **Implementation:**
  - `skipNextRound` is set by `applyAdvancedPriority()` (when `hasActed === true`) and by `applyInterruptUsage()` (when `isUncommandablePokemon === true`).
  - `resetCombatantsForNewRound()` at `next-turn.post.ts:544-581` checks `c.skipNextRound === true`. If true: `hasActed = true`, `actionsRemaining = 0`, `shiftActionsRemaining = 0`, `turnState.hasActed = true` (shouldSkip). Then `skipNextRound = false` is always cleared. Correct.
  - `start.post.ts` initializes `skipNextRound: false`. Correct.
- **Status:** CORRECT

### 7. AoO Expert Combat (ptu-rule-131) -- unchanged from rules-review-235

- **Rule:** PTU p.240: "if a Trainer or Pokemon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
- **Implementation:** `getStruggleAttackStats()` returns `{ ac: 3, setDamage: 13, isExpert: true }` for Expert+ (DB 5 set damage = 13) and `{ ac: 4, setDamage: 11, isExpert: false }` for non-Expert (DB 4 set damage = 11). Both values are correct per the PTU damage base chart.
- **Status:** CORRECT

### 8. League Battle Integration (decree-021) -- re-verified

- **Rule:** Per decree-021: three-phase system (declaration, resolution, pokemon).
- **Implementation:**
  - Priority: declared between turns via `betweenTurns` state. Phase-agnostic, which is acceptable for P1.
  - Hold: operates within the current phase. Turn advancement in `hold-action.post.ts` correctly handles round wrap-around for Full Contact battles. For League Battles (`battleType === 'trainer'`), the wrap-around is not applied (`record.battleType !== 'trainer'` check at line 98), which is correct because League Battle phase transitions are handled by `next-turn.post.ts`.
  - Interrupt: triggered during any combatant's turn. The narrowed `skipNextRound` correctly uses `canBeCommanded` to identify switched-in Pokemon per PTU p.229.
  - `resetCombatantsForNewRound` handles `skipNextRound` for both battle types. `canBeCommanded` is reset to `true` for the new round.
- **Status:** CORRECT

### 9. Priority Eligible Combatants Getter (MED-005 fix)

- **Implementation (18c06bb5):** The `priorityEligibleCombatants` getter in the encounter store filters combatants by: alive (HP > 0), not already used Priority (`priorityUsed === false`), and not holding an action (`isHolding === false`). `PriorityActionPanel.vue` now uses this store getter instead of a local filter.
- **PTU correctness:** The filter conditions are correct per PTU p.228. All three conditions are necessary prerequisites for any Priority variant. The Standard/Limited vs Advanced distinction (`hasActed` check) is correctly left to the buttons -- the panel shows all potentially eligible combatants, and the server-side `canUsePriority()` validates the specific variant.
- **Status:** CORRECT

---

## New Issues Introduced by Fix Cycle

### MEDIUM-001: Hold action turn advancement skips next-turn validation chain

**File:** `app/server/api/encounters/[id]/hold-action.post.ts` (lines 93-100)

The hold action endpoint advances the turn by simply incrementing `currentTurnIndex + 1`. This bypasses the full validation chain in `next-turn.post.ts` which handles:
- Skipping fainted trainers during declaration phase
- Skipping undeclared trainers during resolution phase
- Skipping uncommandable Pokemon during pokemon phase
- Hold queue check (hold within a hold scenario)
- Tick damage processing
- Weather decrement at round boundaries

If the combatant after the holding combatant is fainted, uncommandable, or otherwise should be skipped, the hold action will leave them as the "current" combatant. The GM would need to manually call `nextTurn` to skip past them.

This is a MEDIUM (not HIGH) because: (a) the GM can always call `nextTurn` to advance past such edge cases, (b) the alternative of duplicating the full turn progression logic in hold-action.post.ts would be significantly more complex and violate SRP, and (c) the PTU rules say "hold their action until a specified lower Initiative value" -- the mechanic is about deferral, not about replacing the turn system. The simple increment correctly moves past the holding combatant; edge cases around the NEXT combatant are handled by the existing `nextTurn` flow.

**Recommendation:** Accept for P1. If this edge case causes real gameplay friction, extract the "skip ineligible combatants" logic into a shared utility for P2.

---

## Summary

All 11 fix cycle commits correctly address the issues identified in rules-review-235 and code-review-259. The two HIGH issues from rules-review-235 are fully resolved:

1. **Advanced Priority Standard Action consumption (HIGH-001):** `applyAdvancedPriority()` now sets `standardActionUsed = true`, ensuring the combatant only has Shift + Swift at their normal initiative. This matches the PTU p.228 semantics that the Priority action consumes the Standard Action.

2. **Interrupt skipNextRound scope (HIGH-002):** `applyInterruptUsage()` now checks `combatant.turnState?.canBeCommanded === false` to narrow the penalty to switched-in Pokemon that cannot be commanded, exactly matching PTU p.229. Regular Pokemon using Interrupts in League Battles correctly retain their next round turn.

The code-review fixes (CRIT-001: betweenTurns wiring, CRIT-002: duplicate turn order removal, HIGH-001: holdReleaseTriggered return, HIGH-002: hold turn advancement, HIGH-004: unused import, MED-003: decline before eligibility, MED-004: checkHoldQueue returns all, MED-005: Priority getter) do not introduce any PTU rules violations. Each fix either corrects a plumbing/wiring issue or improves code quality without changing game mechanics.

One new MEDIUM issue identified (hold action turn advancement skips validation chain), which is acceptable for P1 given the GM's ability to manually advance turns.

---

## Rulings

All rulings from rules-review-235 remain in effect:

1. **Hold Action `null` initiative target:** Approved. Reasonable GM tool extension.
2. **Interrupt once-per-round:** Approved. Consistent with Priority/AoO patterns.
3. **Priority "between turns" enforcement:** Server-side GM-mediated. Approved.
4. **Standard Priority duplicate turn order (RESOLVED):** The duplicate entry is now correctly removed by the fix at `priority.post.ts:100-105`. No longer an issue.

---

## Verdict

**APPROVED**

All mechanics are correctly implemented per PTU 1.05 rules. The two HIGH issues from rules-review-235 are resolved. No new CRITICAL or HIGH issues were introduced by the fix cycle. P1 is ready for P2 development.

---

## Required Changes

None blocking. One MEDIUM observation for future consideration:

| Priority | Issue | File | Recommendation |
|----------|-------|------|----------------|
| MEDIUM | MED-001 | hold-action.post.ts | Hold turn advancement skips fainted/uncommandable auto-skip logic. Accept for P1; extract shared skip utility if it causes gameplay friction in P2. |
