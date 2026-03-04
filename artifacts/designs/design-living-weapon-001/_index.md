---
design_id: design-living-weapon-001
ticket_id: feature-005
category: FEATURE_GAP
scope: FULL
domain: combat
status: implemented
dependencies:
  - design-equipment-001
related:
  - feature-004
affected_files:
  - app/types/character.ts
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/services/combatant.service.ts
  - app/server/services/encounter.service.ts
  - app/utils/equipmentBonuses.ts
  - app/utils/combatantCapabilities.ts
  - app/utils/damageCalculation.ts
  - app/composables/useCombat.ts
  - app/composables/useGridMovement.ts
  - app/stores/encounter.ts
  - app/constants/equipment.ts
  - app/prisma/schema.prisma
new_files:
  - app/server/services/living-weapon.service.ts
  - app/server/api/encounters/[id]/living-weapon/engage.post.ts
  - app/server/api/encounters/[id]/living-weapon/disengage.post.ts
  - app/utils/livingWeaponMoves.ts
  - app/constants/livingWeapon.ts
  - app/components/encounter/LivingWeaponPanel.vue
  - app/components/encounter/LivingWeaponIndicator.vue
---


# Design: Living Weapon System (Honedge Line) (feature-005)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Wield Relationship Data Model, B. Living Weapon Capability Parsing, C. Engage/Disengage API Endpoints, D. Wield State Tracking in Combat | [spec-p0.md](spec-p0.md) |
| P1 | E. Equipment Integration (Weapon Bonuses), F. Doublade Dual-Wield Evasion, G. Aegislash Shield DR, H. Fainted Penalty, I. Weapon Moves Added to Move List | [spec-p1.md](spec-p1.md) |
| P2 | J. VTT Shared Movement, K. No Guard Suppression, L. Aegislash Forced Blade Forme, M. Weaponize Ability Intercept, N. Soulstealer Ability | [spec-p2.md](spec-p2.md) |

## Summary

Implement the PTU Living Weapon capability for the Honedge evolutionary line (Honedge, Doublade, Aegislash). These Pokemon can be wielded as equipment by trainers, functioning simultaneously as active Pokemon and weapons/shields. The system requires tracking a wield relationship between trainer and Pokemon, dynamically generating equipment bonuses from the wielded Pokemon, adding weapon moves to the Pokemon's move list while wielded, sharing movement between wielder and weapon on the VTT grid, and suppressing/modifying certain abilities while in the wielded state.

### PTU Rules Reference

- **PTU pp.305-306 (10-indices-and-reference.md):** Living Weapon capability definition. Honedge = Small Melee Weapon (Simple). Doublade = Two Small Melee Weapons (Simple, +2 Evasion when dual-wielded). Aegislash = Small Melee Weapon + Light Shield (Fine). Fainted Living Weapons usable with -2 penalty.
- **PTU pp.288-290 (09-gear-and-items.md):** Weapon moves. Wounding Strike (Adept, DB 6, EOT). Double Swipe (Adept, DB 4, EOT, 2 targets). Bleed! (Master, DB 9, Scene x2, 3-turn Tick loss).
- **PTU p.305-306:** Shared movement (wielder's speed, shared pool). Disengage = Swift Action. Re-engage = Standard Action. No Guard suppressed. Aegislash forced Blade forme.
- **PTU p.2874-2878 (Weaponize ability):** While wielded + commanded, may Intercept for wielder as Free Action.
- **PTU p.2417-2423 (Soulstealer ability):** On causing faint, remove 1 Injury + heal 25% HP. On kill, full heal + remove all Injuries.

### Current State

- `Living Weapon` is stored as a raw string in Pokemon `otherCapabilities` -- no parsing or mechanical effect.
- The equipment system (design-equipment-001) handles trainer equipment slots (Main Hand, Off-Hand), equipment bonuses, DR, and evasion. Living Weapon must integrate with this existing system.
- No wield relationship tracking between trainers and Pokemon.
- No engage/disengage combat actions.
- No weapon move injection.
- No shared movement mechanics.

### Dependency: design-equipment-001

The Living Weapon system is built on top of the existing equipment system (design-equipment-001, status: p1-complete). It reuses:
- `EquipmentSlots` and `EquippedItem` types
- `computeEquipmentBonuses()` utility
- `buildCombatantFromEntity()` equipment integration
- Equipment CRUD API pattern

Living Weapons differ from normal equipment because they are **living Pokemon entities** that dynamically occupy equipment slots, not static catalog items. The wield relationship is tracked separately from normal equipment, and the equipment bonuses are computed from the Pokemon's species rather than a catalog lookup.

### Shared Infrastructure: feature-004 (Mounting)

Both Living Weapon and Mounting involve:
- **Linked entity pairs** (trainer + Pokemon acting as a unit)
- **Shared movement** on the VTT grid
- **Capability parsing** from `otherCapabilities` string
- **Combat state changes** (engage/disengage vs mount/dismount)

P0 of this design introduces a `LinkedPair` interface that can serve both systems. The VTT shared movement logic in P2 is designed to be reusable for mounting.

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Wield relationship data model (Encounter-scoped) | NOT_IMPLEMENTED | No wield tracking | **P0** |
| B | Living Weapon capability parsing from otherCapabilities | NOT_IMPLEMENTED | Raw string only | **P0** |
| C | Engage/Disengage API endpoints | NOT_IMPLEMENTED | No combat actions | **P0** |
| D | Wield state tracking in combat (combatant flags) | NOT_IMPLEMENTED | No wield state on Combatant | **P0** |
| E | Equipment integration: weapon bonuses from wielded Pokemon | NOT_IMPLEMENTED | No dynamic equipment slot population | **P1** |
| F | Doublade dual-wield evasion (+2 Evasion) | NOT_IMPLEMENTED | No dual-wield bonus | **P1** |
| G | Aegislash shield DR (Light Shield passive bonuses) | NOT_IMPLEMENTED | No shield auto-equip | **P1** |
| H | Fainted Living Weapon: -2 penalty to all rolls | NOT_IMPLEMENTED | No fainted penalty | **P1** |
| I | Weapon moves added to Pokemon move list while wielded | NOT_IMPLEMENTED | No move injection | **P1** |
| J | VTT shared movement (wielder speed, shared pool) | NOT_IMPLEMENTED | Independent movement only | **P2** |
| K | No Guard ability suppressed while wielded | NOT_IMPLEMENTED | No Guard always active | **P2** |
| L | Aegislash forced Blade forme while wielded | NOT_IMPLEMENTED | Stance Change unaffected by wield | **P2** |
| M | Weaponize ability: Intercept for wielder as Free Action | NOT_IMPLEMENTED | Weaponize not implemented | **P2** |
| N | Soulstealer ability: heal on faint/kill | NOT_IMPLEMENTED | Soulstealer not implemented | **P2** |

---


## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
- [implementation-log.md](implementation-log.md)
