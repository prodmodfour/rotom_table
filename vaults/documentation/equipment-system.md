# Equipment System

Slot-based equipment management for human characters.

## Components

- **HumanEquipmentTab.vue** — Equip/unequip UI, custom item entry, catalog dropdown, combat bonuses summary.
- **EquipmentCatalogBrowser.vue** — Modal catalog browser with slot filtering, search, and direct equip-to-character.

## Constants

`constants/equipment.ts` defines the equipment catalog, slot labels, and stat labels.

## Utilities

- **utils/equipmentBonuses.ts** — `computeEquipmentBonuses`, `computeEffectiveEquipment` (applies [[living-weapon-system]] overlay), `getEffectiveEquipBonuses` (combatant-level bonuses with wield relationship support).
- **utils/evasionCalculation.ts** — `computeTargetEvasions` with optional `wieldRelationships` parameter for Living Weapon equipment overlay.

## API

GET and PUT `/api/characters/:id/equipment` (Zod-validated). See [[character-api-endpoints]].

## See also

- [[equipment-bonus-aggregation]] — how equipment bonuses are computed and aggregated
- [[combat-stage-system]] — Heavy Armor applies a default Speed CS of -1
- [[evasion-and-accuracy-system]] — equipment evasion bonuses feed into evasion calculation
- [[character-api-endpoints]]
- [[combatant-type-hierarchy]]
- [[character-sheet-modal]]
