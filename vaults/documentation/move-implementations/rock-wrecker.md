Rock Wrecker is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 15`, `energyCost: 5`, `ac: 4`, `range: "Melee, 1 Target, Dash, Exhaust, Smite"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Rock Wrecker flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
