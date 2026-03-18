Mud Bomb is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ground"`, `damageBase: 7`, `frequency: "At-Will"`, `ac: 4`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Mud Bomb flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
