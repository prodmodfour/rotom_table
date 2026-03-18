Mud Shot is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ground"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 3`, `range: "3, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Mud Shot flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
