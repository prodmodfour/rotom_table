Draco Meteor is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Dragon"`, `damageBase: 13`, `energyCost: 7`, `ac: 4`, `range: "8, Ranged Blast 3, Smite"`.

## Energy

Energy cost 7 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Draco Meteor flows through the standard [[damage-flow-pipeline]] with DB 13 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

After dealing damage, the user's Special Attack is lowered by 2 Combat Stages, applied through the [[combat-stage-system]].

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
