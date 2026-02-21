---
ticket_id: ptu-rule-081
priority: P4
status: open
domain: combat
source: rules-review-115 M2
created_by: slave-collector (plan-20260221-071325)
created_at: 2026-02-21
---

# ptu-rule-081: Multiple Focus items not explicitly prevented

## Summary

PTU p.295 states "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." However, `computeEquipmentBonuses()` in `equipmentBonuses.ts` sums all Focus bonuses across all equipment slots. If a trainer had Focus items in two different slots (e.g., head + accessory), both bonuses would be applied.

## PTU Rule

> "A Focus grants +5 Bonus to a Stat, chosen when crafted. [...] a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." (Core p.295)

## Affected Files

- `app/utils/equipmentBonuses.ts` (lines 46-49)

## Suggested Fix

Either:
1. Add a "take only first Focus bonus" guard in `computeEquipmentBonuses()` — only apply the first Focus item found
2. Or validate at equipment-assignment time (reject equipping a second Focus item)

## Impact

- **Edge case:** The equipment slot system (one item per slot) makes this unlikely, but the equipment catalog could contain Focus items for different slots. Relies on GM discipline rather than code enforcement currently.
