Water Pulse is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Water"`, `damageBase: 6`, `frequency: "At-Will"`, `ac: 2`, `range: "8, 1 Target, Aura"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Water Pulse flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Confusion follows the [[confused-three-outcome-save]] resolution.

## Ability Interactions

Flagged for Sheer Force, Technician, Mega Launcher in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
