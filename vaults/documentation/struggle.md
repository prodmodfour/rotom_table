Struggle+ is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 5`, `frequency: "At-Will"`, `ac: 3`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Struggle+ flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

No ability-interaction flags are set in the [[moves-csv-source-file]].
