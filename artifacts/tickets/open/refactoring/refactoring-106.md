---
ticket_id: refactoring-106
priority: P2
status: in-progress
domain: combat
source: decree-038
created_at: 2026-03-01
---

# Refactoring-106: Decouple status condition behaviors from category arrays

## Summary

Replace the rigid pattern where condition behaviors are derived from category membership (`RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS, ...]`) with per-condition behavior flags. Category arrays (`VOLATILE_CONDITIONS`, `PERSISTENT_CONDITIONS`, `OTHER_CONDITIONS`) remain for display/grouping but no longer drive mechanical behavior.

## Motivation

decree-038 mandates this change. The current architecture makes it impossible to have a condition that is categorized as volatile but doesn't clear on recall (e.g., Sleep). The rigid coupling between category and behavior forces incorrect mechanics.

## Acceptance Criteria

- [ ] Each status condition has independent behavior flags: `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint` (minimum)
- [ ] `RECALL_CLEARED_CONDITIONS` is derived from per-condition flags, not category membership
- [ ] Encounter-end cleanup uses per-condition flags, not category membership
- [ ] Category arrays still exist for display grouping purposes
- [ ] All existing condition behaviors are preserved (except Sleep, handled by ptu-rule-128)
- [ ] No behavioral regressions — existing tests pass

## Key Files

- `app/constants/statusConditions.ts` — primary refactor target
- All files importing `RECALL_CLEARED_CONDITIONS`, `VOLATILE_CONDITIONS`, `PERSISTENT_CONDITIONS`
- Encounter end/cleanup logic
- Recall/switch logic

## Notes

This refactoring is a prerequisite for ptu-rule-128 (Sleep behavior fix). They can be implemented together or sequentially.

## Resolution Log

### Implementation (2026-03-01)

**Commits:**
- `1dd6b0b5` — refactor: add StatusConditionDef type with per-condition behavior flags
- `447dd158` — refactor: use per-condition flags for encounter-end cleanup
- `f0f16a36` — refactor: use FAINT_CLEARED_CONDITIONS in applyFaintStatus
- `beabf1cb` — refactor: derive breather cured conditions from STATUS_CONDITION_DEFS
- `65883524` — refactor: use STATUS_CONDITION_DEFS for capture rate category checks
- `94fe54ac` — refactor: use STATUS_CONDITION_DEFS for rest healing category checks

**Files changed:**
- `app/constants/statusConditions.ts` — new `StatusConditionDef` type, `STATUS_CONDITION_DEFS` record, derived behavior arrays (`RECALL_CLEARED_CONDITIONS`, `ENCOUNTER_END_CLEARED_CONDITIONS`, `FAINT_CLEARED_CONDITIONS`)
- `app/server/api/encounters/[id]/end.post.ts` — uses `ENCOUNTER_END_CLEARED_CONDITIONS` instead of `VOLATILE_CONDITIONS`
- `app/server/services/combatant.service.ts` — uses `FAINT_CLEARED_CONDITIONS` instead of `[...PERSISTENT_CONDITIONS, ...VOLATILE_CONDITIONS]`
- `app/server/api/encounters/[id]/breather.post.ts` — derives from `STATUS_CONDITION_DEFS` instead of `VOLATILE_CONDITIONS`
- `app/utils/captureRate.ts` — uses `STATUS_CONDITION_DEFS` category lookup instead of array includes
- `app/utils/restHealing.ts` — uses `STATUS_CONDITION_DEFS` category lookup instead of array includes
