Combat stages modify a combatant's effective stats during an encounter. Each of the seven combat stats (Attack, Defense, Sp.Attack, Sp.Defense, Speed, Accuracy, Evasion) has an independent stage value clamped to the range **-6 to +6**.

## Stage Multiplier Table

Each stage maps to a multiplier applied to the base stat value:

| Stage | Multiplier |
|-------|-----------|
| -6 | 0.4 |
| -5 | 0.5 |
| -4 | 0.57 |
| -3 | 0.67 |
| -2 | 0.8 |
| -1 | 0.9 |
| 0 | 1.0 |
| +1 | 1.1 |
| +2 | 1.2 |
| +3 | 1.33 |
| +4 | 1.5 |
| +5 | 1.67 |
| +6 | 2.0 |

The constant `STAGE_MULTIPLIERS` in `constants/combat.ts` stores this table. The utility `applyStageModifier` clamps the stage, looks up the multiplier, and floors the result.

## Focus Bonus Variant

`applyStageModifierWithBonus` applies the stage multiplier first, then adds a flat bonus. This is used for Focus-equipped trainers who gain +5 to the relevant stat after stage modification (PTU p.295).

## Modification

Stages are modified via the `modifyStage` API endpoint, which accepts either a delta (+2, -1) or an absolute value. The `updateStageModifiers` service function enforces the -6/+6 clamp.

[[take-a-breather-mechanics]] resets all combat stages (respecting Heavy Armor's default Speed CS of -1).

## See also

- [[nine-step-damage-formula]] — stages feed into attack and defense steps
- [[evasion-and-accuracy-system]] — stages affect evasion and accuracy calculations
- [[equipment-bonus-aggregation]] — Heavy Armor applies a default Speed CS of -1
