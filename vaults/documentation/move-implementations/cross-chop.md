Cross Chop is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 10`, `energyCost: 5`, `ac: 4`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Cross Chop flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Cross Chop scores a Critical Hit on 16+.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
