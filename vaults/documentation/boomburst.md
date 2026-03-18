Boomburst is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 14`, `frequency: "Scene"`, `ac: 2`, `range: "Burst 1, Sonic"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Boomburst flows through the standard [[damage-flow-pipeline]] with DB 14 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Punk Rock in the [[moves-csv-source-file]].
