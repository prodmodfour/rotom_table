Acrobatics is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "Melee, Dash, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Acrobatics flows through the standard [[damage-flow-pipeline]] with DB 6 as the base (DB 11 if the user is not holding an item). The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
