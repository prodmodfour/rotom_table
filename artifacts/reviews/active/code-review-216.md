---
review_id: code-review-216
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-038+bug-039
domain: healing+capture
commits_reviewed:
  - 68325a5
  - cef3eb4
  - 65b4c96
  - dceb7d1
  - d98c4c9
  - afd453a
  - 015fdd0
files_reviewed:
  - app/server/api/game/new-day.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/tests/unit/api/new-day.test.ts
  - app/server/api/capture/attempt.post.ts
  - app/tests/unit/api/captureAttempt.test.ts
  - app/server/api/capture/rate.post.ts
  - app/composables/useCapture.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/scene.service.ts
  - app/utils/restHealing.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - artifacts/tickets/open/bug/bug-038.md
  - artifacts/tickets/open/bug/bug-039.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-02-28T13:15:00Z
follows_up: null
---

## Review Scope

Two bug fixes from session 60, reviewed together:

1. **bug-038 (P0 CRITICAL):** Global and per-character new-day endpoints were clearing `boundAp` to 0, violating decree-016 (bound AP persists until binding effect ends) and decree-028 (bound AP persists across New Day). Fix: removed `boundAp: 0` from update data, changed `currentAp` formula to `calculateMaxAp(level) - existingBoundAp`, refactored global endpoint from batch `updateMany` (grouped by level) to per-character `update` calls within a transaction. 4 commits.

2. **bug-039 (P2 HIGH):** Capture attempt endpoint allowed capturing already-owned Pokemon, overwriting the existing `ownerId`. Fix: added ownership guard (`if (pokemon.ownerId)` -> 400 error) placed immediately after the Pokemon lookup, before any capture logic runs. 3 commits.

### Decree Compliance Verified

- **decree-016** (Extended rest clears only Drained AP, not Bound AP): Both new-day endpoints now explicitly preserve `boundAp`. Comments cite the decree. The `currentAp` formula correctly subtracts `boundAp`. COMPLIANT.
- **decree-019** (New Day is a pure counter reset): The fix correctly treats `boundAp` as a persistent effect, not a daily counter. `drainedAp`, `restMinutesToday`, `injuriesHealedToday`, and `lastRestReset` are still reset. COMPLIANT.
- **decree-028** (Bound AP persists across New Day): Direct confirmation that the bug-038 fix is the intended behavior. COMPLIANT.
- **decree-013** (Core 1d100 capture system) and **decree-015** (Real max HP for capture rate): Not affected by bug-039 changes -- the ownership guard is upstream of all capture rate logic.

### Code Path Audit Verification

The ticket claims encounter-end and scene-end `boundAp: 0` are correct. I verified:

- `encounters/[id]/end.post.ts:126-149` -- Sets `boundAp: 0` with comment citing PTU Core p.59 ("Stratagems automatically unbind when combat ends"). Uses `calculateSceneEndAp(char.level, char.drainedAp)` which passes `boundAp=0` (default) since bound AP is being cleared. **Correct.**
- `scene.service.ts:60-71` -- Sets `boundAp: 0` with comment citing same PTU rule. Scenes end stratagems the same way encounters do. **Correct.**
- `characters/[id]/extended-rest.post.ts:96-97` -- Correctly preserves `boundAp` via `currentAp: maxAp - character.boundAp`. Already had decree-016 comment. **Correct.**

No other code paths clear `boundAp` outside of the character PUT endpoint (GM manual edit), which is the intended escape hatch per decree-016.

## Issues

### HIGH-1: Per-character new-day endpoint lacks unit tests (L1 violation)

**File:** `app/server/api/characters/[id]/new-day.post.ts`

The developer fixed the same `boundAp` clearing bug in both the global endpoint (`/api/game/new-day`) and the per-character endpoint (`/api/characters/:id/new-day`) -- commit 65b4c96. However, unit tests were only written for the global endpoint (`new-day.test.ts`). The per-character endpoint has zero test coverage for the boundAp fix.

Per Senior Reviewer L1: "Verify test coverage for behavioral changes." The per-character endpoint has different code structure (single character fetch + update vs. findMany + transaction), different error handling (404 for missing character), and includes Pokemon move reset logic inline. These differences mean the global endpoint tests do not transitively cover this code path.

**Required:** Add unit tests for the per-character new-day endpoint verifying:
- `boundAp` is NOT cleared
- `currentAp` = `maxAp - character.boundAp`
- `drainedAp` is still cleared to 0
- Response includes `boundAp` in the data payload

### MEDIUM-1: No `Math.max(0, ...)` safety guard on currentAp calculation

**Files:** `app/server/api/game/new-day.post.ts:55`, `app/server/api/characters/[id]/new-day.post.ts:40`

Both endpoints compute `currentAp: calculateMaxAp(char.level) - char.boundAp` without clamping to zero. While the character PUT endpoint clamps `boundAp` to `[0, maxAp]`, there is no guarantee this invariant holds if data is manually edited in the database or if a future code path writes `boundAp` without clamping. A negative `currentAp` written to the database could cause UI rendering bugs or downstream arithmetic errors.

The `calculateAvailableAp()` utility in `restHealing.ts:232-234` already applies `Math.max(0, ...)`. The new-day endpoints should use the same defensive pattern.

**Required:** Change both lines to:
```ts
currentAp: Math.max(0, calculateMaxAp(char.level) - char.boundAp)
```

The extended-rest endpoint (line 97) has the same gap but is outside this bug fix scope. File a follow-up ticket or fix it alongside this change.

## What Looks Good

1. **Decree compliance is thorough.** Both new-day endpoints cite decree-016 in inline comments. The code path audit in the ticket correctly identifies encounter-end and scene-end `boundAp: 0` as PTU-correct behavior, and I verified this independently.

2. **Transaction pattern is correct.** The refactor from batched `updateMany` (grouped by level) to per-character `update` calls within `$transaction` is the right approach. Each character's `boundAp` is different, so batching by level no longer works. The Prisma array-of-PrismaPromise transaction pattern is used correctly.

3. **bug-039 ownership guard is clean and well-placed.** The `if (pokemon.ownerId)` check is positioned immediately after the Pokemon lookup, before the trainer lookup. This means: (a) no unnecessary DB query for the trainer, (b) no capture logic executes for owned Pokemon, (c) the error message is clear. The test verifying `humanCharacter.findUnique` was NOT called (line 155) is a smart assertion confirming the early bail.

4. **Capture rate endpoint confirmed safe.** The developer correctly identified that `/api/capture/rate` is read-only and needs no ownership guard. The composable (`useCapture.ts`) delegates enforcement to the server, which is the canonical enforcement point.

5. **Test quality is good for bug-039.** The capture attempt tests cover: owned Pokemon rejection, wild Pokemon pass-through, early bail verification (no trainer lookup), missing pokemonId, missing trainerId, and non-existent Pokemon. The test data factories (`createWildPokemon`, `createOwnedPokemon`, `createMockTrainer`) are clean and reusable.

6. **Commit granularity is appropriate.** Fix, test, and docs commits are separated. Each commit message is descriptive and references the relevant ticket/decree.

7. **Global new-day test suite covers the important scenarios.** Tests for: boundAp not cleared, currentAp formula correctness, drainedAp still cleared, multiple characters with different boundAp values, daily counter resets, and full AP when boundAp is zero.

## Verdict

**CHANGES_REQUIRED**

The bug-038 fix is logically correct and decree-compliant, but the per-character endpoint at `/api/characters/[id]/new-day.post.ts` has a behavioral change with zero test coverage (HIGH-1). Per reviewer lesson L1, behavioral changes require test verification. The `Math.max(0, ...)` guard (MEDIUM-1) is a straightforward defensive fix that should be applied while the developer is already in these files.

## Required Changes

1. **HIGH-1:** Add unit tests for `app/server/api/characters/[id]/new-day.post.ts` covering the boundAp preservation behavior. At minimum 4 test cases (boundAp not cleared, currentAp formula, drainedAp still cleared, response includes boundAp).

2. **MEDIUM-1:** Add `Math.max(0, ...)` safety clamp to the `currentAp` calculation in both `app/server/api/game/new-day.post.ts:55` and `app/server/api/characters/[id]/new-day.post.ts:40`. Optionally fix the same gap in `extended-rest.post.ts:97` or file a follow-up ticket.
