Close Combat is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 12`, `energyCost: 4`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Close Combat flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After dealing damage, the user's Defense and Special Defense are each lowered by 1 Combat Stage, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
