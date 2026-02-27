# P0 Specification

## P0: Data Model, Constants, CRUD, Bonus Utility

### A. Equipment Data Model

Equipment is stored as a JSON field on `HumanCharacter` rather than as a separate Prisma model. This matches the existing patterns for `inventory`, `features`, `edges`, and `skills` (all JSON fields). Equipment changes infrequently and a join table would add complexity without proportional benefit.

#### Prisma Schema Change

```prisma
model HumanCharacter {
  // ... existing fields ...

  // Equipment (JSON object mapping slot to equipped item)
  equipment     String   @default("{}") // JSON: EquipmentSlots
}
```

#### TypeScript Types

File: `app/types/character.ts`

```typescript
// PTU Equipment Slots (09-gear-and-items.md p.286)
export type EquipmentSlot = 'head' | 'body' | 'mainHand' | 'offHand' | 'feet' | 'accessory';

// A single equipped item
export interface EquippedItem {
  name: string;
  slot: EquipmentSlot;
  // Passive combat bonuses
  damageReduction?: number;        // Flat DR (e.g., Light Armor = 5, Heavy Armor = 10)
  evasionBonus?: number;           // Flat evasion bonus (e.g., Light Shield = +2)
  statBonus?: {                    // Focus-style stat bonus (applied after combat stages)
    stat: keyof Stats | 'accuracy' | 'evasion';
    value: number;
  };
  // Conditional bonuses (not auto-applied; tracked for GM reference)
  conditionalDR?: {                // e.g., Helmet: 15 DR vs critical hits only
    amount: number;
    condition: string;             // Human-readable: "Critical Hits only"
  };
  // Speed penalty (Heavy Armor sets default Speed CS to -1)
  speedDefaultCS?: number;         // -1 for Heavy Armor, undefined for others
  // Readied state (shields can be readied for enhanced bonuses)
  canReady?: boolean;              // True for shields
  readiedBonuses?: {               // Bonuses when readied (replaces base bonuses)
    evasionBonus: number;
    damageReduction: number;
    appliesSlowed: boolean;
  };
  // General
  description?: string;
  cost?: number;
  twoHanded?: boolean;             // Takes up both Main Hand and Off-Hand
}

// All equipment slots for a character
export interface EquipmentSlots {
  head?: EquippedItem;
  body?: EquippedItem;
  mainHand?: EquippedItem;
  offHand?: EquippedItem;
  feet?: EquippedItem;
  accessory?: EquippedItem;
}
```

Update `HumanCharacter` interface:

```typescript
export interface HumanCharacter {
  // ... existing fields ...
  equipment: EquipmentSlots;
}
```

#### Migration

Add `equipment` column to `HumanCharacter` with default `"{}"`. Existing characters get empty equipment slots (no regression).

### B. Equipment Constants Catalog

File: `app/constants/equipment.ts`

A lookup table of PTU standard equipment items with their mechanical effects. This is the "item catalog" that the UI and API reference. Items are keyed by name.

```typescript
import type { EquippedItem } from '~/types/character'

export const EQUIPMENT_CATALOG: Record<string, EquippedItem> = {
  // === Body Slot ===
  'Light Armor': {
    name: 'Light Armor',
    slot: 'body',
    damageReduction: 5,
    cost: 8000,
    description: 'Grants 5 Damage Reduction.',
  },
  'Heavy Armor': {
    name: 'Heavy Armor',
    slot: 'body',
    damageReduction: 10,
    speedDefaultCS: -1,
    cost: 12000,
    description: 'Grants 10 Damage Reduction. Speed default Combat Stage is -1.',
  },
  'Stealth Clothes': {
    name: 'Stealth Clothes',
    slot: 'body',
    cost: 2000,
    description: '+4 to Stealth Checks to remain unseen (max total +4).',
  },

  // === Head Slot ===
  'Helmet': {
    name: 'Helmet',
    slot: 'head',
    conditionalDR: { amount: 15, condition: 'Critical Hits only' },
    cost: 2250,
    description: '15 DR against Critical Hits. Resists Headbutt/Zen Headbutt flinch.',
  },
  'Dark Vision Goggles': {
    name: 'Dark Vision Goggles',
    slot: 'head',
    cost: 1000,
    description: 'Grants the Darkvision Capability while worn.',
  },
  'Gas Mask': {
    name: 'Gas Mask',
    slot: 'head',
    cost: 1500,
    description: 'Breathe through toxins/smoke. Immune to powder and gas moves.',
  },

  // === Off-Hand Slot ===
  'Light Shield': {
    name: 'Light Shield',
    slot: 'offHand',
    evasionBonus: 2,
    canReady: true,
    readiedBonuses: { evasionBonus: 4, damageReduction: 10, appliesSlowed: true },
    cost: 3000,
    description: '+2 Evasion. Readied: +4 Evasion, 10 DR, but Slowed.',
  },
  'Heavy Shield': {
    name: 'Heavy Shield',
    slot: 'offHand',
    evasionBonus: 2,
    canReady: true,
    readiedBonuses: { evasionBonus: 6, damageReduction: 15, appliesSlowed: true },
    cost: 4500,
    description: '+2 Evasion. Readied: +6 Evasion, 15 DR, but Slowed.',
  },

  // === Feet Slot ===
  'Running Shoes': {
    name: 'Running Shoes',
    slot: 'feet',
    cost: 2000,
    description: '+2 Athletics (max +3), +1 Overland Speed.',
  },
  'Snow Boots': {
    name: 'Snow Boots',
    slot: 'feet',
    cost: 1500,
    description: 'Naturewalk (Tundra), -1 Overland on ice/deep snow.',
  },

  // === Accessory Slot ===
  'Focus (Attack)': {
    name: 'Focus (Attack)',
    slot: 'accessory',
    statBonus: { stat: 'attack', value: 5 },
    cost: 6000,
    description: '+5 Attack (applied after Combat Stages).',
  },
  'Focus (Defense)': {
    name: 'Focus (Defense)',
    slot: 'accessory',
    statBonus: { stat: 'defense', value: 5 },
    cost: 6000,
    description: '+5 Defense (applied after Combat Stages).',
  },
  'Focus (Special Attack)': {
    name: 'Focus (Special Attack)',
    slot: 'accessory',
    statBonus: { stat: 'specialAttack', value: 5 },
    cost: 6000,
    description: '+5 Special Attack (applied after Combat Stages).',
  },
  'Focus (Special Defense)': {
    name: 'Focus (Special Defense)',
    slot: 'accessory',
    statBonus: { stat: 'specialDefense', value: 5 },
    cost: 6000,
    description: '+5 Special Defense (applied after Combat Stages).',
  },
  'Focus (Speed)': {
    name: 'Focus (Speed)',
    slot: 'accessory',
    statBonus: { stat: 'speed', value: 5 },
    cost: 6000,
    description: '+5 Speed (applied after Combat Stages).',
  },
}

// Valid equipment slot names
export const EQUIPMENT_SLOTS: readonly string[] = [
  'head', 'body', 'mainHand', 'offHand', 'feet', 'accessory'
] as const
```

The catalog is extensible -- the GM can also equip custom items via the API by passing a full `EquippedItem` object rather than referencing a catalog entry.

### C. Equipment CRUD API

Two endpoints handle equipment state on characters.

#### `GET /api/characters/:id/equipment`

Returns the character's current equipment slots and aggregate bonuses.

```typescript
// Response:
{
  success: true,
  data: {
    slots: EquipmentSlots,
    aggregateBonuses: {
      damageReduction: number,       // Sum of all equipped items' DR
      evasionBonus: number,          // Sum of all equipped items' evasion bonus
      statBonuses: Record<string, number>, // Merged stat bonuses
      speedDefaultCS: number,        // Lowest (most negative) speedDefaultCS
      conditionalDR: { amount: number, condition: string }[],
    }
  }
}
```

#### `PUT /api/characters/:id/equipment`

Equips or unequips items. Accepts a partial `EquipmentSlots` object. Setting a slot to `null` unequips it.

```typescript
// Request body:
{
  slots: {
    body: { name: 'Light Armor', slot: 'body', damageReduction: 5 },
    offHand: null  // Unequip off-hand
  }
}
```

Validation:
- Each item's `slot` field must match the key it is assigned to.
- Two-handed items (`twoHanded: true`) must occupy both `mainHand` and `offHand`. If a two-handed item is equipped in `mainHand`, the endpoint auto-clears `offHand` (and vice versa).
- Returns the updated equipment slots and aggregate bonuses.

### D. Equipment Bonuses Utility

File: `app/utils/equipmentBonuses.ts`

Pure functions, zero DB access. Computes aggregate combat bonuses from an `EquipmentSlots` object. This is the single source of truth for "what do my equipped items give me?"

```typescript
import type { EquipmentSlots, EquippedItem } from '~/types/character'

export interface EquipmentCombatBonuses {
  /** Total flat Damage Reduction from all equipped items */
  damageReduction: number
  /** Total evasion bonus from all equipped items (shields, etc.) */
  evasionBonus: number
  /** Stat bonuses applied after combat stages (Focus items) */
  statBonuses: Record<string, number>
  /** Speed default combat stage override (Heavy Armor = -1) */
  speedDefaultCS: number
  /** Conditional DR entries (e.g., Helmet: 15 DR vs crits) */
  conditionalDR: { amount: number; condition: string }[]
}

/**
 * Compute aggregate combat bonuses from all equipped items.
 * Pure function. No side effects.
 */
export function computeEquipmentBonuses(equipment: EquipmentSlots): EquipmentCombatBonuses {
  const items = Object.values(equipment).filter(Boolean) as EquippedItem[]

  let damageReduction = 0
  let evasionBonus = 0
  const statBonuses: Record<string, number> = {}
  let speedDefaultCS = 0
  const conditionalDR: { amount: number; condition: string }[] = []

  for (const item of items) {
    if (item.damageReduction) damageReduction += item.damageReduction
    if (item.evasionBonus) evasionBonus += item.evasionBonus
    if (item.statBonus) {
      const key = item.statBonus.stat
      statBonuses[key] = (statBonuses[key] ?? 0) + item.statBonus.value
    }
    if (item.speedDefaultCS !== undefined) {
      speedDefaultCS = Math.min(speedDefaultCS, item.speedDefaultCS)
    }
    if (item.conditionalDR) {
      conditionalDR.push(item.conditionalDR)
    }
  }

  return { damageReduction, evasionBonus, statBonuses, speedDefaultCS, conditionalDR }
}
```

### P0 Data Flow

```
Character DB (equipment JSON)
  -> buildHumanEntityFromRecord() parses JSON into EquipmentSlots
  -> computeEquipmentBonuses(equipment) returns EquipmentCombatBonuses
  -> Bonuses available for P1 combat integration
```

---

