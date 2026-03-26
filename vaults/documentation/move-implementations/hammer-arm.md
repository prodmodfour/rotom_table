Hammer Arm is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 10`, `energyCost: 4`, `ac: 3`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Hammer Arm flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

The user lowers their Speed 1 Combat Stage after using this move, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].
