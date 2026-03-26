Earthquake is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ground"`, `damageBase: 10`, `energyCost: 6`, `ac: 2`, `range: "Burst 3, Groundsource"`.

## Energy

Energy cost 6 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Earthquake flows through the standard [[damage-flow-pipeline]] with DB 10 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Earthquake can hit targets that are underground, including those using the Move Dig.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system. The Groundsource keyword means the move originates from the ground — it can hit underground targets but not those with Levitate or Sky movement.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
