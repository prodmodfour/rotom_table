Circle Throw is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 4`, `range: "Melee, 1 Target, Push"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Circle Throw flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].
