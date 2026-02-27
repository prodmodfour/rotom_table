---
ticket_id: refactoring-022
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/server/services/combatant.service.ts
  - app/components/encounter/StatusConditionsModal.vue
estimated_scope: small
status: resolved
created_at: 2026-02-17T12:00:00
origin: code-review-023
---

## Summary

Two files maintain hardcoded status condition arrays that are identical to `ALL_STATUS_CONDITIONS` from `constants/statusConditions.ts`. They should import from the canonical source instead. This is the same DRY violation that refactoring-006 fixed in `breather.post.ts` and refactoring-008 fixed in `captureRate.ts` / `useCapture.ts` — these are the last two remaining instances.

## Findings

### Finding 1: EXT-DUPLICATE — `VALID_STATUS_CONDITIONS` in combatant.service.ts

- **Metric:** 19-element hardcoded array identical to `ALL_STATUS_CONDITIONS`
- **Threshold:** Any duplicate of a canonical constant
- **Impact:** When a status condition is added or removed, this file must be manually updated. Proven by refactoring-009 — the developer had to edit this file when removing phantom conditions, even though the canonical list was already updated.
- **Evidence:**
  - `combatant.service.ts:235-241` — hardcoded `VALID_STATUS_CONDITIONS` array
  - `constants/statusConditions.ts:20-23` — canonical `ALL_STATUS_CONDITIONS` (identical content)

### Finding 2: EXT-DUPLICATE — `AVAILABLE_STATUSES` in StatusConditionsModal.vue

- **Metric:** 19-element hardcoded array identical to `ALL_STATUS_CONDITIONS`
- **Threshold:** Any duplicate of a canonical constant
- **Impact:** Same as Finding 1. Any condition list change requires a manual edit here too.
- **Evidence:**
  - `StatusConditionsModal.vue:48-53` — hardcoded `AVAILABLE_STATUSES` array
  - `constants/statusConditions.ts:20-23` — canonical `ALL_STATUS_CONDITIONS` (identical content)

## Suggested Refactoring

1. In `combatant.service.ts`: replace `VALID_STATUS_CONDITIONS` with an import of `ALL_STATUS_CONDITIONS` from `~/constants/statusConditions`. Update the reference at line 288 accordingly.
2. In `StatusConditionsModal.vue`: replace `AVAILABLE_STATUSES` with an import of `ALL_STATUS_CONDITIONS` from `~/constants/statusConditions`. Update the template `v-for` accordingly.
3. Verify no behavioral change — both arrays are currently identical to `ALL_STATUS_CONDITIONS`.

Estimated commits: 1

## Related Lessons

- refactoring-006: Fixed same pattern in `breather.post.ts` (local VOLATILE_CONDITIONS → import)
- refactoring-008: Fixed same pattern in `captureRate.ts` and `useCapture.ts` (local condition arrays → import)
- refactoring-009: Proved the cost — 4 files touched instead of 2 because these duplicates existed

## Resolution Log
- Commits: 258a12a
- Files changed:
  - `app/server/services/combatant.service.ts` — replaced hardcoded `VALID_STATUS_CONDITIONS` array with `ALL_STATUS_CONDITIONS` import; kept export alias for internal usage
  - `app/components/encounter/StatusConditionsModal.vue` — replaced hardcoded `AVAILABLE_STATUSES` array with `ALL_STATUS_CONDITIONS` import
- New files created: none
- Tests passing: no behavioral change — both arrays were identical to the canonical source
