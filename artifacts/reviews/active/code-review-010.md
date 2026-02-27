---
review_id: code-review-010
target: refactoring-008
ticket_id: refactoring-008
verdict: CHANGES_REQUIRED
reviewer: senior-reviewer
date: 2026-02-16
commits_reviewed:
  - 63fe747
files_reviewed:
  - app/constants/statusConditions.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/utils/restHealing.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
  - app/composables/useCombat.ts
  - app/tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts
scenarios_to_rerun:
  - capture-mechanic-status-modifiers-001
---

## Summary

The core Sleep reclassification is correct — `Asleep` moved from `PERSISTENT_CONDITIONS` to `VOLATILE_CONDITIONS` in the canonical source, and two duplicated lists (`captureRate.ts`, `useCapture.ts`) were eliminated by importing from the canonical source. However, a fourth duplicated list in `restHealing.ts` was missed, and the ticket's suggested test update for Asleep as +5 was not implemented.

## Issues

### CRITICAL #1: `restHealing.ts` still classifies Asleep as Persistent

**File:** `app/utils/restHealing.ts:13-15`

```typescript
// Current (WRONG):
export const PERSISTENT_STATUS_CONDITIONS = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Asleep'
]
```

This is a fourth duplicated condition list that the ticket identified three locations but the worker didn't grep for all occurrences. Two downstream functions consume this list:

- `getStatusesToClear()` (line 123) — returns statuses cleared by extended rest
- `clearPersistentStatusConditions()` (line 130) — filters out persistent statuses

The canonical source now says Asleep is Volatile, but `restHealing.ts` still says Persistent. This is exactly the duplication divergence that refactoring-008 was created to prevent.

**Fix:** Remove `'Asleep'` from `PERSISTENT_STATUS_CONDITIONS`. Better: replace the local list with an import from `~/constants/statusConditions` (same dedup pattern applied to `captureRate.ts` and `useCapture.ts` in this commit).

### HIGH #1: No test covers Asleep as Volatile (+5) for capture rate

**File:** `app/tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts`

The existing test covers Paralyzed (+10), Confused (+5), Stuck (+10), Slowed (+5) — but not Asleep. This is the one condition that just changed from +10 to +5 and is most likely to regress. The ticket's suggested step 6 ("Update capture rate test: Asleep should contribute +5, not +10") was not done.

**Fix:** Add an assertion:

```typescript
test('assertion N: Asleep (Volatile) -> statusModifier +5, captureRate = 95', async ({ request }) => {
  const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Asleep'] })
  expect(res.success).toBe(true)
  expect(res.data.captureRate).toBe(95)
  expect(res.data.breakdown.statusModifier).toBe(5)
})
```

## Other Files Checked (No Issues)

- `breather.post.ts` — imports `VOLATILE_CONDITIONS` and spreads into `BREATHER_CURED_CONDITIONS`. Sleep is now automatically cured by breather. Correct.
- `combatant.service.ts:235-241` — `VALID_STATUS_CONDITIONS` is a flat validation list of all statuses. No categorization. No change needed.
- `StatusConditionsModal.vue:48-54` — `AVAILABLE_STATUSES` is a flat UI picker list. No categorization. No change needed.
- `useCombat.ts:373` — behavioral check (`canAct` checks for Frozen/Asleep). Not a classification list. No change needed.
- `types/combat.ts:6` — `StatusCondition` union type includes `Asleep` without categorization. No change needed.

## What Looks Good

- Core fix is correct: `Asleep` moved to `VOLATILE_CONDITIONS` in the canonical source
- Deduplication in `captureRate.ts` and `useCapture.ts` is clean — local arrays replaced with imports
- `breather.post.ts` automatically picks up the change via `...VOLATILE_CONDITIONS` spread
- Commit message is well-structured with PTU rule references
- Ticket resolution log is thorough

## Verdict

**CHANGES_REQUIRED** — CRITICAL #1 (missed fourth duplicate in `restHealing.ts`) must be fixed. HIGH #1 (missing test for the key changed condition) should be fixed in the same pass.
