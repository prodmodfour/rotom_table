Belch is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Poison"`, `damageBase: 12`, `energyCost: 5`, `ac: 4`, `range: "Cone 2"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Belch flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Poison-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

Belch cannot be used if the user has not traded in a Digestion Buff during this Scene.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
