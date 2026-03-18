Dragon Tail is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dragon"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 3`, `range: "Melee, 1 Target, Push"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Dragon Tail flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Ability Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].
