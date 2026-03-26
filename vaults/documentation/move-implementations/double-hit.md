Double Hit is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 4`, `energyCost: 2`, `ac: 3`, `range: "Melee, 1 Target, Double Strike"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Double Hit flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. The Double Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
