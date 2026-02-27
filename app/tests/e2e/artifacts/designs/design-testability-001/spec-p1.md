# P1 Specification

## B. Evasion Recalculation During Combat (P1)

### Problem

Evasion is computed once at combatant creation (`pokemon-generator.service.ts:301-303`) using `floor(calculatedStat / 5)`. During combat, if defense stages change, the evasion doesn't update. PTU rules explicitly state evasion should reflect stage-modified stats:

> "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score." (07-combat.md:644-647)

### Solution

Add evasion calculation to `damageCalculation.ts` and expose it through the calculate-damage endpoint's breakdown.

#### New Functions in `damageCalculation.ts`

```typescript
/**
 * Calculate dynamic evasion from stage-modified stat.
 * PTU 07-combat.md:594-615, 644-647
 * Evasion = min(6, floor(stageModifiedStat / 5))
 */
export function calculateEvasion(baseStat: number, combatStage: number = 0): number {
  const modifiedStat = applyStageModifier(baseStat, combatStage)
  return Math.min(6, Math.floor(modifiedStat / 5))
}

/**
 * Calculate accuracy threshold for a move.
 * PTU 07-combat.md:749-755
 * Threshold = max(1, moveAC + min(9, evasion) - attackerAccuracyStage)
 * Nat 1 = always miss, Nat 20 = always hit.
 */
export function calculateAccuracyThreshold(
  moveAC: number,
  attackerAccuracyStage: number,
  defenderEvasion: number
): number {
  const effectiveEvasion = Math.min(9, defenderEvasion)
  return Math.max(1, moveAC + effectiveEvasion - attackerAccuracyStage)
}
```

#### Extended Calculate-Damage Response

Add an `accuracy` section to the `DamageCalcResult`:

```typescript
export interface AccuracyCalcResult {
  moveAC: number
  attackerAccuracyStage: number
  // Defender's chosen evasion (best of physical/special for the move's damage class)
  physicalEvasion: number      // dynamic: floor(stageModified defense / 5), cap 6
  specialEvasion: number       // dynamic: floor(stageModified spDef / 5), cap 6
  speedEvasion: number         // dynamic: floor(stageModified speed / 5), cap 6
  applicableEvasion: number    // physical or special based on move's damage class
  effectiveEvasion: number     // min(9, applicableEvasion)
  accuracyThreshold: number    // the d20 roll needed to hit
}
```

The endpoint computes dynamic evasion using the target's current stats and stage modifiers, rather than reading the static `physicalEvasion`/`specialEvasion`/`speedEvasion` fields on the combatant.

### Test Impact

Tests can assert:
- A target with Defense 15 and +0 CS has Physical Evasion 3
- The same target at +3 Defense CS (stat becomes `floor(15 * 1.6) = 24`) has Physical Evasion 4
- The +9 evasion cap is enforced
- Accuracy thresholds are correctly computed from dynamic evasion

---

