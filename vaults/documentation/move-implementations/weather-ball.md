Weather Ball is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 5`, `energyCost: 2`, `ac: 2`, `range: "8, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Weather Ball flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

If it is Sunny, Weather Ball is Fire-Type. If it is Rainy, Weather Ball is Water-Type. If it is Hailing, Weather Ball is Ice-Type. If it is Sandstorming, Weather Ball is Rock-Type. When a weather effect is on the field, Weather Ball has a Damage Base of 10. If there are multiple Weather Effects on the field, choose one type for Weather Ball to be that corresponds with an existing Weather Effect.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
