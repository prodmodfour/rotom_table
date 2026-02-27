---
review_id: rules-review-016
target: refactoring-015
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-17
trigger: bug-fix-review
follows_up: null
---

# PTU Rules Review: refactoring-015 (Non-atomic serve mutex race condition)

## Commits Reviewed

| Commit | Message | Files |
|--------|---------|-------|
| fd99f63 | fix: wrap serve endpoint unserve+serve in Prisma transaction | serve.post.ts |
| 67c9afc | test: verify serve from response instead of racy follow-up GET | 3 test specs |

## Scope

- [x] `serve.post.ts` — transaction wrapper around unserve-all + serve-one
- [x] 3 test files — assertion data source changed from follow-up GET to serve response

## Mechanics Verified

### Encounter Serving (isServed flag)

- **Rule:** No PTU rule governs encounter serving. `isServed` is a purely app-level infrastructure concept controlling which encounter is displayed on the group TV screen.
- **Implementation:** Transaction wraps `updateMany(isServed: false)` + `update(isServed: true)` atomically. Response returns the full parsed encounter object.
- **Status:** NOT APPLICABLE — no PTU mechanic involved
- **Notes:** The endpoint performs zero game calculations. All response fields (`combatants`, `turnOrder`, `currentRound`, `currentTurnIndex`, `moveLog`, `defeatedEnemies`) are JSON-parsed directly from the database with no transformation.

### Initiative Order (template-setup test)

- **Rule:** PTU 07-combat.md — initiative sorted by Speed stat (+ bonuses). Higher Speed goes first.
- **Implementation:** `combat-workflow-template-setup-001` Phase 4 asserts Squirtle (SPD 4) is last in turnOrder. This assertion was unchanged by the fix — only the data source changed from `getEncounter()` to `serveEncounter()` response.
- **Status:** CORRECT — assertion logic unchanged, data is identical (same DB record, same JSON parse)

## Summary

- Mechanics checked: 2
- Correct: 1 (initiative order assertion — unchanged)
- Not applicable: 1 (isServed flag — app infrastructure, no PTU equivalent)
- Incorrect: 0
- Needs review: 0

## PTU References

- Initiative: `books/markdown/core/07-combat.md` — "Initiative"
- No errata applies

## Verdict

**APPROVED** — This fix is entirely infrastructure-level (database transaction atomicity + test timing). No PTU formulas, game calculations, or mechanic implementations are modified. The test assertion changes are purely about data sourcing (response vs. follow-up GET) with identical underlying data. No PTU correctness concerns.
