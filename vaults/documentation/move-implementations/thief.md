Thief is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 6`, `energyCost: 1`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Thief flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Thief takes the target's Held Item or Accessory Slot Item and attaches it to Thief's user, if the user is not holding anything.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
