---
review_id: rules-review-257
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-043
domain: capture
commits_reviewed:
  - e39c5eb8
  - d2fc3163
  - 6d493e60
  - 5657a305
mechanics_verified:
  - ac-6-accuracy-check
  - natural-1-auto-miss
  - natural-20-auto-hit
  - standard-action-consumption
  - nat-20-capture-bonus
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#capturing-pokemon (p.214)
  - core/07-combat.md#accuracy (p.234-236)
  - errata-2.md (no relevant overrides)
reviewed_at: 2026-03-02T14:30:00Z
follows_up: null
---

## Decrees Checked

- **decree-013** (capture-system-version): Confirms 1d100 capture system. This fix does not change the capture roll system; it gates the accuracy check before the capture roll. No conflict. Per decree-013, the 1d100 system is confirmed correct.
- **decree-014** (stuck/slow capture bonuses): Not affected by this fix.
- **decree-015** (HP percentage base): Not affected by this fix.

No decree directly addresses AC 6 accuracy checks. No decree-need required -- the AC 6 threshold is unambiguous in PTU core.

## Mechanics Verified

### 1. AC 6 Accuracy Check Threshold

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank." (`core/05-pokemon.md`, p.214)
- **Implementation (client):** `rollAccuracyCheck()` in `app/composables/useCapture.ts:246` — `const hits = isNat1 ? false : (isNat20 ? true : roll >= 6)`. Rolls 1d20, compares against AC 6.
- **Implementation (server):** `app/server/api/capture/attempt.post.ts:35-48` — recalculates `hits` from `body.accuracyRoll` using identical logic. Rejects with 400 on miss.
- **Status:** CORRECT. AC 6 means the accuracy roll must meet or exceed 6. The implementation uses `roll >= 6` which is correct ("meet or exceed").

### 2. Natural 1 Always Misses

- **Rule:** "Note that a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit." (`core/07-combat.md`, p.236)
- **Implementation:** Both client (`useCapture.ts:246`) and server (`attempt.post.ts:37-38`) check `isNat1 = roll === 1` and force `hits = false`.
- **Status:** CORRECT. Natural 1 is checked before the AC comparison in the ternary chain.

### 3. Natural 20 Always Hits

- **Rule:** "Similarly, a roll of 20 is always a hit." (`core/07-combat.md`, p.236)
- **Implementation:** Both client (`useCapture.ts:246`) and server (`attempt.post.ts:38-39`) check `isNat20 = roll === 20` and force `hits = true`.
- **Status:** CORRECT. Natural 20 is checked after nat 1 in the ternary chain, which is the correct precedence (nat 1 cannot be nat 20 simultaneously, so order is irrelevant, but the logic is clean).

### 4. Natural 20 Capture Roll Bonus

- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll." (`core/05-pokemon.md`, p.214)
- **Implementation:** `attempt.post.ts:121` sets `const criticalHit = body.accuracyRoll === 20`. The `attemptCapture` utility (`captureRate.ts:201-203`) adds 10 to the effective capture rate when `criticalHit` is true, which is mathematically equivalent to subtracting 10 from the roll (capture succeeds when roll <= captureRate).
- **Status:** CORRECT. The `accuracyRoll` is passed from `handleApproveCapture` to `attemptCapture` to the server, preserving the nat 20 signal through the entire chain.

### 5. Standard Action Consumption on Miss

- **Rule:** "Poke Balls can be thrown as a Standard Action" (`core/05-pokemon.md`, p.214). The throw is the action; whether it hits is the result. A miss still consumes the action.
- **Implementation:** `usePlayerRequestHandlers.ts:86-96` — on miss (`!accuracyResult.hits`), the code calls `/api/encounters/{id}/action` to consume the Standard Action before returning. This happens before the early return at line 125.
- **Status:** CORRECT. The Standard Action is consumed regardless of hit/miss outcome. The action consumption is wrapped in a try/catch to be non-blocking (best-effort tracking), which is an acceptable pattern.

### 6. Defense-in-Depth: Client + Server Validation

- **Implementation:** The client validates AC 6 in `handleApproveCapture` (line 84) and gates the capture attempt. The server re-validates in `attempt.post.ts:35-48` as a defense-in-depth measure.
- **Status:** CORRECT. Both layers enforce the same logic. The server validation is conditional (`if body.accuracyRoll !== undefined`) which allows GM-initiated captures without an accuracy roll to bypass the gate. This is by design -- the GM is authoritative and may override mechanics.

### 7. Player Feedback on Miss vs Hit

- **Implementation:** The `player_action_ack` includes `accuracyHit: false` on miss (line 117) and `accuracyHit: true` on hit (line 174). The `reason` field distinguishes nat 1 auto-miss from normal misses (lines 119-121).
- **Status:** CORRECT. Players receive clear feedback distinguishing an accuracy miss from a capture failure.

### 8. No Regression in GM-Initiated Captures

- **Implementation:** The server endpoint (`attempt.post.ts`) only enforces AC 6 when `accuracyRoll` is provided. GM-initiated captures that bypass the player request flow (calling `attemptCapture` without `accuracyRoll`) are unaffected.
- **Status:** CORRECT. The optional nature of `accuracyRoll` preserves backward compatibility.

## Observations (Non-Blocking)

### Evasion and Poke Ball Throws

PTU describes evasion as modifying "the Accuracy Check" of "Moves" (p.234). Poke Ball throws are "AC6 Status Attack Roll" (p.214) but are not "Moves" -- they are item usage as a Standard Action. The implementation treats AC 6 as a flat check without applying the target's evasion, which is a reasonable interpretation. The rulebook's evasion text specifically says "Evasion helps Pokemon avoid being hit by moves" and Poke Ball throws are not moves. If the GM's table rules differ, the GM can deny the capture request or override. No decree-need required -- this is a well-understood community convention.

### Accuracy Modifiers

The `rollAccuracyCheck()` function returns `total: roll` with a comment "Add trainer's accuracy modifiers if needed." Currently, no trainer accuracy modifiers are applied to the Poke Ball throw. PTU p.236 says "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects." Since Poke Ball throws are not moves, and trainers don't have base "Accuracy" stats in the way Pokemon do, the raw d20 is appropriate. Some Features (like Ace Trainer) could modify this, but that is out of scope for this bug fix and can be addressed as a future enhancement.

## Summary

The bug-043 fix correctly implements the AC 6 accuracy gate for Poke Ball throws as specified in PTU p.214. All four commits work together to provide:

1. **Client-side accuracy logic** (e39c5eb8): `rollAccuracyCheck()` correctly implements 1d20 vs AC 6 with nat 1/nat 20 handling.
2. **GM-side gating** (d2fc3163): `handleApproveCapture` correctly gates capture attempts on accuracy, consumes the Standard Action on miss, and provides clear player feedback.
3. **Server-side validation** (6d493e60): Defense-in-depth AC 6 check prevents client bypass while preserving GM override flexibility.
4. **Documentation** (5657a305): App-surface accurately reflects the new behavior.

The implementation matches PTU RAW for all verified mechanics. No PTU incorrectness found.

## Rulings

No new rulings needed. The AC 6 threshold, nat 1/nat 20 handling, and Standard Action consumption are all unambiguous in PTU core.

## Verdict

**APPROVED** -- All mechanics are correctly implemented per PTU 1.05 core rules. No critical, high, or medium issues found.

## Required Changes

None.
