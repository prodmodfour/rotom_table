---
review_id: code-review-095
target: refactoring-041
trigger: orchestrator-routed
reviewed_commits:
  - dc63907
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

## Scope

Single commit (`dc63907`) fixing stale test mock in `app/tests/unit/api/characters.test.ts`. The ticket (`refactoring-041`, category TEST-STALE) required adding a `maxHp` field to the mock factory and correcting the test's inline serialization logic to use `char.maxHp` instead of `char.hp`.

## Checklist

| Check | Result |
|---|---|
| `maxHp` added to `createMockCharacter` factory | Yes, line 25: `maxHp: 165` |
| PTU formula correct (`level + (baseHp * 3) + 10`) | Yes: `5 + (50 * 3) + 10 = 165` |
| Test line 85 uses `char.maxHp` (not `char.hp`) | Yes, corrected from `char.hp` to `char.maxHp` |
| Matches actual serializer (`serializeCharacterSummary`) | Yes -- serializer at `serializers.ts:149` reads `character.maxHp` |
| Prisma schema confirms `maxHp` is a distinct column from `hp` | Yes -- `schema.prisma:32`: `maxHp Int @default(10)` |
| No behavior change (refactor-only) | Correct -- only test mock data and test assertion updated |
| Resolution Log updated in ticket | Yes, with formula, field changes, and verification note |
| Ticket status set to `resolved` | Yes |
| All 13 tests pass | Verified via `vitest run` -- 13/13 pass |

## Findings

No issues found. The fix is minimal, correct, and well-documented.

**Note (pre-existing, not introduced by this commit):** The test's inline transformation (lines 71-96) mirrors only a subset of what `serializeCharacterSummary` actually returns. The real serializer includes additional fields (`playedBy`, `age`, `gender`, `features`, `edges`, `injuries`, `temporaryHp`, `background`, `personality`, `goals`, `location`, `pokemon`, etc.) that the test does not exercise. This is a pre-existing test coverage gap outside the scope of refactoring-041.

## Verdict

**APPROVED** -- The fix correctly adds `maxHp` to the mock factory with the right PTU-derived value and aligns the test assertion with the actual serializer behavior. No regressions, no behavior changes, resolution log is complete.
