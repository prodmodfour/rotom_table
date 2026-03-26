Mega Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 12`, `energyCost: 4`, `ac: 6`, `range: "Melee, 1 Target, Dash, Push, Smite"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Mega Kick flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 6 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is Pushed 2 meters.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
