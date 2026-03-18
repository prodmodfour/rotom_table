Razor Leaf is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Grass"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 4`, `range: "Cone 2"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Razor Leaf flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect



## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
