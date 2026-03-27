Evasion and accuracy determine whether an attack hits. Three types of evasion exist: Physical, Special, and Speed.

## Evasion Calculation

Evasion has two parts combined additively:

1. **Stat-based** — `floor((stageModified(stat) + statBonus) / 5)`, capped at 6. The stat used depends on the evasion type: Defense for Physical, Sp.Defense for Special, Speed for Speed evasion. Stage modification uses the [[combat-stage-system]] multiplier table. The stat bonus comes from [[equipment-bonus-aggregation]] (Focus items add +5).
2. **Effect-based** — flat bonuses from moves, abilities, and equipment stack additively.

Total evasion has a minimum of 0.

## Accuracy Threshold

The accuracy threshold determines the minimum d20 roll needed to hit:

**threshold = moveAC + min(9, targetEvasion) - attackerAccuracyStage**

The threshold has a minimum of 1. The system auto-selects the best evasion type (physical, special, or speed) for each target based on which gives the highest evasion.

## See also

- [[combat-stage-system]] — stage modifiers for evasion and accuracy stats
- [[nine-step-damage-formula]] — damage calculation that follows a successful accuracy check
- [[equipment-bonus-aggregation]] — equipment contributes evasion bonuses and stat bonuses
