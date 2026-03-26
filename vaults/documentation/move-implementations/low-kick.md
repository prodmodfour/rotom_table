Low Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: "See Effect"`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target, Weight Class"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Low Kick flows through the standard [[damage-flow-pipeline]] with variable DB as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Low Kick's Damage Base is equal to twice the target's Weight Class.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
