Gyro Ball is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Steel"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Gyro Ball flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target reveals their Speed Stat (including Combat Stages). If it is higher than the user's, subtract the user's Speed from the target's, and apply the difference as Bonus Damage.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
