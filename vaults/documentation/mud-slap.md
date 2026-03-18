Mud-Slap is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ground"`, `damageBase: 2`, `frequency: "At-Will"`, `ac: 2`, `range: "3, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Mud-Slap flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
