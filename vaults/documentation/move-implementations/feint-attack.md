Feint Attack is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 6`, `energyCost: 2`, `ac: null`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Feint Attack flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. Feint Attack cannot miss.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
