The `EquippedItem` interface in `app/types/character.ts` defines the shape of a single equipped item. Every item has a `name` and `slot`. All other fields are optional, allowing both catalog items and custom GM-created items:

- `damageReduction` — flat DR (e.g., Light Armor = 5)
- `evasionBonus` — flat evasion bonus (e.g., Light Shield = +2)
- `statBonus` — a `{ stat, value }` pair for Focus items (applied after combat stages)
- `conditionalDR` — a `{ amount, condition }` pair for situational DR (e.g., Helmet: 15 DR vs critical hits)
- `speedDefaultCS` — sets a default speed combat stage (e.g., Heavy Armor = -1)
- `canReady` / `readiedBonuses` — shields can be readied for enhanced evasion and DR at the cost of Slowed
- `conditionalSpeedPenalty` — situational overland penalty (e.g., Snow Boots on ice)
- `grantedCapabilities` — string array of capabilities granted while worn (e.g., Darkvision, Naturewalk)
- `description`, `cost`, `twoHanded` — metadata fields

## See also

- [[equipment-slot-definitions]]
- [[equipment-constants-catalog]]
