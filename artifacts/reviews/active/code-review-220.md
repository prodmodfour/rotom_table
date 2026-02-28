---
review_id: code-review-220
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-038
domain: healing
commits_reviewed:
  - 3d6a238
  - 80b5d9b
  - e4178d6
files_reviewed:
  - app/server/api/game/new-day.post.ts
  - app/server/api/characters/[id]/new-day.post.ts
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/tests/unit/api/new-day.test.ts
  - app/tests/unit/api/character-new-day.test.ts
  - app/utils/restHealing.ts
  - artifacts/tickets/open/bug/bug-038.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T13:25:00Z
follows_up: code-review-216
---

## Review Scope

Re-review of bug-038 fix cycle. The previous review (code-review-216) found two issues:

- **HIGH-1:** Per-character new-day endpoint (`/api/characters/[id]/new-day`) lacked unit tests for the boundAp preservation behavioral change.
- **MEDIUM-1:** No `Math.max(0, ...)` safety guard on `currentAp` calculation in any of the three AP-restoration endpoints.

The developer addressed both in 3 commits: `3d6a238` (Math.max safety guard), `80b5d9b` (per-character new-day unit tests + global clamping test), `e4178d6` (ticket documentation update).

### Decree Compliance

- **decree-016** (Extended rest clears only Drained AP, not Bound AP): All three endpoints (`new-day.post.ts`, `characters/[id]/new-day.post.ts`, `characters/[id]/extended-rest.post.ts`) preserve `boundAp` -- the field is absent from update payloads. Inline comments cite decree-016. COMPLIANT.
- **decree-019** (New Day is a pure counter reset): Both new-day endpoints reset only daily counters (`restMinutesToday`, `injuriesHealedToday`, `drainedAp`, `lastRestReset`). No implicit extended rest effects. COMPLIANT.
- **decree-028** (Bound AP persists across New Day): `boundAp` is not included in the update data for either new-day endpoint, meaning it persists at its current database value. The `currentAp` formula correctly subtracts existing `boundAp` from `maxAp`. COMPLIANT.

## Issue Resolution Verification

### HIGH-1 Resolution: Per-character new-day unit tests

**Status: RESOLVED.**

New file `app/tests/unit/api/character-new-day.test.ts` (266 lines) provides 9 test cases organized into 4 describe blocks:

1. **boundAp preservation (decree-016, decree-028):**
   - `boundAp` NOT cleared on new day -- verifies `updateCall.data` does not contain `boundAp` property
   - `currentAp` calculated as `maxAp - boundAp` -- level 10, boundAp 2 yields currentAp 5
   - Clamping to zero when `boundAp` exceeds `maxAp` -- level 1 (maxAp 5), boundAp 8 yields currentAp 0
   - Full `maxAp` when `boundAp` is zero -- level 15 (maxAp 8), boundAp 0 yields currentAp 8

2. **Daily counter reset (decree-019):**
   - `drainedAp` cleared to zero
   - `restMinutesToday` and `injuriesHealedToday` reset, `lastRestReset` set to Date

3. **Response payload:**
   - Response includes `boundAp`, `drainedAp`, and `currentAp` in data
   - Pokemon reset count matches character's Pokemon array length

4. **Error handling:**
   - 400 when character ID is missing
   - 404 when character does not exist

The test file has correct mock setup: H3 auto-imports (`getRouterParam`, `createError`, `defineEventHandler`) are stubbed globally, Prisma is mocked with `findUnique`/`update` methods, and `resetDailyUsage` is mocked as a passthrough. The `createMockEvent` helper correctly simulates H3 event objects with `_routerParams`. The `createCharacter` factory provides sensible defaults with clean override capability.

The test structure correctly mirrors the different code path of the per-character endpoint vs. the global endpoint: `findUnique` (not `findMany`), direct `update` (not `$transaction`), inline Pokemon move reset (not separate `findMany` + iteration), and 400/404 error handling specific to the per-character route.

This exceeds the 4-test minimum requested in code-review-216.

### MEDIUM-1 Resolution: Math.max(0, ...) safety guard

**Status: RESOLVED.**

Commit `3d6a238` applies the `Math.max(0, ...)` clamp to all three endpoints:

| File | Line | Before | After |
|------|------|--------|-------|
| `game/new-day.post.ts` | 55 | `calculateMaxAp(char.level) - char.boundAp` | `Math.max(0, calculateMaxAp(char.level) - char.boundAp)` |
| `characters/[id]/new-day.post.ts` | 40 | `maxAp - character.boundAp` | `Math.max(0, maxAp - character.boundAp)` |
| `characters/[id]/extended-rest.post.ts` | 97 | `maxAp - character.boundAp` | `Math.max(0, maxAp - character.boundAp)` |

The review-216 note that extended-rest.post.ts was "outside this bug fix scope" but could be fixed alongside -- the developer correctly included it. This matches the defensive pattern in `calculateAvailableAp()` at `restHealing.ts:233`.

Both test files now include a clamping edge case test (boundAp exceeds maxAp, result clamped to 0):
- `new-day.test.ts`: "clamps currentAp to zero when boundAp exceeds maxAp" -- level 1 (maxAp 5), boundAp 8, expects currentAp 0
- `character-new-day.test.ts`: identical test case for the per-character code path

## What Looks Good

1. **Complete resolution of both review issues.** HIGH-1 asked for at minimum 4 test cases; the developer delivered 9 covering decree compliance, daily counter resets, response payloads, and error handling. MEDIUM-1 asked for `Math.max(0, ...)` in two files with an optional third; the developer applied it to all three.

2. **Test quality is high.** The `character-new-day.test.ts` file properly mocks the H3 auto-imports that Nitro injects (`getRouterParam`, `createError`, `defineEventHandler`), which is the correct pattern for testing Nitro endpoints that use auto-imported utilities. The factory function `createCharacter()` uses spread overrides for clean test data setup. Test descriptions accurately reference the decrees they validate.

3. **Commit granularity is correct.** Three separate commits for three distinct concerns: code fix (Math.max), tests (new file + update to existing), documentation (ticket update). Each commit message is descriptive and references the relevant context.

4. **Extended-rest inclusion was proactive.** The developer went beyond the minimum ask of the two new-day endpoints and also applied the `Math.max(0, ...)` guard to the extended-rest endpoint, eliminating a known gap without requiring a follow-up ticket.

5. **Ticket documentation is thorough.** The fix cycle log in `bug-038.md` documents all three commits with file lists, descriptions, and references to the pattern being matched (`calculateAvailableAp()` in `restHealing.ts`).

## Verdict

**APPROVED**

Both issues from code-review-216 are fully resolved. The `Math.max(0, ...)` safety guard is applied consistently across all three AP-restoration endpoints. The per-character new-day endpoint has comprehensive unit test coverage (9 tests) that verifies decree compliance, daily counter behavior, response structure, and error handling. All three decrees (016, 019, 028) are respected in both code and tests. No new issues found.

## Required Changes

None.
