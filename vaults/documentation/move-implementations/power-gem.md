Power Gem is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Rock"`, `damageBase: 8`, `energyCost: 2`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Power Gem flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
