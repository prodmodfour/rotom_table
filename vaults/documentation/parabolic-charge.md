Parabolic Charge is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 5`, `frequency: "Scene"`, `ac: 4`, `range: "Cone 2"`.

## Frequency

Scene frequency is enforced by the [[move-frequency-system]]. `checkMoveFrequency` checks the `usedThisScene` counter against a limit of 1. The counter resets via [[scene-activation-resets-move-counters]].

## Resolution

Parabolic Charge flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
