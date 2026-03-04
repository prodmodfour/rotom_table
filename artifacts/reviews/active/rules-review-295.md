---
review_id: rules-review-295
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ux-012
domain: combat
commits_reviewed:
  - 8d5abf80
  - b343d400
  - 5e0f5aec
mechanics_verified:
  - status-tick-burn
  - status-tick-poison
  - status-tick-badly-poisoned
  - status-tick-cursed
  - status-tick-weather
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Status-Conditions
  - errata-2.md
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Burn Tick Damage
- **Rule:** "A Burned Pokemon or Trainer loses a Tick of Hit Points each time they take a Standard Action or are prevented from taking a Standard Action by an effect" (PTU p.246)
- **Implementation:** Server (`status-automation.service.ts:99-105`) fires Burn tick unconditionally (regardless of `standardActionTaken`). Payload broadcasts `condition: 'Burned'` with `damage: tick` where `tick = floor(maxHp / 10)` (minimum 1). Client handler in `useWebSocket.ts:273-281` stores the event in `lastStatusTick` reactive ref.
- **Status:** CORRECT — Burn always fires at turn end per PTU rules. Tick HP formula (`floor(maxHp / 10)`, min 1) matches PTU p.246 definition.

### Poison Tick Damage
- **Rule:** "A Poisoned Pokemon or Trainer loses a Tick of Hit Points each time they take a Standard Action or are prevented from taking a Standard Action" (PTU p.250)
- **Implementation:** Server (`status-automation.service.ts:117-123`) fires Poison tick unconditionally, with same tick formula as Burn. Badly Poisoned supersedes Poisoned (lines 108-115) with escalating damage `5 * 2^(round-1)`.
- **Status:** CORRECT — Poison fires every turn, Badly Poisoned escalation formula matches PTU p.247, supersession prevents double-tick.

### Cursed Tick Damage (decree-032)
- **Rule:** "If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points" (PTU p.247). Per decree-032: Cursed tick fires ONLY when the combatant actually uses a Standard Action, not when prevented.
- **Implementation:** Server (`status-automation.service.ts:127`) guards Cursed behind `standardActionTaken === true`. Damage is `tick * 2` (two ticks). The `standardActionTaken` flag is set from `currentCombatant.turnState?.standardActionUsed` in `next-turn.post.ts:262`.
- **Status:** CORRECT — decree-032 is respected. Cursed only fires on actual Standard Action use.

### Weather Tick Damage (Hail/Sandstorm)
- **Rule:** Weather damage is processed at start of incoming combatant's turn (PTU pp.341-342).
- **Implementation:** Server (`next-turn.post.ts:763-777`) broadcasts weather ticks as `status_tick` events with `condition: 'Hail'` or `'Sandstorm'`. Client handler stores these identically to status condition ticks.
- **Status:** CORRECT — weather ticks reuse the same event type, which is appropriate for notification purposes.

### Weather Ability Effects (Rain Dish, Ice Body, etc.)
- **Rule:** Abilities like Rain Dish heal during weather; Dry Skin damages in Sun.
- **Implementation:** Server (`next-turn.post.ts:781-792`) broadcasts ability effects as `status_tick` with negative `damage` for healing. Client handler stores these the same way.
- **Status:** CORRECT — using negative damage to indicate healing is acceptable for notification display.

## Summary

The three commits under review add client-side handling for an already-broadcasting server event. The changes are:

1. **Type addition** (`api.ts:52`): Adds `status_tick` to the `WebSocketEvent` discriminated union with payload shape `{ encounterId, combatantId, combatantName, condition, damage, newHp, fainted, formula }`. This matches the server broadcast shape exactly (`next-turn.post.ts:749-757`).

2. **Handler** (`useWebSocket.ts:273-281`): Adds `case 'status_tick'` that stores tick data in a `lastStatusTick` reactive ref. Pattern is consistent with the existing `capture_attempt` handler (lines 256-270): defensive type check, spread into ref with added `timestamp`, exposed as `readonly()`.

3. **Ticket update** (`ux-012.md`): Documents resolution with commit references.

All PTU mechanics are correctly represented in the payload. The server-side tick logic (which is NOT part of this change set but provides the data) correctly implements:
- Burn/Poison: unconditional tick at turn end
- Badly Poisoned: escalating `5 * 2^(round-1)` damage, supersedes Poisoned
- Cursed: guarded by `standardActionTaken` per decree-032
- Weather: Hail/Sandstorm damage with type immunity checks

## Rulings

No new ambiguities discovered. decree-032 (Cursed fires only on actual Standard Action) is respected in the server-side logic that generates these events. The client handler is a passive consumer and does not make tick-timing decisions.

## Verdict

**APPROVED**

The implementation correctly receives and stores status tick events. The payload contains sufficient information for meaningful notifications (combatant name, condition, damage amount, faint status, formula). The reactive ref pattern is appropriate -- it allows consuming components to watch for changes and display toasts without coupling the WebSocket handler to UI concerns.

## Medium Issues

### M1: `lastStatusTick` only stores the most recent tick event

**Severity:** MEDIUM
**File:** `app/composables/useWebSocket.ts:280`

When multiple tick damage events fire in sequence (e.g., a combatant is both Burned and Poisoned), the server broadcasts one `status_tick` per condition. The `lastStatusTick` ref will be overwritten rapidly, and a consuming component watching this ref may only see the last event. The `capture_attempt` handler has the same pattern but captures are one-per-action, so this is less of a concern there.

This is not a rules correctness issue -- all ticks are applied server-side regardless. It only affects notification display. A future enhancement could use an array or event queue. No action required for this review.

## Required Changes

None. The implementation is approved as-is.
