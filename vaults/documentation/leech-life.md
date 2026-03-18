Leech Life is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 2`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Leech Life flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The HP recovery is described in the `effect` text field.

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
