Rock Throw is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 5`, `frequency: "At-Will"`, `ac: 4`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Rock Throw flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
