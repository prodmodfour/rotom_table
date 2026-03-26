Leaf Tornado is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Grass"`, `damageBase: 7`, `energyCost: 2`, `ac: 4`, `range: "6, Ranged Blast 3"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Leaf Tornado flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Small or Medium targets in the central square of the blast are not hit. On 15+, all legal targets have their Accuracy lowered by -1.

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
