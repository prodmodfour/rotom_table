---
review_id: code-review-018
target: refactoring-015
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-17
follows_up: null
scenarios_to_rerun: []
---

# Code Review: refactoring-015 (Non-atomic serve mutex race condition)

## Commits Reviewed

| Commit | Message | Files |
|--------|---------|-------|
| fd99f63 | fix: wrap serve endpoint unserve+serve in Prisma transaction | serve.post.ts |
| 67c9afc | test: verify serve from response instead of racy follow-up GET | 3 test specs |

## Files Reviewed

- `app/server/api/encounters/[id]/serve.post.ts` — full read
- `app/server/api/encounters/[id]/unserve.post.ts` — full read (cross-reference)
- `app/tests/e2e/scenarios/combat/combat-helpers.ts` — `serveEncounter` helper
- `app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts` — Phase 1c
- `app/tests/e2e/scenarios/combat/combat-encounter-lifecycle-001.spec.ts` — Phase 4
- `app/tests/e2e/scenarios/combat/combat-workflow-template-setup-001.spec.ts` — Phase 4

## Issues

None.

## Analysis

### Endpoint Fix (fd99f63)

The two-step unserve-all + serve-one operation was correctly wrapped in `prisma.$transaction`. Inside the closure, `tx.encounter.updateMany` and `tx.encounter.update` execute atomically. SQLite's single-writer model ensures concurrent transactions serialize at the write lock, preventing interleaving.

The change is minimal — only the transaction wrapper was added. No logic changes, no new fields, no behavioral differences.

### Test Fix (67c9afc)

Three test files were updated to assert `isServed` from the `serveEncounter()` response instead of making a separate `getEncounter()` call. The `serveEncounter` helper returns `body.data` which includes the full parsed encounter object (isServed, combatants, turnOrder, etc.).

The template-setup test additionally migrated combatant/turnOrder assertions to use the response, which is correct since the response data is identical to what `getEncounter` would return.

### Completeness Check

All 5 `serveEncounter()` call sites in the test suite were verified:
- 3 fixed (the ones that asserted `isServed` via follow-up GET)
- 2 unchanged (serve before page navigation — no `isServed` assertion, no race)

### Test Evidence

3 consecutive runs with `--workers=6 --repeat-each=3`: Phase 1c passed 9/9 instances. Previous failure rate was ~1 in 3-5 runs.

## Verdict

**APPROVED** — Correct, minimal, well-tested fix. No issues found. No scenarios need re-running (the developer already demonstrated stability across 3 parallel runs).
