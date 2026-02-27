# P1 Specification

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

