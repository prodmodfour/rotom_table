---
review_id: rules-review-105
target: ptu-rule-045
trigger: design-implementation
verdict: PASS
reviewed_commits: [8adf752, 36d09fa, 246ce03, d92c9da, 9626886, a120134, 951926c]
reviewed_files:
  - app/types/character.ts
  - app/constants/equipment.ts
  - app/utils/equipmentBonuses.ts
  - app/server/api/characters/[id]/equipment.get.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/server/api/characters/[id].put.ts
  - app/server/utils/serializers.ts
  - app/prisma/schema.prisma
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] Equipment slot names and one-item-per-slot rule (PTU p.286)
- [x] Light Armor DR value (PTU p.293)
- [x] Heavy Armor DR value and Speed CS penalty (PTU p.293)
- [x] Helmet conditional DR value and condition (PTU p.293)
- [x] Light Shield passive evasion bonus and readied state values (PTU p.294)
- [x] Heavy Shield passive evasion bonus and readied state values (PTU p.294)
- [x] Focus stat bonus value and post-stage application timing (PTU p.295)
- [x] Equipment bonuses aggregation utility correctness
- [x] Data model shape (types, Prisma, serializers)
- [x] Focus single-benefit limitation (PTU p.295)

### Mechanics Verified

#### 1. Equipment Slots (PTU p.286)
- **Rule:** "They may only equip one piece of Equipment per Equipment slot though; the slots are Head, Main Hand, Off-Hand, Body, Feet, and Accessory."
- **Implementation:** `EquipmentSlot` type = `'head' | 'body' | 'mainHand' | 'offHand' | 'feet' | 'accessory'`. `EQUIPMENT_SLOTS` constant mirrors this list. `EquipmentSlots` interface allows one optional `EquippedItem` per slot. PUT endpoint validates slot names against `EQUIPMENT_SLOTS`.
- **Status:** CORRECT

#### 2. One Item Per Slot
- **Rule:** (same as above) "only equip one piece of Equipment per Equipment slot"
- **Implementation:** `EquipmentSlots` is a flat object with at most one `EquippedItem` per key. The PUT endpoint merges updates into a single object, so assigning a new item to a slot replaces the existing one structurally. Two-handed items auto-clear offHand when equipped in mainHand and vice versa.
- **Status:** CORRECT

#### 3. Light Armor (PTU p.293)
- **Rule:** "Light Armor: Grants 5 Damage Reduction. $8000"
- **Implementation:** `EQUIPMENT_CATALOG['Light Armor']` = `{ slot: 'body', damageReduction: 5, cost: 8000 }`
- **Status:** CORRECT

#### 4. Heavy Armor (PTU p.293)
- **Rule:** "Heavy Armor grants +10 Damage Reduction. Heavy Armor causes the wearer's Speed's Default Combat Stage to be -1. $12,000"
- **Implementation:** `EQUIPMENT_CATALOG['Heavy Armor']` = `{ slot: 'body', damageReduction: 10, speedDefaultCS: -1, cost: 12000 }`
- **Status:** CORRECT

#### 5. Helmet (PTU p.293)
- **Rule:** "The user gains 15 Damage Reduction against Critical Hits. The user resists the Moves Headbutt and Zen Headbutt and can't be flinched by these Moves. $2250"
- **Implementation:** `EQUIPMENT_CATALOG['Helmet']` = `{ slot: 'head', conditionalDR: { amount: 15, condition: 'Critical Hits only' }, cost: 2250 }`. The Headbutt/Zen Headbutt flinch resistance is noted in the description string but not mechanically automated. This is acceptable for P0 since flinch-resist is a specific move interaction that belongs in P1+ combat integration.
- **Status:** CORRECT (DR value and condition accurate; flinch resist deferred appropriately)

#### 6. Light Shield (PTU p.294)
- **Rule:** "Light Shields grant +2 Evasion. They may be readied as a Standard Action to instead grant +4 Evasion and 10 Damage Reduction until the end of your next turn, but also cause you to become Slowed for that duration. ... Light Shields cost around $3000."
- **Implementation:** `EQUIPMENT_CATALOG['Light Shield']` = `{ slot: 'offHand', evasionBonus: 2, canReady: true, readiedBonuses: { evasionBonus: 4, damageReduction: 10, appliesSlowed: true }, cost: 3000 }`
- **Status:** CORRECT

#### 7. Heavy Shield (PTU p.294)
- **Rule:** "Heavy Shields grnat [sic] +2 Evasion and may be readied as a Standard Action to grant +6 Evasion and 15 Damage Reduction until the end of your next turn, but also cause you to become Slowed for that duration. ... Heavy Shields cost around $4500."
- **Implementation:** `EQUIPMENT_CATALOG['Heavy Shield']` = `{ slot: 'offHand', evasionBonus: 2, canReady: true, readiedBonuses: { evasionBonus: 6, damageReduction: 15, appliesSlowed: true }, cost: 4500 }`
- **Status:** CORRECT

#### 8. Focus Items (PTU p.295)
- **Rule:** "A Focus grants +5 Bonus to a Stat, chosen when crafted. This Bonus is applied AFTER Combat Stages. Focuses are often Accessory-Slot Items, but may be crafted as Head-Slot, Hand or Off-Hand Slot Items as well; a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot. Focuses are not usually found in stores, but may sometimes be found for $6000 at your GM's discretion."
- **Implementation:** Five Focus variants in catalog (Attack, Defense, Special Attack, Special Defense, Speed), each with `statBonus: { stat: <stat>, value: 5 }`, `slot: 'accessory'`, `cost: 6000`.
- **Status:** CORRECT with one noted limitation (see below)

#### 9. Focus Single-Benefit Limitation
- **Rule:** "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot"
- **Implementation:** Since all Focus items are in the accessory slot, and a trainer only has one accessory slot, the one-Focus rule is naturally enforced for the catalog items. However, the PTU rule says a Focus "may be crafted as Head-Slot, Hand or Off-Hand Slot Items as well" and the system supports custom items. If a GM creates a custom Focus in the head slot and another in the accessory slot, `computeEquipmentBonuses()` would stack both stat bonuses without enforcing the one-Focus limit.
- **Status:** CORRECT for P0 scope. The catalog-only path cannot violate this rule. The custom-item edge case is a P1+ concern that the design spec explicitly defers (custom item support is documented as an extensibility feature, not as a Focus-specific workflow).

#### 10. Bonuses Aggregation Utility
- **Rule:** Equipment bonuses from different sources stack (armor DR + other DR, shield evasion + other evasion, Focus stat bonus applied post-stage).
- **Implementation:** `computeEquipmentBonuses()` iterates all equipped items and:
  - Sums `damageReduction` (correct -- Light Armor 5 + any other DR sources)
  - Sums `evasionBonus` (correct -- shields contribute +2 passively)
  - Merges `statBonuses` by key (correct -- Focus stat bonuses aggregate)
  - Takes `Math.min()` of `speedDefaultCS` (correct -- takes most negative, which handles Heavy Armor's -1 properly and would handle theoretical stacking)
  - Collects `conditionalDR` entries as an array (correct -- Helmet's 15 DR vs crits is preserved as a separate conditional entry, not mixed into flat DR)
  - Immutable: creates a fresh `conditionalDR` entry via spread `{ ...item.conditionalDR }` (correct pattern)
- **Status:** CORRECT

#### 11. Equipping Action Cost
- **Rule:** "Equipping an Item or switching one for another takes a Standard Action." (PTU p.286)
- **Implementation:** The API endpoints handle equip/unequip as a persistence operation. Action cost enforcement is a combat-phase concern (P1+). The design spec notes this rule reference but does not implement action economy at the P0 layer.
- **Status:** CORRECT (out of P0 scope; correctly deferred)

#### 12. Catalog Coverage
- **Rule:** PTU p.286-295 lists equipment across all slot categories.
- **Implementation:** 15 items implemented covering body (3), head (3), offHand (2), feet (2), accessory (5). The catalog covers all mechanically impactful items (armor, shields, helmet, focus) plus representative utility items (stealth clothes, goggles, gas mask, shoes, boots). Items with purely narrative effects (Fancy Clothes contest bonuses, Re-Breather Gilled capability, Sunglasses skill bonuses, Flippers swim speed) are not in the catalog -- these have no combat-mechanical impact and are appropriate to add later. No incorrect items are present.
- **Status:** CORRECT (complete for combat-relevant items)

### Summary
- Mechanics checked: 12
- Correct: 12
- Incorrect: 0

### Advisory Notes (non-blocking)

1. **Focus multi-slot stacking:** The PTU rules specify "a Trainer may only benefit from one Focus at a time, regardless of the Equipment Slot." The current implementation naturally enforces this because all catalog Focus items occupy the accessory slot. However, if custom Focus items are introduced in other slots (head, hand, off-hand -- which PTU allows), `computeEquipmentBonuses()` would stack them. Consider adding a Focus-specific cap in P1 when combat integration reads these bonuses, or in the PUT endpoint when custom items are supported.

2. **Shield readied state:** The readied shield values (+4/+6 evasion, 10/15 DR, Slowed) are correctly stored in `readiedBonuses` but `computeEquipmentBonuses()` only reads the passive (non-readied) bonuses. This is correct for P0. The design spec explicitly defers readied-state toggling to P2+.

3. **Helmet flinch resistance:** The Helmet's secondary effect (resist Headbutt/Zen Headbutt flinch) is documented in the description string but not mechanically tracked. This is a move-specific interaction that belongs in P1+ combat integration where move execution logic can check for helmet equipment.
