---
ticket_id: refactoring-069
category: EXT-DUPLICATE
priority: P4
status: in-progress
source: code-review-132 M1
created_by: slave-collector (plan-20260222-214423)
created_at: 2026-02-22
---

# refactoring-069: Extract SLOT_ICONS to shared constants/equipment.ts

## Summary

`SLOT_ICONS` is duplicated between `HumanEquipmentTab.vue` and `EquipmentCatalogBrowser.vue`. The code-review-132 H1 fix extracted `STAT_LABELS` and `SLOT_LABELS` to the shared `constants/equipment.ts` file, but left `SLOT_ICONS` duplicated because icon components are Vue imports and the constants file is otherwise pure data.

## Affected Files

- `app/components/character/tabs/HumanEquipmentTab.vue` (lines 182-189)
- `app/components/character/EquipmentCatalogBrowser.vue` (lines 118-125)
- `app/constants/equipment.ts` (target for extraction)

## Current State

Both components define identical mappings:
- head → PhBaseballCap
- body → PhTShirt
- mainHand → PhSword
- offHand → PhHandPalm
- feet → PhSneakerMove
- accessory → PhRing

## Suggested Fix

Export `SLOT_ICONS` from `constants/equipment.ts` alongside the existing `SLOT_LABELS` and `STAT_LABELS`. This introduces a Vue component dependency in the constants file, which is a minor tradeoff — but the file already serves as the single source of truth for equipment display data.

Alternatively, create a separate `constants/equipmentUI.ts` for UI-specific constants (icons) vs game-data constants (catalog, slots, labels).

## Impact

Low — icons rarely change, and both files already import the same Phosphor icon set. This is a duplication cleanup, not a correctness issue.

## Resolution Log

- `9eb0d05` — refactor: extract SLOT_ICONS to constants/equipment.ts
  - Added `SLOT_ICONS: Record<EquipmentSlot, Component>` to `app/constants/equipment.ts`
  - Removed local `SLOT_ICONS` from `app/components/character/tabs/HumanEquipmentTab.vue`
  - Removed local `SLOT_ICONS` from `app/components/character/EquipmentCatalogBrowser.vue`
  - Both components now import `SLOT_ICONS` from the shared constants file
