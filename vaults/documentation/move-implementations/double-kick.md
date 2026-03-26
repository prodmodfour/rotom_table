Double Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 3`, `energyCost: 1`, `ac: 3`, `range: "Melee, 1 Target, Double Strike"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Double Kick flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. The Double Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
