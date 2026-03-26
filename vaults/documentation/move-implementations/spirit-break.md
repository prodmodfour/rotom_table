Spirit Break is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fairy"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Spirit Break flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Spirit Break lowers the target's Special Attack by 1 Combat Stage per the [[combat-stage-system]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
