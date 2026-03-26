Freeze-Dry is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ice"`, `damageBase: 7`, `energyCost: 2`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Freeze-Dry flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

When calculating type effectiveness, Water-Typed targets calculate damage as if Water was weak to Ice.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
