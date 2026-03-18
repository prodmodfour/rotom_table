Wild Charge is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Electric"`, `damageBase: 9`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Dash, Recoil 1/4"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Wild Charge flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
