---
review_id: rules-review-298
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ux-012
domain: websocket
commits_reviewed:
  - 06313ff4
  - b343d400
  - 8d5abf80
mechanics_verified:
  - status-tick-damage-broadcast
  - status-tick-client-handling
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Status Conditions (Burn, Poison, Badly Poisoned, Cursed)
reviewed_at: 2026-03-04T13:30:00Z
follows_up: rules-review-N/A
---

## Mechanics Verified

### Status Tick Damage Broadcast Fidelity

- **Rule:** "At the end of each of their turns, a Burned Pokemon or Trainer that took a Standard Action or was prevented from doing so... loses a Tick of Hit Points" (PTU 1.05 p.246). "If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points" (PTU 1.05 p.247). Per decree-032: Cursed tick fires only on actual Standard Action use.
- **Implementation:** The server (`next-turn.post.ts` lines 746-759) broadcasts each tick result individually via `broadcastToEncounter()` with all 8 fields: `encounterId`, `combatantId`, `combatantName`, `condition`, `damage`, `newHp`, `fainted`, `formula`. The tick-firing logic itself (lines 261-305) correctly gates Cursed on `standardActionTaken` while letting Burn/Poison fire unconditionally, respecting decree-032. Weather ticks (Hail/Sandstorm) and weather ability damage (Solar Power, Dry Skin) also broadcast via the same `status_tick` event type (lines 762-794). This code is pre-existing and not modified by the reviewed commits.
- **Status:** CORRECT

### Client Queue Pattern for Burst Tick Events

- **Rule:** Multiple tick conditions can exist simultaneously on one combatant (e.g., Burn + Poison, per PTU p.246-247). The server fires each as a separate WebSocket event in sequence.
- **Implementation:** Commit 06313ff4 replaced the single `lastStatusTick` ref with an array-based `statusTickQueue` (line 54). The handler at line 278-289 pushes each incoming event onto the array using immutable spread: `statusTickQueue.value = [...statusTickQueue.value, { ...d, timestamp: Date.now() }]`. This preserves all tick events from a turn cycle without overwriting. The `clearStatusTickQueue()` function (line 356-358) resets the array to empty, exposed publicly for UI consumption. The queue ref is returned as `readonly(statusTickQueue)` (line 397), maintaining immutability for consumers.
- **Status:** CORRECT

### Broadcast Field Completeness

- **Rule:** The server broadcasts 8 fields per tick event. The client handler must preserve all fields for downstream use (combatantId for Player View filtering per ux-012 requirements, formula for GM tooltip display).
- **Implementation:** The `WebSocketEvent` type union in `api.ts` line 52 declares all 8 fields: `encounterId`, `combatantId`, `combatantName`, `condition`, `damage`, `newHp`, `fainted`, `formula`. The handler cast at lines 282-286 matches all 8 fields exactly. The queue item type (lines 54-64) includes all 8 server fields plus the client-added `timestamp`. No fields are dropped.
- **Status:** CORRECT

## Decree Compliance

- **decree-032 (Cursed tick on Standard Action only):** Not affected. The client handler treats all incoming `status_tick` events uniformly. The gating logic for Cursed is entirely server-side in `getTickDamageEntries()` which checks `standardActionTaken` before including Cursed in the tick entries. The fix commits do not modify server-side tick logic.
- **decree-005 (Status CS auto-apply with source tracking):** Not affected. CS stage changes from status conditions are applied server-side when statuses are added/removed. The `status_tick` events are damage notifications only; they do not add or remove status conditions (faint handling is done server-side before broadcast).

## Fix Cycle Verification

### C1 (CRITICAL) from code-review-322: Single ref overwrites on burst ticks

**RESOLVED.** The `lastStatusTick` single ref has been replaced with `statusTickQueue` array ref. The immutable spread pattern `[...statusTickQueue.value, { ...d, timestamp: Date.now() }]` correctly accumulates all events. When a combatant has Burn + Poison, both tick events are preserved in order. When weather ticks fire for multiple combatants, all are queued. The `clearStatusTickQueue()` function provides a clean consumption mechanism.

### M1 (MEDIUM) from code-review-322: Missing combatantId and formula

**RESOLVED.** The handler cast now includes all 8 server fields: `encounterId`, `combatantId`, `combatantName`, `condition`, `damage`, `newHp`, `fainted`, `formula`. The queue item type declaration at lines 54-64 includes `encounterId: string`, `combatantId: string`, and `formula: string` alongside the original fields.

### M2 (MEDIUM) from code-review-322: Wrong commit hashes in resolution log

**RESOLVED.** Commit 7dabfef6 corrected the hashes from `faff273e`/`e672db94` to the actual commits `8d5abf80`/`b343d400`.

## Summary

This is a client-side display handler for status tick damage notifications. The fix cycle correctly addresses all three issues from code-review-322. The queue pattern handles burst tick events (multiple conditions on one combatant, or ticks on multiple combatants). All server broadcast fields are preserved in the client-side type and handler. No game logic is modified -- tick-firing rules (including decree-032 Cursed gating and decree-005 CS tracking) remain entirely server-side and are not touched by these commits. The `readonly()` wrapper and `clearStatusTickQueue()` function provide a clean consumption API.

## Rulings

No new rulings required. No new ambiguities discovered. Existing decree compliance confirmed.

## Verdict

**APPROVED** -- All three issues from code-review-322 are resolved. No PTU rule violations found. Decree-032 and decree-005 compliance verified (neither is affected by client-side display changes).

## Required Changes

None.
