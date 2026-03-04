---
review_id: code-review-292
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-038+bug-039
domain: healing+capture
commits_reviewed:
  - 3d6a238c
  - 80b5d9be
  - e4178d6a
files_reviewed:
  - app/server/api/game/new-day.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/tests/unit/api/new-day.test.ts
  - app/tests/unit/api/character-new-day.test.ts
  - app/server/api/capture/attempt.post.ts
  - app/tests/unit/api/captureAttempt.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T21:45:00Z
follows_up: code-review-216
---

## Review Scope

Re-review of fix cycle for code-review-216 (CHANGES_REQUIRED, 0C/1H/1M). Two issues were raised:

- **HIGH-1:** Per-character new-day endpoint (`/api/characters/[id]/new-day.post.ts`) lacked unit tests for the boundAp fix. Required 4 test cases minimum.
- **MEDIUM-1:** `Math.max(0, ...)` safety guard missing from `currentAp` calculation in both new-day endpoints and optionally `extended-rest.post.ts`.

Three fix commits reviewed:
1. `3d6a238c` — Applied `Math.max(0, ...)` clamp to all three endpoints (global new-day, per-character new-day, extended-rest).
2. `80b5d9be` — Added 9 unit tests for per-character new-day endpoint in new file `character-new-day.test.ts`, plus 1 clamping test added to the existing global new-day test suite.
3. `e4178d6a` — Documentation update to bug-038 ticket with fix cycle resolution log.

Rules review (rules-review-196) already APPROVED the fix cycle. This re-review covers code quality only.

### Decree Compliance (unchanged from code-review-216)

- **decree-016** (Extended rest clears only Drained AP, not Bound AP): All three endpoints preserve `boundAp`. Inline comments cite the decree. COMPLIANT.
- **decree-019** (New Day is a pure counter reset): `drainedAp`, `restMinutesToday`, `injuriesHealedToday` are reset; `boundAp` is not. COMPLIANT.
- **decree-028** (Bound AP persists across New Day): Confirmed by the `not.toHaveProperty('boundAp')` assertions in both test suites. COMPLIANT.

## Issues

No issues found. Both HIGH-1 and MEDIUM-1 from code-review-216 are fully resolved.

## Verification of HIGH-1 Resolution

The new file `app/tests/unit/api/character-new-day.test.ts` (266 lines) provides 9 test cases across 4 `describe` blocks:

**boundAp preservation (decree-016, decree-028)** — 4 tests:
1. `does NOT clear boundAp on new day` — Asserts `updateCall.data` does NOT have `boundAp` property. Confirms the update payload omits `boundAp` entirely rather than setting it to any value. Correct.
2. `calculates currentAp as maxAp minus existing boundAp` — Level 10, boundAp 2 produces `currentAp = 7 - 2 = 5`. Verified against `calculateMaxAp(10)` which returns `5 + floor(10/5) = 7`. Correct.
3. `clamps currentAp to zero when boundAp exceeds maxAp` — Level 1 (maxAp=5), boundAp=8 produces `currentAp = 0` (not -3). Directly tests the `Math.max(0, ...)` guard. Correct.
4. `sets currentAp to full maxAp when boundAp is zero` — Level 15, boundAp 0 produces `currentAp = 8`. Covers the normal case. Correct.

**daily counter reset (decree-019)** — 2 tests:
5. `clears drainedAp to zero` — Confirms `drainedAp: 0` in update data.
6. `resets restMinutesToday and injuriesHealedToday` — Confirms both counters reset and `lastRestReset` is a Date instance.

**response payload** — 2 tests:
7. `includes boundAp in data payload` — Verifies `result.data.boundAp`, `result.data.drainedAp`, and `result.data.currentAp` are all present and correct.
8. `includes pokemonReset count` — Verifies Pokemon move reset loop executes for all pokemon and count is returned.

**error handling** — 2 tests:
9. `returns 400 when character ID is missing` + `returns 404 when character does not exist`.

The required 4 test cases from code-review-216 (boundAp not cleared, currentAp formula, drainedAp still cleared, response includes boundAp) map directly to tests 1, 2, 5, and 7. All present.

Additionally, the global new-day test suite (`new-day.test.ts`) gained a clamping test at line 146 (`clamps currentAp to zero when boundAp exceeds maxAp`) that mirrors the per-character test. This provides symmetric coverage across both code paths.

## Verification of MEDIUM-1 Resolution

Commit `3d6a238c` applied `Math.max(0, ...)` to all three endpoints:

| File | Line | Before | After |
|------|------|--------|-------|
| `game/new-day.post.ts` | 55 | `calculateMaxAp(char.level) - char.boundAp` | `Math.max(0, calculateMaxAp(char.level) - char.boundAp)` |
| `characters/[id]/new-day.post.ts` | 40 | `maxAp - character.boundAp` | `Math.max(0, maxAp - character.boundAp)` |
| `characters/[id]/extended-rest.post.ts` | 97 | `maxAp - character.boundAp` | `Math.max(0, maxAp - character.boundAp)` |

The previous review noted that `extended-rest.post.ts` was "outside this bug fix scope" but suggested fixing it alongside or filing a follow-up ticket. The developer chose to fix it in the same commit, which is the right call -- it's the same one-line pattern applied to the same formula, and leaving it unfixed would have been a known defect.

The `Math.max(0, ...)` pattern matches the existing `calculateAvailableAp()` in `restHealing.ts:235-236`, which also uses `Math.max(0, maxAp - boundAp - drainedAp)`. Consistent.

## What Looks Good

1. **Test structure mirrors the established pattern.** The new `character-new-day.test.ts` follows the same mock setup approach as `new-day.test.ts` (mock Prisma, stub H3 globals, import handler after mocks, factory helper for test data). The `createCharacter` factory includes all fields the handler touches (`pokemon`, `restMinutesToday`, `injuriesHealedToday`, `lastRestReset`, AP fields), making test setup explicit and readable.

2. **Test assertions verify the write path, not just the return value.** Tests inspect `mockPrisma.humanCharacter.update.mock.calls[0][0].data` to verify what was sent to the database, not just what the endpoint returned. This catches the actual bug class (wrong data written to DB) rather than just testing response formatting.

3. **Clamping test uses an extreme value.** Setting `boundAp = maxAp + 3` (8 vs 5) ensures the `Math.max` guard is exercised with a clearly negative result (-3 clamped to 0), not a borderline case that might pass by accident.

4. **The `not.toHaveProperty('boundAp')` assertion is the right check.** Rather than asserting `boundAp === 3` (which would pass even if the endpoint wrote `boundAp: 3` explicitly), the test asserts the property is absent from the update payload. This proves the endpoint does not touch `boundAp` at all, per decree-016.

5. **Commit granularity is correct.** The safety guard fix, the test additions, and the documentation update are in separate commits. Each commit message is clear and references the relevant context (bug-038, code-review-216).

6. **Extended rest was fixed proactively.** Fixing all three endpoints in a single commit rather than leaving `extended-rest.post.ts` as technical debt demonstrates good engineering judgment.

## Verdict

**APPROVED**

Both issues from code-review-216 are fully resolved. HIGH-1 (missing tests) is addressed with 9 comprehensive test cases plus a symmetric clamping test in the global suite. MEDIUM-1 (missing Math.max guard) is applied to all three affected endpoints consistently. The fix cycle is clean, well-tested, and decree-compliant. No new issues found.
