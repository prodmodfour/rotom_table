Rock Blast is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 3`, `energyCost: 2`, `ac: 5`, `range: "6, 1 Target, Five Strike"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Rock Blast flows through the standard [[damage-flow-pipeline]] with DB 3 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. The Five Strike keyword modifies damage at step 2 of the formula. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
