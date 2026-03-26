Jump Kick is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 10`, `energyCost: 2`, `ac: 3`, `range: "Melee, Dash, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Jump Kick flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

If Jump Kick misses, the user loses Hit Points equal to 1/4th of their Max Hit Points. A failure to hit due to a Move with the Shield keyword does not count as a miss. This Move cannot be used if Gravity is in effect.

## Trait Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
