False Swipe is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 4`, `energyCost: 1`, `ac: 2`, `range: "Melee, Pass"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

False Swipe flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

False Swipe's damage cannot bring a target lower than 1 Hit Point.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
