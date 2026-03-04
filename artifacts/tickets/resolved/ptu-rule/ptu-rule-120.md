---
ticket_id: ptu-rule-120
title: Equipment-granted Naturewalk not auto-derived from equipped items
severity: LOW
priority: P4
domain: combat+character-lifecycle
source: rules-review-191 MED-01
created_by: slave-collector (plan-20260228-072000)
status: in-progress
---

## Summary

Trainers can gain Naturewalk from equipped items (Snow Boots grant Naturewalk Tundra, Jungle Boots grant Naturewalk Forest — PTU 09-gear-and-items.md:1701-1714). Currently, the `capabilities` field on HumanCharacter is manually edited by the GM, separate from the equipment system. If a trainer equips Jungle Boots, the GM must manually add `"Naturewalk (Forest)"` to capabilities. If the trainer unequips, the GM must manually remove it.

The equipment system already tracks equipped items with stat bonuses and DR, but capabilities from equipment are not auto-derived.

## Affected Files

- `app/utils/equipmentBonuses.ts` — currently computes stat/DR bonuses but not capabilities
- `app/utils/combatantCapabilities.ts` — consumes capabilities but doesn't source from equipment
- `app/constants/equipment.ts` — item catalog (needs capability annotations)

## PTU References

- PTU 09-gear-and-items.md:1701-1714 (Snow Boots, Jungle Boots)
- PTU 04-trainer-classes.md:2798-2801 (Naturewalk capability definition)

## Suggested Fix

1. Add a `grantedCapabilities: string[]` field to equipment item definitions
2. In `equipmentBonuses.ts` or a new utility, compute derived capabilities from equipped items
3. Merge equipment-derived capabilities with manually-entered capabilities in `getCombatantNaturewalks`
4. Auto-add/remove capabilities when equipment changes (or display a union of manual + equipment-derived)

## Impact

Low — current manual approach works. This is a convenience/consistency improvement.

## Resolution Log

### Implementation (slave/4-developer-ptu-rule-120-20260228)

**Commits:**
- `22429c8` feat: add grantedCapabilities field to equipment and catalog entries
- `d388ed9` feat: add getEquipmentGrantedCapabilities utility function
- `fa4b842` feat: merge equipment-derived Naturewalks into getCombatantNaturewalks
- `ee35329` fix: accept grantedCapabilities in equipment PUT validation schema
- `88c420a` feat: expose grantedCapabilities in equipment GET and PUT responses
- `053fb4b` feat: display equipment-granted capabilities in equipment tab UI
- `58092ed` fix: extend Naturewalk immunity check to human combatants

**Files changed:**
- `app/types/character.ts` — added `grantedCapabilities?: string[]` to EquippedItem type
- `app/constants/equipment.ts` — added grantedCapabilities to Snow Boots, added Jungle Boots entry
- `app/utils/equipmentBonuses.ts` — added `getEquipmentGrantedCapabilities()` pure function
- `app/utils/combatantCapabilities.ts` — merged equipment-derived capabilities in `getCombatantNaturewalks`
- `app/server/api/characters/[id]/equipment.put.ts` — Zod schema + response includes grantedCapabilities
- `app/server/api/characters/[id]/equipment.get.ts` — response includes grantedCapabilities
- `app/components/character/tabs/HumanEquipmentTab.vue` — displays granted capabilities in bonuses section
- `app/server/api/encounters/[id]/status.post.ts` — extended Naturewalk immunity to human combatants

**Additional fix:** The Naturewalk Slowed/Stuck immunity check in the status endpoint was previously gated to Pokemon only. Extended to all combatant types since trainers can also have Naturewalk (Survivalist class or equipment).

### Fix Cycle (code-review-222 H1)

**Commit:**
- `3e6ba29` test: add unit tests for equipment-granted Naturewalk capabilities

**Files changed:**
- `app/tests/unit/utils/equipmentBonuses.test.ts` — NEW: 12 tests for getEquipmentGrantedCapabilities (empty equipment, single/multiple items, deduplication, mixed fields, slot ordering)
- `app/tests/unit/utils/combatantCapabilities.test.ts` — EXTENDED: +19 tests (equipment-derived Naturewalk via getCombatantNaturewalks, manual+equipment merge, deduplication, bypass terrain, status immunity)

**Total test coverage:** 31 new tests across 2 files, all passing.
