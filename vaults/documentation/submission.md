Submission is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 8`, `frequency: "At-Will"`, `ac: 6`, `range: "Melee, 1 Target, Recoil 1/3"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Submission flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Reckless in the [[moves-csv-source-file]].
