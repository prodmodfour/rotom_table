Leaf Blade is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Grass"`, `damageBase: 9`, `energyCost: 3`, `ac: 2`, `range: "Melee, Pass"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Leaf Blade flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Leaf Blade is a Critical Hit on 18+.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
