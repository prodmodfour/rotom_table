---
review_id: code-review-281
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-043
domain: capture
commits_reviewed:
  - e39c5eb8
  - d2fc3163
  - 6d493e60
  - 5657a305
files_reviewed:
  - app/composables/useCapture.ts
  - app/composables/usePlayerRequestHandlers.ts
  - app/server/api/capture/attempt.post.ts
  - .claude/skills/references/app-surface.md
  - app/types/player-sync.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-03-02T18:45:00Z
follows_up: null
---

## Review Scope

Bug-043 fix: Poke Ball accuracy check (AC 6) was not enforced -- `rollAccuracyCheck()` returned a raw d20 roll but never compared it against AC 6, so every throw automatically hit. The fix adds hit/miss logic to `rollAccuracyCheck()`, gates `handleApproveCapture` on the accuracy result, adds server-side AC 6 validation to `attempt.post.ts`, and documents the change in `app-surface.md`.

**Decree check:** decree-013 (capture domain) mandates the core 1d100 capture system. This fix is orthogonal -- it addresses the d20 accuracy check that precedes the 1d100 capture roll. The d20 accuracy check is separate from the capture roll system itself. Per decree-013, the approach is correct: the 1d100 system remains unchanged, and the AC 6 gate is a separate accuracy check per PTU p.214.

**PTU rule verification:** PTU Core p.214 states "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll." PTU p.236 states "a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit. Similarly, a roll of 20 is always a hit." The implementation correctly reflects both rules. The Natural 20 bonus of -10 to the Capture Roll is also already handled via the `criticalHit` flag (line 121 of `attempt.post.ts`: `const criticalHit = body.accuracyRoll === 20`).

## Issues

### CRITICAL

**C1: Server-side AC 6 validation is bypassable -- no input validation on `accuracyRoll`** (`app/server/api/capture/attempt.post.ts`, lines 35-49)

The server validates `if (body.accuracyRoll !== undefined)` but performs no type or range validation on the value. A malicious or buggy client can send `accuracyRoll: 20` (or any number >= 6) to always pass the gate. Since the purpose of this defense-in-depth layer is to prevent client bypass, the server MUST NOT trust the client-provided roll value.

The architectural problem: the server is re-validating a roll it did not generate. This is not true defense-in-depth -- it is security theater. The server checks `roll >= 6` on a number the client chose. A client that wants to bypass the gate simply sends `accuracyRoll: 20`.

**Required fix:** The server should generate its own accuracy roll (server-side RNG) rather than trusting the client-supplied value. The `accuracyRoll` field in the request body should be removed or repurposed as informational-only. Alternatively, if the current architecture (GM-side roll via `handleApproveCapture`) is the intended trust boundary (GM is trusted), then the server-side validation should be documented as "validates GM-generated rolls, not a security boundary" and the `accuracyRoll` field should be validated as an integer in range [1, 20]. Either approach resolves the issue, but the current implementation is misleading -- it claims defense-in-depth but provides none against a crafted request.

At minimum: validate `typeof body.accuracyRoll === 'number' && Number.isInteger(body.accuracyRoll) && body.accuracyRoll >= 1 && body.accuracyRoll <= 20` before using the value. This prevents NaN, floats, negative numbers, and values > 20 from bypassing the gate.

### HIGH

**H1: Empty catch block silently swallows action economy failure on miss path** (`app/composables/usePlayerRequestHandlers.ts`, lines 86-95)

When the ball misses, the code attempts to consume the Standard Action:

```typescript
try {
  await $fetch(`/api/encounters/${encounter.value.id}/action`, { ... })
} catch (actionError: any) {
  // Non-blocking — action economy tracking is best-effort
}
```

The empty catch means a failed action consumption is completely invisible. The GM gets no feedback that the Standard Action was not consumed. This is not "best-effort" -- it is a silent data integrity failure. The Standard Action consumption is a game rule requirement (throwing the ball IS the Standard Action). If this fails, the trainer gets a free action.

**Required fix:** Call `setHandlerError()` with a message like `'Ball missed but Standard Action could not be consumed — adjust action economy manually'`. This matches the existing pattern on the hit path (line 205 of `useCapture.ts`: `warning.value = 'Capture succeeded but standard action was not consumed...'`).

**H2: No unit tests for the AC 6 gate in `attempt.post.ts`** (`app/tests/unit/api/captureAttempt.test.ts`)

The existing test file covers ownership validation, input validation, and ball modifier integration, but has zero tests for the new AC 6 server-side validation. Given this is a correctness bug fix with defense-in-depth as a stated goal, the server-side gate needs test coverage for:
- `accuracyRoll: 1` (nat 1, should reject)
- `accuracyRoll: 3` (below AC 6, should reject)
- `accuracyRoll: 6` (exactly AC 6, should pass)
- `accuracyRoll: 20` (nat 20, should pass)
- `accuracyRoll: undefined` (no roll provided, should skip validation -- backward compat)

Per review lesson 1: behavioral changes require test coverage for the delta.

### MEDIUM

**M1: `PlayerActionAck.result` is typed as `unknown`** (`app/types/player-sync.ts`, line 66)

The ack now carries structured data including `accuracyHit: boolean`, `accuracyRoll: number`, `captured: boolean`, and `reason: string`. But `result?: unknown` means the player-side code has no type safety when reading these fields. The `lastActionAck` toast in `app/pages/player/index.vue` only displays `status` and `reason` -- it does not surface the `accuracyHit` distinction to the player.

The player sees "Request approved by GM" for both a miss (ball bounced off) and a successful capture. The `reason` field is populated on the miss path but not rendered because the toast only shows `lastActionAck.reason` when it exists, and on the miss path `status: 'accepted'` triggers the success toast class. A ball miss shows a green "Request approved by GM" toast, which is confusing UX.

**Required fix:** Either (a) type the `result` field for capture acks so the toast can distinguish miss from capture result, or (b) at minimum, set `status: 'rejected'` on a miss (the action was accepted but the ball missed -- the semantics are debatable, but the current UX is misleading). The `reason` field IS populated with the miss message, so the simplest fix is to ensure the toast always shows `reason` when present, regardless of status.

**M2: `rollAccuracyCheck` does not account for Accuracy/Evasion stage modifiers** (`app/composables/useCapture.ts`, lines 234-255)

The `total` field has a comment `// Add trainer's accuracy modifiers if needed` but simply returns the raw roll. PTU p.236 states accuracy rolls are modified by "the user's Accuracy" and by evasion. For a Poke Ball (Status Attack), the target's Speed Evasion applies, and the thrower's Accuracy combat stages apply.

The current implementation treats this as a TODO, which is acceptable for a bug fix scope (the bug was about AC 6 not being enforced at all, not about modifier accuracy). However, this should be tracked as a follow-up ticket so it is not lost. The `total` field name is misleading -- it equals `roll` but suggests it includes modifiers.

**Note:** This is a pre-existing gap, not introduced by this fix. Filing as MEDIUM because the comment acknowledges it and the fix scope is narrowly about AC 6 gating. However, this must not be forgotten -- it should become a ticket.

## What Looks Good

1. **Correct AC 6 threshold.** PTU p.214 specifies AC 6, and the implementation uses `roll >= 6`. Verified against the rulebook.

2. **Natural 1/20 handling is correct.** PTU p.236: "a roll of 1 is always a miss" and "a roll of 20 is always a hit." The ternary logic `isNat1 ? false : (isNat20 ? true : roll >= 6)` correctly prioritizes natural values over the AC threshold.

3. **Natural 20 critical capture bonus preserved.** The existing `criticalHit = body.accuracyRoll === 20` (line 121) provides the -10 capture roll bonus per PTU p.214 ("If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll"). This was already implemented and is not broken by the fix.

4. **Standard Action consumed on miss.** PTU p.214: "Poke Balls can be thrown as a Standard Action." The throw IS the action -- whether it hits or misses. The implementation correctly consumes the Standard Action on the miss path (lines 86-95). The game rule is respected.

5. **Encounter state refresh and WebSocket broadcast on miss path.** After consuming the action on miss, the code reloads encounter state and broadcasts the update (lines 98-108). This ensures the GM and Group views reflect the consumed action.

6. **Player ack distinguishes miss from capture failure.** The `accuracyHit: false` field (line 117) and descriptive `reason` strings ("Natural 1 -- ball missed!" / "Rolled X vs AC 6 -- ball missed!") give the player clear feedback.

7. **Commit granularity is correct.** Four commits, each addressing a single concern: (1) logic, (2) client gate, (3) server gate, (4) docs. Clean separation.

8. **app-surface.md update is thorough.** Documents the accuracy gate behavior, return shape, natural 1/20 rules, and which code paths enforce the gate.

9. **No regression in GM-initiated capture flow.** The `handleApproveCapture` path (the only active capture flow) correctly gates on `accuracyResult.hits` before calling `attemptCapture`. The server-side gate in `attempt.post.ts` is conditional on `body.accuracyRoll !== undefined`, so direct API calls without an accuracy roll (e.g., GM testing tools, future GM-direct capture) are unaffected.

10. **Backward compatibility maintained.** The server-side AC 6 validation only triggers when `accuracyRoll` is provided. Existing callers that do not send this field are unaffected.

## Verdict

**CHANGES_REQUIRED**

The fix correctly addresses the core bug (AC 6 not enforced) and the PTU rules are accurately implemented. However, three issues block approval:

## Required Changes

1. **C1 (CRITICAL):** Add input validation for `accuracyRoll` on the server: validate it is an integer in range [1, 20]. Without this, the server accepts arbitrary values (NaN, negative, 999) which either bypass or incorrectly fail the gate. This is the minimum fix; the broader architectural question of server-generated rolls vs client-provided rolls can be a separate ticket.

2. **H1 (HIGH):** Replace the empty catch block on the miss path's action consumption with a `setHandlerError()` call to surface the failure to the GM. Silent data loss is not acceptable for action economy tracking.

3. **H2 (HIGH):** Add unit tests for the AC 6 server-side validation in `captureAttempt.test.ts`. Cover nat 1 reject, below-AC reject, AC-6-exact pass, nat 20 pass, and undefined-skip cases.

4. **M1 (MEDIUM):** Fix the player toast UX for capture misses. At minimum, ensure the `reason` field is displayed when present, so the player sees "Rolled 3 vs AC 6 -- ball missed!" instead of just "Request approved by GM" in green.

5. **M2 (MEDIUM):** File a follow-up ticket for Accuracy/Evasion stage modifiers on Poke Ball throws. The `total` field currently equals `roll` and the TODO comment must not be lost.
