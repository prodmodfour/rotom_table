Draining Kiss is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fairy"`, `damageBase: 5`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Draining Kiss flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Fairy-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After the target takes damage, the user gains Hit Points equal to half of the damage dealt.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
