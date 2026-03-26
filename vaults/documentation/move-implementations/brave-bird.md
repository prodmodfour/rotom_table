Brave Bird is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Flying"`, `damageBase: 12`, `energyCost: 4`, `ac: 2`, `range: "Melee, Dash, Push, Recoil 1/3"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Brave Bird flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Flying-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is pushed back 2 meters. User takes 1/3 of damage dealt as recoil.

## Trait Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
