The `computeEquipmentBonuses` pure function in `utils/equipment.ts` aggregates all combat bonuses from a human character's equipped items across six slots (head, body, mainHand, offHand, feet, accessory).

## Aggregated Bonuses

- **DR (Damage Reduction)** — flat subtraction from incoming damage, summed from all equipped items.
- **Evasion bonus** — flat bonus to the effect-based part of [[evasion-and-accuracy-system]], summed from all items.
- **Stat bonuses** — flat bonuses to specific stats. Only the **first Focus item** applies its stat bonus (PTU p.295 limits Focus items to one set of bonuses).
- **Speed default CS** — Heavy Armor sets a default Speed combat stage of -1, affecting [[initiative-and-turn-order]] and [[combat-stage-system]] resets.
- **Conditional DR** — the Helmet provides additional DR that only applies on critical hits.

## Equipment Catalog

The `EQUIPMENT_CATALOG` constant defines 14 standard PTU items (p.286-295): Light Armor, Heavy Armor, Helmet, Goggles, Gas Mask, Light Shield, Heavy Shield, Running Shoes, Snow Boots, and five Focus items (one per combat stat). Each entry specifies its slot, bonuses, description, and cost.

The `HumanEquipmentTab` component manages equipment slots, and the `EquipmentCatalogBrowser` provides a searchable catalog modal for equipping items.

## See also

- [[equipment-system]] — the broader equipment management system
- [[nine-step-damage-formula]] — DR applies at step 7, Focus bonus at steps 5-6
- [[evasion-and-accuracy-system]] — evasion bonus feeds into evasion calculation
- [[initiative-and-turn-order]] — Heavy Armor Speed CS affects initiative
- [[combat-stage-system]] — Heavy Armor default Speed CS
