Gust is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Normal"`, `damageBase: 4`, `energyCost: 1`, `ac: 2`, `range: "4, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Gust flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

If the target is airborne as a result of Fly or Sky Drop, Gust can hit them ignoring Range and has a Damage Base of 8 instead.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
