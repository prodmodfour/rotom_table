Bubble is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Water"`, `damageBase: 4`, `frequency: "At-Will"`, `ac: 2`, `range: "Burst 1"`.

## Frequency

At-Will frequency requires no usage tracking. `checkMoveFrequency` always permits use.

## Resolution

Bubble flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Combat stage changes are applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Ability Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
