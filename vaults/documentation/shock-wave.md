Shock Wave is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: null`, `range: "6, 1 Target"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Shock Wave flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness.

## Effect

The Zapper capability grant is tracked through the [[combatant-capabilities-utility]].

## Ability Interactions

Flagged for Technician in the [[moves-csv-source-file]].
