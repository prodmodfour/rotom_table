Earthquake is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ground"`, `damageBase: 10`, `frequency: "Scene"`, `ac: 2`, `range: "Burst 3, Groundsource"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Earthquake flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The Groundshaper capability grant is tracked through the [[combatant-capabilities-utility]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system. The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
