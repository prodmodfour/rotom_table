---
review_id: code-review-011
target: refactoring-008
ticket_id: refactoring-008
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16
follows_up: code-review-010
commits_reviewed:
  - 3842bc7
  - b15f234
files_reviewed:
  - app/utils/restHealing.ts
  - app/tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts
  - app/constants/statusConditions.ts
scenarios_to_rerun:
  - capture-mechanic-status-modifiers-001
---

## Summary

Follow-up review of two commits addressing CHANGES_REQUIRED from code-review-010. Both issues are fully resolved.

## Issue Resolution

### CRITICAL #1 (code-review-010): `restHealing.ts` persistent conditions list — FIXED

**Commit:** `3842bc7`

The local `PERSISTENT_STATUS_CONDITIONS` array (which still had `'Asleep'`) was removed and replaced with `import { PERSISTENT_CONDITIONS } from '~/constants/statusConditions'`. Both downstream consumers (`getStatusesToClear` at line 121, `clearPersistentStatusConditions` at line 128) now use the canonical import.

The type widening cast `(PERSISTENT_CONDITIONS as readonly string[]).includes(status)` is the correct TS pattern — `PERSISTENT_CONDITIONS` is `StatusCondition[]` but the function parameters accept `string[]`, so the cast is a safe widening to satisfy `.includes()`.

**Verification:** Grepped the full codebase — zero remaining local persistent/volatile condition arrays. Every reference to `PERSISTENT_CONDITIONS` now traces back to `constants/statusConditions.ts:7`.

### HIGH #1 (code-review-010): Asleep volatile (+5) test assertion — FIXED

**Commit:** `b15f234`

Added assertion 5 to `capture-mechanic-status-modifiers-001.spec.ts`:

```typescript
test('assertion 5: Asleep (Volatile) -> statusModifier +5, captureRate = 95', async ({ request }) => {
  const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Asleep'] })
  expect(res.success).toBe(true)
  expect(res.data.captureRate).toBe(95)
  expect(res.data.breakdown.statusModifier).toBe(5)
})
```

Math check: base 100 + level(-20) + HP(0, 50%) + evolution(+10, stage 1/3) = 90. Asleep volatile = +5. Total = 95. Correct.

The test file now has 7 assertions (up from 6): Paralyzed (+10), Confused (+5), Stuck (+10), Slowed (+5), **Asleep (+5)**, stacked (Paralyzed+Confused = +15), mixed (Burned+Stuck+Slowed = +10/+10/+5).

## Other Checks

- Ticket resolution log (`refactoring-008.md` lines 88-91) updated with both follow-up commits. Clean.
- No exported symbol changes — `PERSISTENT_STATUS_CONDITIONS` was only used locally within `restHealing.ts`, no external consumers broken.
- Canonical source (`statusConditions.ts`) unchanged between reviews. `PERSISTENT_CONDITIONS` = `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']` — no Asleep. Correct.

## Verdict

**APPROVED** — Both issues from code-review-010 are fully resolved. The condition list deduplication is now complete across all four files that previously had local arrays (`statusConditions.ts`, `captureRate.ts`, `useCapture.ts`, `restHealing.ts`). The Asleep regression test covers the exact condition that changed classification.

Recommend re-running `capture-mechanic-status-modifiers-001` to confirm the new 7th assertion passes.
