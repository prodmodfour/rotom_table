---
review_id: code-review-095b
target: refactoring-041
trigger: follow-up-review
follows_up: code-review-095
reviewed_commits:
  - ae9dbcb
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

## Scope

Single follow-up commit (`ae9dbcb`) correcting the `maxHp` value and formula comment in `createMockCharacter()` within `app/tests/unit/api/characters.test.ts`. This addresses the FAIL verdict from `rules-review-085`, which identified that the original fix (`dc63907`) used the Pokemon HP formula instead of the Trainer HP formula.

## Context

- `code-review-095` approved commit `dc63907` (added `maxHp` to mock, fixed `char.maxHp` reference)
- `rules-review-085` failed commit `dc63907` because `maxHp: 165` was computed via the Pokemon formula (`level + baseHp*3 + 10`) instead of the Trainer formula (`level*2 + baseHp*3 + 10`)
- The follow-up commit `ae9dbcb` corrects both the value and the comment

## Checklist

| Check | Result |
|---|---|
| `maxHp` changed from 165 to 170 | Yes -- line 25: `maxHp: 170` |
| Comment updated to Trainer formula | Yes -- `// PTU Trainer formula: (level * 2) + (baseHp * 3) + 10 = 10 + 150 + 10` |
| Formula arithmetic verified | `(5 * 2) + (50 * 3) + 10 = 10 + 150 + 10 = 170` -- correct |
| Matches production code | Yes -- `server/api/characters/index.post.ts:13` uses `level * 2 + hpStat * 3 + 10` |
| Mock character is a Trainer (not Pokemon) | Yes -- `characterType: 'player'`, uses `HumanCharacter` model |
| All 13 tests pass | Verified -- `vitest run`: 13/13 pass |
| No unrelated changes | Correct -- single-line diff, value and comment only |
| Commit message is descriptive | Yes -- `fix: use trainer HP formula in character test mock` |

## Findings

No issues. The fix is exactly what `rules-review-085` prescribed: the value is corrected from 165 to 170, and the comment now explicitly labels the formula as "PTU Trainer formula" with the `level * 2` term visible, eliminating the ambiguity that led to the original error.

## Verdict

**APPROVED** -- The follow-up commit correctly applies the Trainer HP formula (`level * 2 + baseHp * 3 + 10 = 170`), resolving the rules-review-085 FAIL. Tests pass, production code alignment confirmed, no regressions.
