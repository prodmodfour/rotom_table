# P2 Specification

## P2: UI Polish

### I. Equipment Tab on Character Sheet

New tab: `HumanEquipmentTab.vue` added to the character detail panel alongside Stats, Classes, Skills, Pokemon tabs.

#### Layout

```
+----------------------------------------------+
|  EQUIPMENT                                    |
+----------------------------------------------+
|  [Head]        Dark Vision Goggles     [X]    |
|  [Body]        Heavy Armor             [X]    |
|  [Main Hand]   Hunting Bow             [X]    |
|  [Off-Hand]    Light Shield            [X]    |
|  [Feet]        Running Shoes           [X]    |
|  [Accessory]   Focus (Attack)          [X]    |
+----------------------------------------------+
|  COMBAT BONUSES                               |
|  DR: 10  |  Evasion: +2  |  Speed CS: -1     |
|  Focus: +5 Attack (post-stage)                |
|  Helmet: 15 DR vs Critical Hits               |
+----------------------------------------------+
```

- Each slot shows the item name and a remove button.
- Clicking an empty slot opens a dropdown with items from `EQUIPMENT_CATALOG` filtered to that slot.
- Custom item entry: a "Custom..." option at the bottom of the dropdown opens a form for name + manual bonus values.
- The "Combat Bonuses" summary section at the bottom shows the aggregate output of `computeEquipmentBonuses()`.

#### Equip/Unequip Flow

1. User clicks empty slot -> dropdown of catalog items for that slot
2. User selects item -> `PUT /api/characters/:id/equipment` with the slot assignment
3. API validates and persists -> returns updated equipment + bonuses
4. Component updates reactively
5. If character is in an active encounter, emit `character_update` WebSocket event so Group View reflects the change

### J. Item Catalog Browser

A secondary enhancement for exploring all available equipment. Not a priority for the core equipment system.

- Full-page or modal catalog view showing all `EQUIPMENT_CATALOG` entries grouped by slot
- Filter by slot, search by name
- "Equip" button per item that targets a selected character
- Drag-and-drop from catalog to character equipment slots

This is purely cosmetic/UX and has no mechanical dependencies. Defer until after P1 is stable.

---

