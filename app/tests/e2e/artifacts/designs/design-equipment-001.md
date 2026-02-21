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

## P1: Combat Integration

### E. Auto-Apply DR from Armor

Currently, `damageReduction` is an optional field on `DamageCalcInput` passed manually by the caller. In P1, the server auto-computes DR from the target's equipment when the caller does not provide an explicit override.

#### Changes to `calculate-damage.post.ts`

```typescript
// After loading the target combatant:
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'

// For human targets, compute equipment DR
let equipmentDR = 0
if (target.type === 'human') {
  const human = target.entity as HumanCharacter
  const bonuses = computeEquipmentBonuses(human.equipment ?? {})
  equipmentDR = bonuses.damageReduction
  // Add conditional DR for critical hits (e.g., Helmet)
  if (body.isCritical) {
    for (const cdr of bonuses.conditionalDR) {
      if (cdr.condition === 'Critical Hits only') {
        equipmentDR += cdr.amount
      }
    }
  }
}

// Use caller-provided DR if present, otherwise use equipment-derived DR
const effectiveDR = body.damageReduction ?? equipmentDR

// Pass to calculateDamage:
const result = calculateDamage({
  ...existingInput,
  damageReduction: effectiveDR,
})
```

The same pattern applies to `move.post.ts` and `damage.post.ts` -- wherever the server applies damage to a human combatant, it reads equipment DR.

#### Changes to `damageCalculation.ts`

No changes to the pure function. `damageReduction` is already a supported input parameter. The caller (API layer) now auto-populates it.

### F. Auto-Apply Evasion from Shields

Shield evasion bonuses stack with the existing `stageModifiers.evasion` value. Equipment evasion is a separate source that should be additive.

#### Changes to `useMoveCalculation.ts` and `calculate-damage.post.ts`

```typescript
// When computing evasion for a target:
let equipmentEvasionBonus = 0
if (target.type === 'human') {
  const human = target.entity as HumanCharacter
  const bonuses = computeEquipmentBonuses(human.equipment ?? {})
  equipmentEvasionBonus = bonuses.evasionBonus
}

// Total evasion bonus = stage modifier evasion + equipment evasion
const totalEvasionBonus = (stages.evasion ?? 0) + equipmentEvasionBonus

// Pass to calculateEvasion (existing function already accepts evasionBonus):
const physEvasion = calculateEvasion(defStat, stages.defense, totalEvasionBonus)
```

The existing `calculateEvasion()` function in `damageCalculation.ts` already handles `evasionBonus` correctly (adds it after stat-based evasion, clamps floor at 0). No changes to the pure function needed.

### G. Focus Stat Bonuses

Focus items add a flat bonus to a stat AFTER combat stages are applied. The current `applyStageModifier()` function returns `floor(baseStat * stageMultiplier)`. Focus bonuses are added after this step.

#### Changes to `damageCalculation.ts`

Add a new helper:

```typescript
/**
 * Apply stage modifier and then add post-stage flat bonus (e.g., Focus +5).
 * PTU p.295: "This Bonus is applied AFTER Combat Stages."
 */
export function applyStageModifierWithBonus(
  baseStat: number,
  stage: number,
  postStageBonus: number = 0
): number {
  return Math.floor(baseStat * STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, stage))]) + postStageBonus
}
```

#### Changes to `calculate-damage.post.ts`

When computing effective attack/defense for human combatants, apply equipment stat bonuses:

```typescript
if (combatant.type === 'human') {
  const bonuses = computeEquipmentBonuses(human.equipment ?? {})
  const attackBonus = bonuses.statBonuses[isPhysical ? 'attack' : 'specialAttack'] ?? 0
  const defenseBonus = bonuses.statBonuses[isPhysical ? 'defense' : 'specialDefense'] ?? 0
  // These get added after stage multiplication in the damage formula
}
```

### H. Heavy Armor Speed Penalty

Heavy Armor sets the character's Speed default combat stage to -1 (PTU p.293). This means the character's Speed CS starts at -1 instead of 0 at the beginning of combat, and "clearing stages" resets Speed to -1 instead of 0.

#### Implementation

This is tracked as `speedDefaultCS` on the equipment. The "Take a Breather" maneuver and any "clear all stages" effect should reset Speed CS to this default rather than 0.

Changes to `combatant.service.ts` (stage reset logic):

```typescript
// When resetting stages (Take a Breather, etc.):
const defaultStages = createDefaultStageModifiers()

// Apply equipment speed default CS
if (combatant.type === 'human') {
  const bonuses = computeEquipmentBonuses((combatant.entity as HumanCharacter).equipment ?? {})
  if (bonuses.speedDefaultCS !== 0) {
    defaultStages.speed = bonuses.speedDefaultCS
  }
}

entity.stageModifiers = defaultStages
```

Similarly, `buildCombatantFromEntity()` should set initial speed CS to the equipment default:

```typescript
// In buildCombatantFromEntity, after creating the combatant:
if (entityType === 'human') {
  const bonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
  if (bonuses.speedDefaultCS !== 0) {
    combatant.entity.stageModifiers.speed = bonuses.speedDefaultCS
    // Recalculate initiative with penalized speed
    const effectiveSpeed = applyStageModifier(stats.speed, bonuses.speedDefaultCS)
    combatant.initiative = effectiveSpeed + initiativeBonus
  }
}
```

### P1 Integration Summary

| Combat Step | Current Behavior | P1 Behavior |
|-------------|-----------------|-------------|
| Damage formula step 7 (DR) | Manual `damageReduction` param or 0 | Auto-reads from target equipment; manual override still works |
| Evasion calculation | `stageModifiers.evasion` only | Equipment evasion bonus added to stage evasion bonus |
| Attack/Defense stats | Raw stat * stage multiplier | + Focus post-stage bonus for humans with Focus equipped |
| Speed default CS | Always 0 | -1 for Heavy Armor wearers; persists through stage resets |
| Critical hit DR | None | Helmet adds 15 conditional DR on critical hits |

---

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

## Entity Builder Updates

### `buildHumanEntityFromRecord()` (combatant.service.ts)

Add equipment parsing:

```typescript
export function buildHumanEntityFromRecord(record: PrismaHumanRecord): HumanCharacter {
  return {
    // ... existing fields ...
    equipment: record.equipment ? JSON.parse(record.equipment) : {},
  }
}
```

### `buildCombatantFromEntity()` (combatant.service.ts)

Incorporate equipment bonuses into initial evasion calculation:

```typescript
export function buildCombatantFromEntity(options: BuildCombatantOptions): Combatant {
  // ... existing code ...

  let equipmentEvasionBonus = 0
  let equipmentSpeedCS = 0
  if (entityType === 'human') {
    const bonuses = computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})
    equipmentEvasionBonus = bonuses.evasionBonus
    equipmentSpeedCS = bonuses.speedDefaultCS
  }

  // Apply speed default CS to initiative
  const effectiveSpeedForInitiative = equipmentSpeedCS !== 0
    ? applyStageModifier(stats.speed, equipmentSpeedCS)
    : stats.speed
  const initiative = effectiveSpeedForInitiative + initiativeBonus

  return {
    // ... existing fields ...
    initiative,
    physicalEvasion: initialEvasion(stats.defense || 0) + equipmentEvasionBonus,
    specialEvasion: initialEvasion(stats.specialDefense || 0) + equipmentEvasionBonus,
    speedEvasion: initialEvasion(stats.speed || 0) + equipmentEvasionBonus,
    // ...
  }
}
```

---

## WebSocket Sync

Equipment changes emit a `character_update` WebSocket event (existing event type). The Group View already handles `character_update` by refreshing combatant data. No new event types needed.

---

## Migration Plan

1. Add `equipment` column to `HumanCharacter` Prisma model with `@default("{}")`
2. Run `npx prisma migrate dev --name add-equipment-column`
3. No data migration needed -- all existing characters start with empty equipment (no regression)
4. Existing manual DR/evasion workflows continue to work (P1 only auto-populates when equipment is present)

---

## Test Plan

### P0 Tests
- [ ] `computeEquipmentBonuses()` unit test: empty equipment returns all zeros
- [ ] `computeEquipmentBonuses()` unit test: Light Armor -> DR 5, no evasion
- [ ] `computeEquipmentBonuses()` unit test: Heavy Armor -> DR 10, speedDefaultCS -1
- [ ] `computeEquipmentBonuses()` unit test: Light Shield -> evasion +2
- [ ] `computeEquipmentBonuses()` unit test: Multiple items aggregate correctly (armor + shield + focus)
- [ ] `computeEquipmentBonuses()` unit test: Helmet conditional DR tracked separately
- [ ] `PUT /api/characters/:id/equipment` equips item correctly
- [ ] `PUT /api/characters/:id/equipment` unequips item (null) correctly
- [ ] `PUT /api/characters/:id/equipment` rejects mismatched slot
- [ ] `GET /api/characters/:id/equipment` returns current equipment + bonuses

### P1 Tests
- [ ] E2E: Trainer with Light Armor takes reduced damage (DR 5 auto-applied)
- [ ] E2E: Trainer with Heavy Armor has DR 10 and Speed CS starts at -1
- [ ] E2E: Trainer with Light Shield has +2 evasion reflected in accuracy threshold
- [ ] E2E: Trainer with Focus (Attack) gets +5 attack after stage multiplier in damage calc
- [ ] E2E: Trainer with Helmet gets 15 extra DR on critical hits only
- [ ] E2E: "Take a Breather" resets Speed CS to -1 (not 0) for Heavy Armor wearer
- [ ] E2E: Equipment bonuses correctly zero out for Pokemon combatants (no equipment system for Pokemon)

### P2 Tests
- [ ] Equipment tab renders all 6 slots
- [ ] Equipping an item from catalog dropdown updates the slot
- [ ] Removing an item clears the slot
- [ ] Combat bonuses summary updates reactively

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Equipment JSON bloat on HumanCharacter | Low | Equipment is 6 items max; JSON is tiny |
| Breaking existing DR/evasion manual workflows | Medium | P1 uses equipment DR as default but caller override still works |
| Shield readied state complexity | Low | P0/P1 only track passive bonuses; readied state is a GM-managed toggle, deferred |
| Pokemon held items confusion | Low | Equipment system is trainer-only; Pokemon `heldItem` field is completely separate |
| Two-handed weapon slot conflicts | Low | Validation in PUT endpoint prevents invalid slot combinations |

---

## Decisions & Trade-offs

1. **JSON field vs. separate table**: JSON on `HumanCharacter` matches project patterns (inventory, features, edges). Equipment changes infrequently and never needs relational queries.

2. **Catalog as constants vs. DB table**: Constants file is simpler and matches the project's approach for `combatManeuvers`, `statusConditions`. The GM can still equip custom items via the API by providing a full `EquippedItem` object.

3. **Evasion bonus stacking**: Equipment evasion bonus stacks additively with `stageModifiers.evasion`. Both feed into the existing `evasionBonus` parameter of `calculateEvasion()`. Total evasion from all sources is still capped at +9 per PTU rules (PTU p.657).

4. **Shield readied state deferred**: Readied shields grant enhanced bonuses but also apply Slowed. This is a combat action with duration tracking. P0/P1 only handle passive (non-readied) shield bonuses. Readied state can be a P2+ enhancement.

5. **Pokemon equipment excluded**: PTU Pokemon use "Held Items" which are a separate system (single item, different mechanics). The equipment slot system is trainer-only. Pokemon held items remain the existing `heldItem` string field.

---

## Implementation Log

### P0 — Data Model, Constants, CRUD, Bonus Utility (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `8adf752` | Equipment slot types (EquipmentSlot, EquippedItem, EquipmentSlots) | `app/types/character.ts` |
| `36d09fa` | Prisma schema: equipment JSON field on HumanCharacter | `app/prisma/schema.prisma` |
| `246ce03` | Equipment constants catalog (15 PTU items, 6 slot types) | `app/constants/equipment.ts` (new) |
| `d92c9da` | computeEquipmentBonuses() pure utility | `app/utils/equipmentBonuses.ts` (new) |
| `9626886` | Serializer + PUT endpoint equipment support | `app/server/utils/serializers.ts`, `app/server/api/characters/[id].put.ts` |
| `a120134` | Equipment CRUD API (GET + PUT) | `app/server/api/characters/[id]/equipment.get.ts` (new), `app/server/api/characters/[id]/equipment.put.ts` (new) |

### P0 — Review Fixes (code-review-115) (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `4590346` | C1 fix: include equipment in buildHumanEntityFromRecord() | `app/server/services/combatant.service.ts` |
| `1626800` | H1 fix: Zod validation for equipment PUT endpoint | `app/server/api/characters/[id]/equipment.put.ts`, `app/package.json` |
| `aaab058` | M1 fix: add equipment endpoints to app-surface.md | `.claude/skills/references/app-surface.md` |

**P0 Status:** All 4 items implemented + review fixes applied. P1/P2 remain.

### P1 — Combat Integration (2026-02-20)

| Commit | Description | Files |
|--------|-------------|-------|
| `61203a8` | E+F+G: Auto-apply DR, evasion, Focus bonuses in server damage calc | `app/utils/damageCalculation.ts`, `app/server/api/encounters/[id]/calculate-damage.post.ts` |
| `978f529` | F+H: Equipment evasion/initiative/speed CS in combatant builder | `app/server/services/combatant.service.ts` |
| `6027e57` | H: Take a Breather respects Heavy Armor speed default CS | `app/server/api/encounters/[id]/breather.post.ts` |
| `8f79acb` | E+F+G: Equipment bonuses in client-side move calculation | `app/composables/useMoveCalculation.ts` |

**P1 Summary:**

- **E (DR from Armor):** `calculate-damage.post.ts` auto-reads equipment DR for human targets. Helmet conditional DR (+15) applied on critical hits. Caller-provided DR overrides for manual GM adjustments. Client-side `useMoveCalculation.ts` also subtracts equipment DR in `targetDamageCalcs`.
- **F (Evasion from Shields):** Equipment evasion bonus added to evasion calculations in both server (`calculate-damage.post.ts`) and client (`useMoveCalculation.ts` `getTargetEvasion`/`getTargetEvasionLabel`). `buildCombatantFromEntity()` includes equipment evasion in initial evasion values.
- **G (Focus Stat Bonuses):** New `applyStageModifierWithBonus()` helper in `damageCalculation.ts`. `DamageCalcInput` gains `attackBonus`/`defenseBonus` fields. Server endpoint computes Focus bonuses for human attackers/targets. Client composable applies Focus bonuses to `attackStatValue` and `targetDamageCalcs`.
- **H (Heavy Armor Speed Penalty):** `buildCombatantFromEntity()` applies speed default CS to initiative and initial stage modifiers. `breather.post.ts` resets speed CS to equipment default (not 0) for Heavy Armor wearers.

**P1 Status:** All 4 items (E, F, G, H) implemented. P2 (UI) remains.

### P2 — Equipment Tab UI & Item Catalog Browser (2026-02-21)

| Commit | Description | Files |
|--------|-------------|-------|
| `5654e10` | I: HumanEquipmentTab.vue — 6 slots, catalog dropdown, custom item entry, combat bonuses summary | `app/components/character/tabs/HumanEquipmentTab.vue` (new) |
| `d779419` | I: Register Equipment tab in CharacterModal | `app/components/character/CharacterModal.vue` |
| `c0d9b59` | I: Register Equipment tab on GM character detail page | `app/pages/gm/characters/[id].vue` |
| `56a2c1c` | J: EquipmentCatalogBrowser modal — grouped by slot, filter/search, equip button | `app/components/character/EquipmentCatalogBrowser.vue` (new) |
| `5b76f2b` | I+J: Wire catalog browser into Equipment tab | `app/components/character/tabs/HumanEquipmentTab.vue` |

**P2 Summary:**

- **I (Equipment Tab):** New `HumanEquipmentTab.vue` added to both `CharacterModal.vue` and `gm/characters/[id].vue`. Six equipment slots with Phosphor Icons, each showing equipped item name + remove button. Empty slots show dropdown filtered to slot-compatible catalog items plus a "Custom..." option for manual item entry with bonus values. Combat Bonuses summary at bottom shows aggregate DR, evasion, speed CS, Focus stat bonuses, and conditional DR from `computeEquipmentBonuses()`. Equip/unequip calls `PUT /api/characters/:id/equipment`. WebSocket `character_update` emitted when character is in active encounter.
- **J (Item Catalog Browser):** New `EquipmentCatalogBrowser.vue` modal. Full catalog view of all 15 EQUIPMENT_CATALOG entries grouped by slot. Filter by slot dropdown, search by name/description. Each item shows name, cost, description, and bonus tags (DR, evasion, speed CS, focus, conditional DR, can-ready). Equip button targets selected character via PUT API.

**P2 Status:** All items (I, J) implemented. Design complete.
