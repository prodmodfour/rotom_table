Arm Thrust is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 2`, `energyCost: 2`, `ac: 4`, `range: "Melee, 1 Target, Five Strike"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Arm Thrust flows through the standard [[damage-flow-pipeline]] with DB 2 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
