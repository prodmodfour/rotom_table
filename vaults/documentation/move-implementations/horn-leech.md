Horn Leech is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Grass"`, `damageBase: 8`, `energyCost: 5`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Horn Leech flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Grass-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After the target takes damage, the user gains Hit Points equal to half of the damage dealt.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
