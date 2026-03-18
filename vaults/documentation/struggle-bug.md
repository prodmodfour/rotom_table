Struggle Bug is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Bug"`, `damageBase: 5`, `frequency: "At-Will"`, `ac: 2`, `range: "Cone 2"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Struggle Bug flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
