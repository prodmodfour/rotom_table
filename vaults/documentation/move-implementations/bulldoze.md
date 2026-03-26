Bulldoze is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ground"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "Burst 1"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Bulldoze flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

All legal targets have their Speed lowered 1 Combat Stage, applied through the [[combat-stage-system]].

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
