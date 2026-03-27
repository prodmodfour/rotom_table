Pluck is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 6`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Pluck flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Pluck takes the target's Held Item or Accessory Slot Item and attaches it to the user, if the user is not holding anything.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
