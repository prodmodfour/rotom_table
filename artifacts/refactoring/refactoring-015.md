---
ticket_id: refactoring-015
priority: P2
status: resolved
categories:
  - RACE-CONDITION
  - TEST-FLAKINESS
affected_files:
  - app/server/api/encounters/[id]/serve.post.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-encounter-lifecycle-001.spec.ts
  - app/tests/e2e/scenarios/combat/combat-workflow-template-setup-001.spec.ts
discovered_by: playtester
discovered_during: refactoring-010 regression run (2026-02-16)
---

# refactoring-015: Non-atomic serve mutex causes flaky parallel test failures

## Problem

`serve.post.ts` uses a two-step, non-atomic operation to ensure only one encounter is served at a time:

```typescript
// Step 1: Unserve all encounters
await prisma.encounter.updateMany({
  where: { isServed: true },
  data: { isServed: false }
})

// Step 2: Serve this encounter
const encounter = await prisma.encounter.update({
  where: { id },
  data: { isServed: true }
})
```

Between steps 1 and 2 (or between step 2 and a subsequent read), another request can call the same endpoint — its step 1 unserves everything, including the encounter that was just served by the first request.

## Impact

- `combat-workflow-wild-encounter-001` Phase 1c intermittently fails: `expect(encounter.isServed).toBe(true)` gets `false`
- 5+ test files call `serveEncounter()` concurrently with `fullyParallel: true`
- The race window is small, so failures are intermittent (~1 in 3-5 runs)
- 11 downstream tests are skipped when Phase 1c fails (serial test suite)

## Suggested Fix

Wrap both operations in a Prisma transaction:

```typescript
const encounter = await prisma.$transaction(async (tx) => {
  await tx.encounter.updateMany({
    where: { isServed: true },
    data: { isServed: false }
  })
  return tx.encounter.update({
    where: { id },
    data: { isServed: true }
  })
})
```

This ensures atomicity — no other request can interleave between the unserve-all and the serve-one.

## Evidence

- Regression run 2026-02-16: failed 1/3 runs, passed 2/3 runs (timing-dependent)
- Previous result (`run_id: 2026-02-15-002`) passed — consistent with intermittent race
- No refactoring-010 code touches serve/unserve logic; failure is purely from parallel test contention

## Resolution Log

### Root Cause (refined)

The ticket correctly identified the non-atomic unserve+serve as a problem, but the transaction alone was insufficient. The deeper issue: with `--repeat-each=3 --workers=6`, three parallel workers each call `serve` for different encounters. Since serve globally unserves all encounters first, sequential transactions overwrite each other. The test then verified `isServed` via a separate GET — between the serve response and the GET, another worker's serve transaction could unserve the encounter.

Two-part fix:
1. **Endpoint**: Wrap unserve+serve in `$transaction` — prevents interleaving within a single call (correctness)
2. **Tests**: Verify `isServed` from the serve response data, not a racy follow-up GET — eliminates the read-after-write race window

### Commits

- `fd99f63` — fix: wrap serve endpoint unserve+serve in Prisma transaction
- `67c9afc` — test: verify serve from response instead of racy follow-up GET

### Files Changed

- `app/server/api/encounters/[id]/serve.post.ts` — wrapped `updateMany` + `update` in `prisma.$transaction`
- `app/tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts` — Phase 1c uses serve response
- `app/tests/e2e/scenarios/combat/combat-encounter-lifecycle-001.spec.ts` — Phase 4 uses serve response
- `app/tests/e2e/scenarios/combat/combat-workflow-template-setup-001.spec.ts` — Phase 4 uses serve response

### Test Results

3 consecutive runs of `--workers=6 --repeat-each=3` (27 tests each):
- Run 1: 26/27 passed (1 Phase 1b initiative failure — unrelated, wild spawn speed RNG)
- Run 2: 27/27 passed
- Run 3: 27/27 passed

Phase 1c (serve assertion) passed in all 9/9 instances across all 3 runs.
