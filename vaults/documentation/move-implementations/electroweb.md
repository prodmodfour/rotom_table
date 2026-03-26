Electroweb is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 6`, `energyCost: 3`, `ac: 3`, `range: "4, Ranged Blast 2"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Electroweb flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

All legal targets have their Speed lowered by 1 Combat Stage, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
