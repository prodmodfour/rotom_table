The file `app/constants/equipment.ts` defines the static equipment catalog as a `Record<string, EquippedItem>` keyed by item name. It contains 17 items sourced from PTU 1.05 chapter 09-gear-and-items.md (p.286–295):

- **Body** (3 items): Light Armor, Heavy Armor, Stealth Clothes
- **Head** (4 items): Helmet, Dark Vision Goggles, Gas Mask, Re-Breather
- **Off-Hand** (2 items): Light Shield, Heavy Shield
- **Feet** (3 items): Running Shoes, Snow Boots, Jungle Boots
- **Accessory** (5 items): Focus (Attack), Focus (Defense), Focus (Special Attack), Focus (Special Defense), Focus (Speed)
- **Main Hand**: no catalog entries exist — only custom items can be equipped in this slot

The catalog is the data source for the [[equipment-catalog-browser-modal]] and the per-slot dropdowns on the [[gm-character-detail-equipment-tab]].

## See also

- [[equipment-slot-definitions]]
- [[equipped-item-type-structure]]
- [[naturewalk-terrain-constant]] — Snow Boots and Jungle Boots grant Naturewalk capabilities
- [[living-weapon-config-constant]] — Main Hand slot is used by the Living Weapon system
