Dragon Tail is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dragon"`, `damageBase: 6`, `energyCost: 2`, `ac: 3`, `range: "Melee, 1 Target, Push"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dragon Tail flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Dragon-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

The target is Pushed 6 meters minus their Weight Class. On 15+, the target is also Tripped.

## Trait Interactions

Flagged for Sheer Force, Tough Claws, Technician in the [[moves-csv-source-file]].
