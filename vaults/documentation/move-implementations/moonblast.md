Moonblast is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fairy"`, `damageBase: 10`, `energyCost: 4`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Moonblast flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Moonblast lowers the target's Special Attack by 1 Combat Stage on 15+ per the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
