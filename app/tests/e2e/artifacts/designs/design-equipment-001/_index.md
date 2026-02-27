---
design_id: design-equipment-001
ticket_id: ptu-rule-045
category: FEATURE_GAP
scope: FULL
domain: combat
status: p1-complete
affected_files:
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/services/combatant.service.ts
  - app/server/services/entity-update.service.ts
  - app/utils/damageCalculation.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useCombat.ts
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/components/character/tabs/HumanStatsTab.vue
new_files:
  - app/constants/equipment.ts
  - app/server/api/characters/[id]/equipment.get.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/utils/equipmentBonuses.ts
  - app/components/character/tabs/HumanEquipmentTab.vue
---


# Design: Equipment / Armor System (ptu-rule-045)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | P0: Data Model, Constants, CRUD, Bonus Utility | [spec-p0.md](spec-p0.md) |
| P1 | P1: Combat Integration | [spec-p1.md](spec-p1.md) |
| P2 | P2: UI Polish | [spec-p2.md](spec-p2.md) |

## Summary

Implement a PTU equipment system for trainer characters so that Damage Reduction (DR) and Evasion Bonuses are derived from equipped items instead of requiring manual entry. PTU trainers have six equipment slots (Head, Body, Feet, Main Hand, Off-Hand, Accessory). Body armor provides DR, shields provide Evasion Bonuses, and other equipment provides various passive effects. The system computes aggregate DR and evasion bonuses from all equipped items and feeds them into the existing damage calculation and accuracy check pipelines.

### PTU Rules Reference

- **PTU p.286 (09-gear-and-items.md):** Equipment slots are Head, Main Hand, Off-Hand, Body, Feet, Accessory. One item per slot.
- **PTU p.293:** Light Armor = 5 DR; Heavy Armor = 10 DR + Speed default CS -1.
- **PTU p.294:** Light Shield = +2 Evasion (readied: +4 Evasion + 10 DR, but Slowed). Heavy Shield = +2 Evasion (readied: +6 Evasion + 15 DR, but Slowed).
- **PTU p.293:** Helmet = 15 DR against Critical Hits only.
- **PTU p.295:** Focus = +5 to a chosen stat (after combat stages).
- **PTU p.286:** Equipping/switching items is a Standard Action.

### Current State

- `damageReduction` is accepted as an optional parameter in `DamageCalcInput` and the `/calculate-damage` endpoint, but it must be manually passed by the caller.
- `evasionBonus` is read from `stageModifiers.evasion` on the entity and applied in evasion calculations. No equipment system populates either value.
- `HumanCharacter` has an `inventory` JSON field (array of `InventoryItem`) but no equipment slot system.
- The `Combatant` interface has `physicalEvasion`, `specialEvasion`, `speedEvasion` computed at creation time in `buildCombatantFromEntity()`.

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Equipment data model (Prisma + types) | NOT_IMPLEMENTED | No equipment slots on characters | **P0** |
| B | Equipment constants catalog | NOT_IMPLEMENTED | No item definitions | **P0** |
| C | Equipment CRUD API | NOT_IMPLEMENTED | No endpoints | **P0** |
| D | Equipment bonuses utility | NOT_IMPLEMENTED | No aggregate computation | **P0** |
| E | Combat integration: DR from armor | MANUAL_ONLY | `damageReduction` param exists but must be hand-passed | **P1** |
| F | Combat integration: Evasion from shields | MANUAL_ONLY | `evasionBonus` only from `stageModifiers.evasion` | **P1** |
| G | Combat integration: Focus stat bonus | NOT_IMPLEMENTED | No post-stage stat bonus mechanism | **P1** |
| H | Combat integration: Heavy Armor speed penalty | NOT_IMPLEMENTED | No default CS override | **P1** |
| I | Equipment tab UI on character sheet | NOT_IMPLEMENTED | No UI for equip/unequip | **P2** |
| J | Item catalog browser + drag-and-drop | NOT_IMPLEMENTED | No UI for browsing items | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
- [implementation-log.md](implementation-log.md)
