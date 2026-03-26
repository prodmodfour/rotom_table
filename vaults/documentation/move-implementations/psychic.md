Psychic is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Psychic"`, `damageBase: 9`, `energyCost: 4`, `ac: 2`, `range: "5, 1 Target, Push"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Psychic flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Psychic-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is Pushed 1 meter in any direction. Psychic lowers the target's Special Defense 1 Combat Stage on 17+ per the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
