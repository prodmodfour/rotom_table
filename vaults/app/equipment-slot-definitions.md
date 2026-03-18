The equipment system defines six slots as a TypeScript union type `EquipmentSlot` in `app/types/character.ts`: `head`, `body`, `mainHand`, `offHand`, `feet`, `accessory`.

The constants file exports three slot-related maps:
- `EQUIPMENT_SLOTS` — an ordered array of all six slots
- `SLOT_LABELS` — human-readable names (e.g., `mainHand` → "Main Hand", `offHand` → "Off-Hand")
- `SLOT_ICONS` — a Phosphor icon component per slot (baseball cap for head, t-shirt for body, sword for main hand, hand-palm for off-hand, sneaker for feet, circle for accessory)

The `EquipmentSlots` interface mirrors this with one optional `EquippedItem` per slot, stored on each character record.

## See also

- [[equipment-constants-catalog]]
- [[equipped-item-type-structure]]
