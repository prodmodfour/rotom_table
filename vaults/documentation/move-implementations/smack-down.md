Smack Down is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 5`, `energyCost: 3`, `ac: 2`, `range: "8, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Smack Down flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is knocked down to ground level and loses all Sky Speed for 3 turns. During this time, they may be hit by Ground-Type Moves even if normally immune.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
