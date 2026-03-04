---
review_id: rules-review-259
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-043
domain: capture
commits_reviewed:
  - b778ad1d
  - 8b984bd7
  - e8d6d344
  - a395141e
  - cbaebeb5
  - 6a10e705
mechanics_verified:
  - poke-ball-accuracy-gate-ac6
  - natural-1-auto-miss
  - natural-20-auto-hit-crit
  - server-side-ac6-validation
  - capture-miss-action-economy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#capture-rate (p.214)
  - core/07-combat.md#accuracy-checks
reviewed_at: 2026-03-03T01:15:00Z
follows_up: rules-review-257
---

## Re-Review Scope

This is a re-review of the bug-043 fix cycle (6 commits), verifying that all 5 issues raised in code-review-281 (1C + 2H + 2M) have been resolved. The original rules review (rules-review-257) already APPROVED the core AC 6 gate mechanic. This review verifies the fix cycle changes maintain PTU rule correctness and introduce no new game logic issues.

## Applicable Decrees

- **decree-013** (active): Use core 1d100 capture system, not errata d20 playtest. The capture system remains 1d100 throughout. COMPLIANT.
- **decree-042** (active): Apply full accuracy system to Poke Ball throws (thrower accuracy stages, target Speed Evasion, flanking, rough terrain). The fix cycle correctly documents this as a deferred enhancement (ptu-rule-131) rather than implementing it incompletely. COMPLIANT -- the gap is acknowledged and tracked, not silently ignored.

## Mechanics Verified

### 1. Poke Ball AC 6 Accuracy Gate (Server-Side Validation)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll" (`core/05-pokemon.md` p.214, line 1705)
- **Implementation:** `attempt.post.ts` lines 35-59 validate the `accuracyRoll` parameter: rejects non-number, non-integer, out-of-range (< 1 or > 20) with 400. Then applies AC 6 logic: natural 1 always misses, natural 20 always hits, otherwise `roll >= 6` required. On miss, throws 400 with descriptive message preventing capture logic from executing.
- **Status:** CORRECT. The server-side validation closes the C1 bypass vector. Type checking (`typeof !== 'number'`, `!Number.isInteger()`) correctly handles edge cases: NaN (fails isInteger), null (fails typeof), strings (fails typeof), Infinity (fails isInteger), floats (fails isInteger). Range check (1-20) matches the d20 domain.

### 2. Natural 1 Auto-Miss

- **Rule:** PTU general accuracy rules: natural 1 on an attack roll always misses regardless of modifiers.
- **Implementation:** `isNat1 = roll === 1`, `hits = isNat1 ? false : ...` in both client (`useCapture.ts` line 252) and server (`attempt.post.ts` line 49).
- **Status:** CORRECT. Natural 1 is handled before the AC 6 threshold check, ensuring it always misses even if future modifiers would push it above 6.

### 3. Natural 20 Auto-Hit + Critical

- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll." (`core/05-pokemon.md` p.214, line 1710)
- **Implementation:** `isNat20 = roll === 20`, `hits = ... isNat20 ? true : ...` ensures nat 20 always hits. `criticalHit = body.accuracyRoll === 20` at line 131 passes the crit flag to `attemptCapture()` for the -10 capture roll bonus.
- **Status:** CORRECT. Natural 20 bypasses AC 6 and grants the capture roll bonus per PTU rules.

### 4. Capture Miss Action Economy

- **Rule:** "Poke Balls can be thrown as a Standard Action" (`core/05-pokemon.md` p.214, line 1704). A miss still consumes the Standard Action -- the action is the throw, not the capture.
- **Implementation:** `usePlayerRequestHandlers.ts` lines 86-95: on miss path, the Standard Action is consumed via `/api/encounters/{id}/action` POST before sending the miss ack. The catch block (line 94) now calls `setHandlerError()` instead of being empty.
- **Status:** CORRECT. Action economy is properly consumed on miss, and the GM is notified if consumption fails (H1 fix). The error message ("Ball missed but Standard Action could not be consumed -- adjust action economy manually") gives the GM actionable information.

### 5. Accuracy Modifier Gap Documentation (decree-042)

- **Rule:** Per decree-042, Poke Ball throws use the full accuracy system including thrower accuracy stages and target Speed Evasion.
- **Implementation:** `useCapture.ts` lines 235-238 add JSDoc documenting that the current implementation rolls a flat d20 without modifiers. Lines 251 and 259 add `TODO(ptu-rule-131)` markers for future implementation. The gap is tracked as ticket ptu-rule-131.
- **Status:** CORRECT as a deferred enhancement. The M2 issue from code-review-281 asked for documentation of this gap, not implementation. decree-042 is properly cited. The flat d20 approach is the conservative baseline -- it does not produce incorrect results for the common case (zero accuracy stages, zero evasion), and the TODO markers ensure the full system will be implemented.

## Issue Resolution Verification

### C1: Server-side AC 6 validation bypassable (RESOLVED)

**Original issue:** `accuracyRoll` from client had no type/range validation -- a malicious client could send `accuracyRoll: "20"` or `accuracyRoll: 999` to bypass the gate.

**Fix (b778ad1d):** Added type guard at `attempt.post.ts` lines 36-44 checking `typeof`, `Number.isInteger()`, and range [1, 20]. Rejects with 400 on invalid input.

**Verification:** The validation chain is: (1) `typeof !== 'number'` catches strings, null, objects, undefined-that-somehow-passes; (2) `!Number.isInteger()` catches NaN, Infinity, floats; (3) `< 1 || > 20` catches out-of-range integers. This is a complete guard for the d20 domain. The check runs before any DB queries, so invalid input cannot reach the AC 6 logic. RESOLVED.

### H1: Empty catch block silently swallows action economy failure (RESOLVED)

**Original issue:** On the miss path in `usePlayerRequestHandlers.ts`, the catch block for action economy consumption was empty (`// Non-blocking`), meaning the GM would never know if the Standard Action was not consumed.

**Fix (8b984bd7):** Replaced empty catch with `setHandlerError('Ball missed but Standard Action could not be consumed -- adjust action economy manually')`.

**Verification:** `setHandlerError()` (defined at line 39) sets `handlerError` ref with 8-second auto-clear, and logs via `console.error`. The GM sees the error and can manually adjust. The error is non-blocking (the miss ack still sends to the player). RESOLVED.

### H2: No unit tests for AC 6 gate (RESOLVED)

**Original issue:** No test coverage for the server-side AC 6 accuracy gate in `attempt.post.ts`.

**Fix (e8d6d344):** Added 5 tests in `captureAttempt.test.ts` lines 268-366:
1. `accuracyRoll=1` -- natural 1 auto-miss (rejects with correct message)
2. `accuracyRoll=3` -- below AC 6 (rejects with correct message)
3. `accuracyRoll=6` -- exact AC 6 threshold (passes, capture succeeds)
4. `accuracyRoll=20` -- natural 20 auto-hit (passes, criticalHit=true)
5. `accuracyRoll=undefined` -- backward compatibility (passes, no AC check)

**Verification:** Tests cover the critical boundary values: nat 1, below-threshold, exact-threshold, nat 20, and the undefined case for backward compat. The tests correctly mock Prisma and import the handler directly, matching the established test patterns. Note: The C1 type validation (non-integer, non-number, out-of-range) is not directly tested -- this is a minor gap but does not affect PTU rule correctness. RESOLVED.

### M1: PlayerActionAck.result typed as unknown (RESOLVED)

**Original issue:** `result` was typed as `unknown`, causing capture miss acks to display as green "Request approved" toast instead of the miss reason.

**Fix (a395141e):**
- `player-sync.ts`: Added `CaptureAckResult` interface (lines 62-69) with `accuracyRoll`, `accuracyHit`, `captured`, `captureRate?`, `roll?`, `reason?`. Typed `PlayerActionAck.result` as `CaptureAckResult | Record<string, unknown>`.
- `player/index.vue`: Added `isCaptureAckMiss` computed (lines 205-210) checking `accuracyHit === false`. Toast class switches to `player-toast--error` on miss. Message shows the miss reason ("Rolled X vs AC 6 -- ball missed!") instead of generic "Request approved".

**Verification:** The player now sees a red error toast with the specific miss reason. The `accuracyHit === false` check is correct -- it only triggers when the ack has `status: 'accepted'` AND a result with `accuracyHit` explicitly false, avoiding false positives for other action types. RESOLVED.

### M2: rollAccuracyCheck doesn't account for accuracy/evasion stage modifiers (RESOLVED as DOCUMENTED)

**Original issue:** Pre-existing gap: `rollAccuracyCheck()` rolls flat d20 without accuracy stages or evasion modifiers.

**Fix (cbaebeb5):** Added JSDoc documentation citing decree-042 and ptu-rule-131. Added TODO markers at the hits calculation and total return value.

**Verification:** Per decree-042, this gap requires implementation of the full accuracy system. The fix correctly defers this to ptu-rule-131 rather than implementing a partial solution. The documentation accurately describes what is missing and why. RESOLVED as documented deferral.

## New Issues Introduced

None. The fix cycle is narrowly scoped to the 5 identified issues and introduces no new game logic. Specifically:

- The AC 6 threshold (>= 6) is unchanged from the original fix and matches PTU p.214.
- The capture roll logic (1d100 system) is untouched, per decree-013.
- The `criticalHit` flag continues to correctly use `body.accuracyRoll === 20` (not the validated `roll` variable, but since `roll = body.accuracyRoll` after validation, they are equivalent at this point in the code).
- The `attemptCapture()` composable method continues to pass `accuracyRoll` to the server, which re-validates it -- defense in depth is maintained.
- The backward compatibility path (`accuracyRoll: undefined`) correctly skips AC 6 validation, allowing existing GM-initiated captures (which may not use the accuracy gate) to continue functioning.

## Summary

All 5 issues from code-review-281 have been resolved correctly. The fix cycle maintains PTU rule correctness for the AC 6 accuracy gate on Poke Ball throws. The implementation correctly handles natural 1 (auto-miss), natural 20 (auto-hit + crit), the AC 6 threshold, and edge cases in server-side input validation. The decree-042 accuracy modifier gap is properly documented and tracked for future implementation.

## Verdict

**APPROVED** -- all code-review-281 issues resolved, no new game logic issues introduced, decrees decree-013 and decree-042 respected.
