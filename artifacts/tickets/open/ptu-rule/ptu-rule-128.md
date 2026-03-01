---
ticket_id: ptu-rule-128
priority: P3
status: open
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
