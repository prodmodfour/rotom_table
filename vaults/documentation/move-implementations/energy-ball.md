Energy Ball is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Grass"`, `damageBase: 9`, `energyCost: 4`, `ac: 2`, `range: "8, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Energy Ball flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Energy Ball lowers the target's Special Defense by 1 Combat Stage on 17+, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
