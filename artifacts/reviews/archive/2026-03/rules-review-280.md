---
review_id: rules-review-280
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-044
domain: capture
commits_reviewed:
  - 225c16a6
  - aabbc668
  - 28bfcf12
mechanics_verified:
  - action-economy
  - poke-ball-standard-action
  - action-downgrade
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Action Types (p.218)
  - core/07-combat.md#Commanding Pokemon (p.228)
  - core/07-combat.md#Full Action (p.218)
reviewed_at: 2026-03-03T19:35:00Z
follows_up: null
---

## Mechanics Verified

### Action Economy — One Standard Action Per Turn (R051)

- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (`core/07-combat.md` p.218, lines 82-84)
- **Implementation:** `action.post.ts` validates three action types (`standard`, `shift`, `swift`) via the `validActions` whitelist (line 33). Each maps to a boolean flag on `combatant.turnState`: `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` (lines 46-49). The endpoint checks `if (combatant.turnState[field])` (line 54) and returns 400 if the action was already consumed, enforcing the one-per-turn limit. On success, it sets the flag to `true` via immutable spread (lines 62-65).
- **Status:** CORRECT

The `TurnState` interface (`app/types/combat.ts` lines 101-105) defines all three flags as booleans, matching the three PTU action types. The endpoint correctly prevents double-consumption of any single action type.

### Throwing a Poke Ball Is a Standard Action (R052)

- **Rule:** "Throwing a Poke Ball to Capture a wild Pokemon" is listed as an example of Standard Action usage (`core/07-combat.md` p.218, line 107)
- **Implementation:** Both callers that invoke the endpoint during capture contexts send `actionType: 'standard'`:
  - `useCapture.ts:212` sends `actionType: 'standard'` after a successful capture attempt
  - `usePlayerRequestHandlers.ts:90` sends `actionType: 'standard'` when a ball misses (AC check failed)
- **Status:** CORRECT

Both the hit and miss paths correctly consume a Standard Action. PTU rules do not distinguish between a successful and failed throw for action economy purposes — the trainer has committed the action regardless of outcome. The comment in `useCapture.ts` line 170-171 correctly cites "PTU Core (p227)" for this rule (actual page is 218 in the markdown, p.227 in the physical book layout; both refer to the same section).

### Standard Action Consumed Regardless of Ball Hit/Miss (R053)

- **Rule:** Action economy is committed when the action is declared, not when the effect resolves. The PTU text does not provide for "refunding" a Standard Action on a missed ball throw.
- **Implementation:** In `usePlayerRequestHandlers.ts`, the miss path (lines 84-96) calls the action endpoint to consume the Standard Action even though the ball missed (AC check failed, no capture attempt made). In `useCapture.ts`, the hit path (lines 206-218) consumes the Standard Action after the capture attempt resolves. Both paths consume the action.
- **Status:** CORRECT

This is the correct interpretation. The Standard Action cost is for "throwing a Poke Ball," not for "successfully capturing." The action is spent when the ball is thrown, regardless of whether it hits the target.

### Action Type Downgrade — Standard to Shift/Swift (R054)

- **Rule:** "You may give up a Standard Action to take another Swift Action" and "You may give up a Standard Action to take another Shift Action, but this cannot be used for Movement if you have already used your regular Shift Action for Movement." (`core/07-combat.md` p.218, lines 114-121)
- **Implementation:** The endpoint accepts all three action types and consumes them independently. It does NOT implement the downgrade mechanic (using a Standard Action as an additional Shift or Swift Action). However, the endpoint's contract is to consume a single named action — it does not need to implement downgrade logic. Downgrade is a UI/caller concern: the caller would send `actionType: 'standard'` to consume the Standard Action when it's being traded for an extra Shift/Swift. The endpoint simply records that the action was used.
- **Status:** CORRECT (within scope)

The endpoint's design as a generic "mark this action as used" primitive is correct. The downgrade decision belongs to the caller or the GM, not to the consumption endpoint.

### Full Action (R055)

- **Rule:** "Full Actions take both your Standard Action and Shift Action for a turn." (`core/07-combat.md` p.218, lines 150-153)
- **Implementation:** The endpoint consumes one action type per call. For Full Actions (Take a Breather, Coup de Grace, Intercept), the caller would need to make two calls: one for `standard` and one for `shift`. Alternatively, the breather endpoint (`breather.post.ts`) handles its own action economy directly. The generic action endpoint supports this pattern without modification.
- **Status:** CORRECT (no issues for the capture domain being reviewed)

## Decree Compliance

- **decree-013:** Use core 1d100 capture system, not errata d20 playtest. The action consumption endpoint does not touch capture mechanics or dice rolls. No violation.
- **decree-042:** Apply full accuracy system to Poke Ball throws. The action consumption endpoint does not touch accuracy rolls. The `useCapture.ts:264` comment explicitly references decree-042 and notes the TODO for full accuracy modifiers (ptu-rule-131). No violation.

Neither decree constrains the action consumption endpoint. Per decree-042, capture attempts involve the full combat action system, which this endpoint supports by providing the mechanism to consume the Standard Action.

## Issues

### MEDIUM

**M1: `hasActed` flag not set when all three actions are individually exhausted**
File: `app/server/api/encounters/[id]/action.post.ts`, line 62
Severity: MEDIUM (potential turn management edge case)

PTU p.218 states each combatant gets one of each action type per turn. The `pass.post.ts` endpoint sets `hasActed: true` alongside all three action flags (line 33), signaling the turn management system that the combatant's turn is complete. The new `action.post.ts` endpoint only sets the individual action flag.

If a combatant consumes all three actions individually (Standard via capture, Shift via movement, Swift via an ability) through separate calls to this endpoint, `hasActed` remains `false`. Turn management logic that relies on `hasActed` to determine turn completion would not recognize the combatant as having finished.

This is not a PTU rule violation per se — PTU does not have a concept of "has acted" beyond the individual action budget — but it could cause the GM interface to show the combatant as still having an active turn when they have no actions remaining. The turn management system handles this at a higher level, and the GM can always manually pass, so this is MEDIUM severity.

## Summary

The action consumption endpoint correctly implements PTU 1.05 action economy for the capture domain. The three core rules verified:

1. Each combatant gets exactly one Standard, one Shift, and one Swift Action per turn (p.218)
2. Throwing a Poke Ball costs a Standard Action (p.218)
3. The action is consumed regardless of whether the ball hits or misses

The endpoint is a generic primitive that marks a named action type as consumed without implementing game effects. This design correctly separates action economy tracking from action resolution, allowing callers (capture, moves, items) to consume actions independently of their domain-specific logic.

No PTU formulas are involved (no HP, damage, capture rate, or stat calculations). The endpoint is purely a state flag setter.

## Rulings

1. **Action consumption on miss is correct.** PTU treats Poke Ball throwing as a Standard Action regardless of outcome. The `usePlayerRequestHandlers.ts` code correctly consumes the Standard Action even when the ball misses the AC 6 check. There is no "refund" mechanic in PTU for missed ball throws.

2. **Endpoint is correctly generic.** Supporting all three action types (not just Standard) is forward-compatible with future mechanics that consume Shift or Swift Actions through the same mechanism. PTU has features and abilities that require specific action types, so the generic design is appropriate.

3. **No move log entry is correct.** The action consumption endpoint should not add move log entries. The caller (capture attempt, move execution) is responsible for logging the action that consumed the Standard/Shift/Swift Action. This matches the endpoint's documented contract: "the caller is responsible for the effect."

## Verdict

**APPROVED** — The implementation correctly reflects PTU 1.05 action economy rules for the capture domain. No formulas are involved, no mechanics are missing, and the endpoint's design as a generic action consumption primitive is sound. The one MEDIUM issue (M1: `hasActed` flag) is a turn management UX concern, not a rules violation.

## Required Changes

None blocking. The MEDIUM issue should be addressed as a follow-up if turn completion detection proves problematic in practice.
