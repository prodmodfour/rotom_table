Foul Play is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 10`, `energyCost: 4`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Foul Play flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target reveals its Attack stat. When calculating damage, add the target's Attack stat instead of the user's Attack stat.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
