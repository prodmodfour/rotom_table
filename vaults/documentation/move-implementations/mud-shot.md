Mud Shot is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Ground"`, `damageBase: 6`, `energyCost: 2`, `ac: 3`, `range: "3, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Mud Shot flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

The target's Speed is lowered by 1 Combat Stage per the [[combat-stage-system]].

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
