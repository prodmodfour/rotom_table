Tackle is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 5`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Dash, Push"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Tackle flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
