Giga Drain is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Grass"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "6, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Giga Drain flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After the target takes damage, the user gains Hit Points equal to half of the damage dealt.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
