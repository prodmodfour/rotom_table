Bubble is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Water"`, `damageBase: 4`, `energyCost: 1`, `ac: 2`, `range: "Burst 1"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Bubble flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Water-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Bubble lowers the target's Speed, applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

Flagged for Sheer Force, Technician in the [[moves-csv-source-file]].

## See also

- [[weather-rules-utility]] — +5 damage in Rain, -5 in Sunny
