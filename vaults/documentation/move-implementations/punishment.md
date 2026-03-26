Punishment is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Punishment flows through the standard [[damage-flow-pipeline]] with DB 6 as the base (variable). The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Punishment's Damage Base is raised by +1 for each positive Combat Stage the target has, to a maximum of DB 12.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
