Flash Cannon is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Steel"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Flash Cannon flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Steel-type users and type effectiveness.
An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Flash Cannon lowers the target's Special Defense by 1 Combat Stage on 17+, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
