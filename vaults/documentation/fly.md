Fly is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Flying"`, `damageBase: 8`, `frequency: "At-Will"`, `ac: 3`, `range: "Melee, Dash, Set-Up"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Fly flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
