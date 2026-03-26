Hyper Beam is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 15`, `energyCost: 7`, `ac: 4`, `range: "10, 1 Target, Exhaust, Smite"`.

## Energy

Energy cost 7 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Hyper Beam flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
