Play Rough is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fairy"`, `damageBase: 9`, `energyCost: 4`, `ac: 4`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Play Rough flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Secondary Effect

Play Rough lowers the target's Attack 1 Combat Stage on 17-20 during Accuracy Check per the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force, Tough Claws in the [[moves-csv-source-file]].
