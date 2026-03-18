Flame Charge is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fire"`, `damageBase: 5`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Flame Charge flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Fire-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Sunny, -5 in Rain
