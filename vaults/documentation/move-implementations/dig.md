Dig is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ground"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "Burst 1, Set-Up, Full Action, Groundsource"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Dig flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Ground-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Set-Up Effect: The user shifts 25 meters underground and their turn ends. Resolution Effect: The user may shift horizontally using their burrow or overland speed, then shifts 25 meters straight up. Upon reaching the surface, the user attacks with Dig, creating a Burst 1.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system. The Groundsource keyword means the move originates from the ground.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
