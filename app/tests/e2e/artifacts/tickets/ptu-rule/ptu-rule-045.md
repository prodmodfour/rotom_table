---
ticket_id: ptu-rule-045
priority: P3
status: implemented
design_spec: designs/design-equipment-001.md
domain: combat
matrix_source:
  rule_ids:
    - combat-R134
    - combat-R135
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Damage Reduction and Evasion Bonus parameters exist in the combat system but no armor or shield equipment system auto-populates them. Values must be manually entered.

## Expected Behavior (PTU Rules)

Per PTU Core: armor provides Damage Reduction, shields provide Evasion Bonuses. These should derive from equipped items.

## Actual Behavior

The parameters are functional if manually set but no equipment/item system feeds into them.

## Fix Log

### P0 Implementation (2026-02-20)

P0 tier implemented: data model, constants catalog, CRUD API, bonuses utility.

- **A: Data Model** — `EquipmentSlot`, `EquippedItem`, `EquipmentSlots` types added to `app/types/character.ts`. `equipment` JSON field added to `HumanCharacter` Prisma model with `@default("{}")`.
- **B: Constants Catalog** — `app/constants/equipment.ts` created with 15 PTU standard items (Light/Heavy Armor, Helmet, Goggles, Gas Mask, Light/Heavy Shield, Running Shoes, Snow Boots, 5 Focus variants).
- **C: CRUD API** — `GET /api/characters/:id/equipment` returns slots + aggregate bonuses. `PUT /api/characters/:id/equipment` with slot validation, two-handed auto-clear, and unequip-via-null.
- **D: Bonuses Utility** — `computeEquipmentBonuses()` pure function in `app/utils/equipmentBonuses.ts` aggregates DR, evasion, stat bonuses, speed default CS, and conditional DR.
- **Serializers** — Both `serializeCharacter` and `serializeCharacterSummary` now include parsed `equipment` field.

### P1 Implementation (2026-02-20)

P1 tier implemented: combat integration for DR, evasion, Focus bonuses, and Heavy Armor speed penalty.

- **E: DR from Armor** — Server-side `calculate-damage.post.ts` auto-reads equipment DR for human targets. Helmet conditional DR (+15) on critical hits. Client-side `useMoveCalculation.ts` also subtracts equipment DR in damage calcs. Caller-provided DR still overrides for manual GM adjustments.
- **F: Evasion from Shields** — Equipment evasion bonus added to evasion calculations in server endpoint, client composable, and `buildCombatantFromEntity()` initial evasion values.
- **G: Focus Stat Bonuses** — New `applyStageModifierWithBonus()` helper in `damageCalculation.ts`. `DamageCalcInput` gains `attackBonus`/`defenseBonus` fields. Applied for human attackers/targets in both server and client damage calculations.
- **H: Heavy Armor Speed Penalty** — `buildCombatantFromEntity()` applies speed default CS (-1) to initiative and initial stage modifiers. `breather.post.ts` resets speed CS to equipment default instead of 0.

P2 (UI: equipment tab, catalog browser) remains for future implementation.

### P1 Follow-up Fixes (2026-02-20, code-review-120)

Two HIGH issues from code-review-120 resolved:

- **H1: Immutability fix** — `buildCombatantFromEntity()` in `combatant.service.ts` was mutating the input `entity` parameter's `stageModifiers` to apply Heavy Armor speed default CS. Replaced with a shallow copy pattern: a new `combatantEntity` is created with the adjusted stageModifiers and passed into the returned combatant, leaving the caller's entity reference untouched.
- **H2: `let` to `const`** — `targetEquipBonuses` in `calculate-damage.post.ts` was declared with `let` but never reassigned. Changed to `const`.

### P2 Implementation (2026-02-21)

P2 tier implemented: Equipment Tab UI and Item Catalog Browser.

- **I: Equipment Tab** — New `HumanEquipmentTab.vue` component with 6 equipment slots (Head, Body, Main Hand, Off-Hand, Feet, Accessory). Each slot shows equipped item name + remove button, or a catalog dropdown for empty slots. Custom item entry via "Custom..." option. Combat Bonuses summary at bottom. Registered in both `CharacterModal.vue` and `gm/characters/[id].vue`. WebSocket `character_update` emitted when character is in active encounter.
- **J: Item Catalog Browser** — New `EquipmentCatalogBrowser.vue` modal showing all 15 EQUIPMENT_CATALOG entries grouped by slot. Filter by slot, search by name/description. Item bonus tags (DR, evasion, speed CS, focus, conditional DR, can-ready). Equip button targets selected character. Integrated into Equipment tab via "Browse Full Catalog" button.

All tiers (P0/P1/P2) complete. Ticket resolved.
