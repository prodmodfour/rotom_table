# Damage Flow Pipeline

The move resolution chain during the [[turn-lifecycle|action phase]]:

`MoveButton` (select move) -> `MoveTargetModal` (pick targets, roll accuracy, roll damage) -> `useMoveCalculation` (STAB, range/LoS, evasion, effectiveness, rough terrain penalty) -> `DamageSection` (damage roll display) -> `TargetDamageList` (per-target final damage after defense and type effectiveness)

For status moves (no damage base), `MoveTargetModal` skips the damage section entirely.

## See also

- [[nine-step-damage-formula]] — the PTU 9-step calculation that `useMoveCalculation` implements
- [[evasion-and-accuracy-system]] — the accuracy check that precedes damage
- [[combat-stage-system]] — stage multipliers feeding into attack/defense
- [[damage-base-chart]] — DB lookup used at step 1
- [[turn-lifecycle]]
- [[encounter-component-categories]]
- [[encounter-composable-delegation]]
- [[damage-pipeline-as-chain-of-responsibility]] — how this pipeline implements the chain of responsibility pattern
