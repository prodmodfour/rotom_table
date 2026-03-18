Flip Turn is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Water"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Flip Turn flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The Trapped condition blocks recall, tracked via the [[condition-source-rules]].

## Ability Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
