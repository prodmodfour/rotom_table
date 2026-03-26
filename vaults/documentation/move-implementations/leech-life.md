Leech Life is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 6`, `energyCost: 1`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Leech Life flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After the target takes damage, the user gains Hit Points equal to half of the damage they dealt to the target.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
