---
ticket_id: ptu-rule-128
priority: P3
status: in-progress
domain: combat
source: decree-038
created_at: 2026-03-01
blocked_by: refactoring-106
---

# PTU-Rule-128: Sleep does not clear on recall or encounter end

## Summary

Fix `Asleep` and `Bad Sleep` conditions to persist through Pokemon recall and encounter end, matching mainline Pokemon video game behavior and decree-038 ruling.

## Motivation

decree-038 rules that Sleep is categorized as volatile (per PTU p.247) but does NOT clear on recall or encounter end (per video game behavior and PTU p.246 grouping). Currently, Sleep clears on recall because `RECALL_CLEARED_CONDITIONS` includes all volatile conditions.

## Acceptance Criteria

- [ ] `Asleep` does not clear when a Pokemon is recalled
- [ ] `Bad Sleep` does not clear when a Pokemon is recalled
- [ ] `Asleep` does not clear at encounter end
- [ ] `Bad Sleep` does not clear at encounter end
- [ ] Sleep is still cured by: save checks (DC 16), taking damage from attacks, items, Pokemon Center
- [ ] `Asleep` still displays in the volatile category for UI grouping
- [ ] Bad Sleep still clears when Sleep is cured (existing behavior preserved)

## PTU References

- p.246: "Sleeping Pokemon will naturally awaken given time" (persistent intro grouping)
- p.247: Sleep definition under Volatile Afflictions
- p.247: Bad Sleep — "if the target is cured of Sleep, they are also cured of Bad Sleep"

## Key Files

- `app/constants/statusConditions.ts` — per-condition behavior flags (after refactoring-106)
- Recall/switch handlers
- Encounter end/cleanup handlers

## Dependencies

Requires refactoring-106 (decouple condition behaviors from categories) to be completed first.

## Resolution Log

### Implementation (2026-03-01)

**Commits:**
- `3be18960` — fix: Sleep and Bad Sleep persist through recall and encounter end

**Files changed:**
- `app/constants/statusConditions.ts` — Set `Asleep` and `Bad Sleep` to `clearsOnRecall: false` and `clearsOnEncounterEnd: false` while keeping `category: 'volatile'` for UI display

**Behavior verification:**
- Asleep/Bad Sleep no longer in RECALL_CLEARED_CONDITIONS (derived from clearsOnRecall flags)
- Asleep/Bad Sleep no longer in ENCOUNTER_END_CLEARED_CONDITIONS (derived from clearsOnEncounterEnd flags)
- Asleep/Bad Sleep still in VOLATILE_CONDITIONS (derived from category)
- Asleep/Bad Sleep still in FAINT_CLEARED_CONDITIONS (clearsOnFaint: true)
- Breather still cures Sleep (derives from volatile category, not from recall/encounter-end flags)
- Sleep still appears in volatile UI grouping in CombatantConditionsSection.vue
