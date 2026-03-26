Rock Tomb is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Rock"`, `damageBase: 6`, `energyCost: 1`, `ac: 5`, `range: "6, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Rock Tomb flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Rock-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Rock Tomb lowers the target's Speed by -1 Combat Stage per the [[combat-stage-system]].

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
