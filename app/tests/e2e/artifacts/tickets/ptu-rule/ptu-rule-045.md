---
ticket_id: ptu-rule-045
priority: P3
status: in-progress
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

P1 (combat integration) and P2 (UI) remain for future implementation.
