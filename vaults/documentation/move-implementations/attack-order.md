Attack Order is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 9`, `energyCost: 4`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Attack Order flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Attack Order is a Critical Hit on 18+.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
