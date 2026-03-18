Springtide Storm is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fairy"`, `damageBase: 10`, `frequency: "Scene"`, `ac: 5`, `range: "6, Ranged Blast 3, Smite"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Springtide Storm flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
