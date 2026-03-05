---
ticket_id: ptu-rule-126
title: "Snow Boots conditional Overland speed penalty not mechanically enforced"
priority: P4
severity: LOW
domain: combat
source: rules-review-198 MED-01
created_by: slave-collector (plan-20260228-153856)
created_at: 2026-02-28
status: in-progress
---

# ptu-rule-126: Snow Boots conditional Overland speed penalty not mechanically enforced

## Summary

PTU p.293: Snow Boots "lower your Overland Speed by -1 while on ice or deep snow." The ptu-rule-120 implementation stores the Naturewalk (Tundra) capability from Snow Boots but does not mechanically enforce the conditional -1 Overland penalty. The penalty is documented in the item description for GM reference only.

## PTU References

- `core/09-gear-and-items.md` line 1701-1702: "Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow."

## Affected Files

- `app/utils/equipmentBonuses.ts` — would need a `conditionalSpeedPenalty` mechanism
- `app/constants/equipment.ts` — Snow Boots entry would need conditional penalty data
- Terrain system would need "ice or deep snow" granularity within Tundra terrain

## Dependencies

Requires the terrain system to distinguish "ice or deep snow" from general Tundra terrain. The current terrain painter does not have this granularity (Tundra maps to `'normal'` base type).

## Impact

Minor — a trainer wearing Snow Boots on Tundra terrain has Overland Speed 1 higher than it should be. The penalty is documented in the item description for manual GM adjustment.

## Resolution Log

- **Commit:** 126fd9cc — `feat: add Snow Boots conditional Overland speed penalty`
- **Files changed:** `app/types/character.ts`, `app/utils/equipmentBonuses.ts`, `app/constants/equipment.ts`, `app/server/services/living-weapon.service.ts`, `app/server/api/characters/[id]/equipment.put.ts`, `app/components/character/tabs/HumanEquipmentTab.vue`, `app/components/character/EquipmentCatalogBrowser.vue`, `app/tests/unit/composables/useMoveCalculation.test.ts`, `app/tests/unit/services/living-weapon.service.test.ts`
- **What was done:**
  - Added `conditionalSpeedPenalty` field to `EquippedItem` type interface
  - Added `conditionalSpeedPenalties` array to `EquipmentCombatBonuses` interface
  - Populated Snow Boots with `conditionalSpeedPenalty: { amount: -1, condition: 'On ice or deep snow' }`
  - Collected penalties in `computeEquipmentBonuses()` alongside conditionalDR
  - Displayed penalties in equipment UI (HumanEquipmentTab, EquipmentCatalogBrowser)
  - Added Zod validation for the new field in equipment PUT endpoint
  - Updated test mocks for new EquipmentCombatBonuses shape
- **Limitation:** Penalty is NOT auto-enforced during movement. The terrain system lacks ice/deep-snow granularity within Tundra terrain. The penalty data is stored and displayed for GM reference, ready for future terrain support.
