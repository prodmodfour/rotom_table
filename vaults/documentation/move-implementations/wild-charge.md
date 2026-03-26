Wild Charge is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Electric"`, `damageBase: 9`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target, Dash, Recoil 1/3"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Wild Charge flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

No additional effect. The user takes recoil damage equal to 1/3 of the damage dealt.

## Trait Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
