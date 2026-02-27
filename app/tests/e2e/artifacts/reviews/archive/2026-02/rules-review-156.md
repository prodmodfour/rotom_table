---
review_id: rules-review-156
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ux-005, ptu-rule-081
domain: pokemon-lifecycle, combat
commits_reviewed:
  - c039a0b
  - 9b302a7
  - b20370c
  - 73dbdea
mechanics_verified:
  - pokemon-hp-on-level-up
  - focus-single-item-limit
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Leveling Up (p.202)
  - core/05-pokemon.md#Hit Points formula (p.198)
  - core/09-gear-and-items.md#Focus (p.295)
reviewed_at: 2026-02-26T06:30:00Z
follows_up: (none -- first review)
---

## Mechanics Verified

### 1. Pokemon HP Behavior on Level-Up (ux-005)

- **Rule:** PTU Core p.202 specifies the level-up procedure: "Whenever your Pokemon Levels up, follow this list: First, it gains +1 Stat Point. [...] Next, there is the possibility your Pokemon may learn a Move or Evolve. [...] Finally, your Pokemon may gain a new Ability." (`core/05-pokemon.md` lines 555-575)
- **HP Formula:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md` line 118)
- **Key observation:** The PTU rulebook does NOT explicitly prescribe what happens to `currentHp` when `maxHp` increases due to level-up. The level-up procedure (p.202) lists stat point allocation, move/evolution checks, and ability gains -- it never mentions adjusting current HP. This is a gap in the written rules.
- **Implementation:** Both endpoints (`xp-distribute.post.ts` line 196, `add-experience.post.ts` line 107) compute `wasAtFullHp = pokemon.currentHp >= pokemon.maxHp`. When the Pokemon was at full HP before leveling, `currentHp` is set to `newMaxHp`. When damaged, `currentHp` is left unchanged.
- **Status:** CORRECT (UX enhancement, not contradicting any PTU rule)

**Analysis:**

The HP formula `Level + (HP * 3) + 10` means that each level gained increases maxHp by exactly 1 (the level component), assuming no stat point allocation to HP. The implementation correctly computes `maxHpIncrease = levelResult.levelsGained` (line 192 in xp-distribute, line 103 in add-experience), which represents only the level component of the formula. This is correct -- stat point allocation to HP happens separately via manual GM/player action.

The `wasAtFullHp` check uses `>=` (not `===`), which handles the edge case where `currentHp` somehow exceeds `maxHp` (e.g., from temporary HP cleanup or data migration). This is a safe and reasonable guard.

Both endpoints apply the identical pattern, ensuring consistency whether XP is granted via encounter distribution or manual addition. I verified no other server endpoints modify Pokemon experience/level (`xp-calculate.post.ts` is read-only; `encounter.service.ts` and `encounters/index.get.ts` do not write level/experience).

**Tabletop precedent:** In practice, most tabletop groups treat a full-HP Pokemon as still being at full HP after level-up. The PTU rulebook's silence on this point is typical of TTRPGs where common-sense rulings fill gaps. The implementation matches the expected table behavior.

### 2. Single Focus Item Limit (ptu-rule-081)

- **Rule:** "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages. Focuses are often Accessory-Slot Items, but may be crafted as Head-Slot, Hand or Off-Hand Slot Items as well; **a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot.**" (`core/09-gear-and-items.md` lines 1796-1801, emphasis added)
- **Errata:** No errata changes to Focus rules found in `errata-2.md`.
- **Implementation:** `computeEquipmentBonuses()` in `app/utils/equipmentBonuses.ts` (lines 38-53) adds a `focusApplied` boolean guard. The first item with `statBonus` is applied; subsequent items with `statBonus` are silently skipped.
- **Status:** CORRECT

**Analysis:**

The PTU rule is unambiguous: "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." The implementation enforces this by tracking a `focusApplied` flag that gates all `statBonus` processing after the first one.

**Correctness of the `statBonus` === Focus equivalence:** In the current codebase, the `statBonus` field on `EquippedItem` is exclusively used for Focus items. The equipment catalog (`app/constants/equipment.ts` lines 91-125) defines exactly 5 items with `statBonus`: Focus (Attack), Focus (Defense), Focus (Special Attack), Focus (Special Defense), and Focus (Speed). No other catalog items use `statBonus`. The custom item form (`EquipmentCatalogBrowser.vue`) also does not expose `statBonus` creation to the UI. The only way a non-Focus item could have `statBonus` is via direct API calls crafting a custom `EquippedItem` with that field set.

Therefore, treating `statBonus` presence as equivalent to "is a Focus item" is a reasonable and correct simplification for the current system. If a future item type introduces a `statBonus` that is NOT a Focus (e.g., a hypothetical "Mega Ring" with a stat bonus), the guard would need revisiting. For now, this is correct.

**Ordering determinism:** `Object.values(equipment)` iterates over the `EquipmentSlots` object properties. Since `EquipmentSlots` has a fixed set of keys (`head`, `body`, `mainHand`, `offHand`, `feet`, `accessory`), the iteration order is deterministic per the ECMAScript specification (string keys are iterated in insertion order). The first Focus found will always be the one in the earliest-defined slot. This is acceptable behavior -- the "first wins" approach matches the spirit of the PTU rule, which says you benefit from one Focus, not that you choose which one. In practice, this edge case only arises through custom API-crafted items, since all catalog Focus items share the accessory slot.

**Single source of truth:** `computeEquipmentBonuses()` is the sole computation point for equipment bonuses, called by 8 consumers across the codebase (combatant builder, damage calculator, move calculation composable, player character sheet, equipment tab display, equipment GET/PUT endpoints, and breather endpoint). The fix propagates automatically to all consumers.

## Summary

Both fixes are rules-correct:

1. **ux-005 (HP on level-up):** The PTU rulebook is silent on currentHp adjustment during level-up. The fix implements the common-sense tabletop convention that a full-HP Pokemon remains at full HP after leveling. Damaged Pokemon are correctly left unchanged. The maxHp increase calculation (`levelsGained` as the level component) is correct per the HP formula. Both XP endpoints implement the identical pattern. No other level-granting endpoints exist.

2. **ptu-rule-081 (Focus limit):** The fix directly implements PTU p.295's explicit rule: "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." The `focusApplied` boolean guard correctly limits stat bonus application to the first Focus item found. The `statBonus` field is exclusively used for Focus items in the current system, making the equivalence valid.

## Rulings

**R1 (ux-005):** The currentHp preservation on level-up is a valid UX enhancement that does not contradict any PTU rule. The rulebook's silence on this topic leaves it to GM discretion. The implementation's behavior (full HP stays full, damaged stays damaged) matches the standard tabletop expectation.

**R2 (ptu-rule-081):** The single Focus limit is correctly implemented. PTU p.295 is explicit and the implementation matches exactly. The "first Focus wins" approach when multiple Focus items exist across different slots is acceptable -- the rule says benefit from one, and deterministic selection is better than undefined behavior.

## Verdict

**APPROVED** -- Both fixes are rules-correct with zero issues found. No changes required.

## Required Changes

(none)
