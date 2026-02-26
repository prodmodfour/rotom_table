---
ticket_id: refactoring-068
priority: P4
status: resolved
category: EXT-FRAGILE
domain: combat
source: code-review-127 M2
created_by: slave-collector (plan-20260221-215717)
---

## Summary

`HumanEquipmentTab.vue` resets the catalog dropdown after equip by directly manipulating the DOM (`(event.target as HTMLSelectElement).value = ''`) instead of using a Vue reactive ref. This bypasses Vue's reactivity system and is fragile.

## Affected Files

- `app/components/character/tabs/HumanEquipmentTab.vue` — `onSelectItem()` function (lines 271-288)

## Suggested Fix

Use a reactive `ref` per slot for the selected dropdown value. Reset the ref to `''` only on successful equip. On failure, leave the ref at the selected value so the user can see which item they attempted to equip.

## Impact

Low — functional but fragile. If the async `equipItem()` call fails, the dropdown has already been reset and the user cannot see which item they attempted to equip.

## Fix Log

- **Commit:** `86e1ffa` — `refactor: replace DOM manipulation with reactive refs for equipment dropdowns`
- **Files changed:** `app/components/character/tabs/HumanEquipmentTab.vue`
- **What changed:**
  - Added `slotSelections` reactive ref (`Record<EquipmentSlot, string>`) with v-model per slot dropdown
  - Removed all `(event.target as HTMLSelectElement).value` DOM reads and writes from `onSelectItem()`
  - `equipItem()` resets the slot selection to `''` only on successful API response
  - On failure, the dropdown retains the selected value so the user can see what failed and retry
