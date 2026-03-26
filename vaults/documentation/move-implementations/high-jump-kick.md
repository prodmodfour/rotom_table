High Jump Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 13`, `energyCost: 5`, `ac: 3`, `range: "Melee, Dash, 1 Target"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

High Jump Kick flows through the standard [[damage-flow-pipeline]] with DB 13 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

If High Jump Kick misses, the user loses HP equal to 1/4th of their Max HP. A failure to hit due to a Shield keyword move does not count as a miss. Cannot be used if Gravity is in effect.

## Trait Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
