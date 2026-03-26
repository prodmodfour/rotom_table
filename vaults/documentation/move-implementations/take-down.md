Take Down is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 9`, `energyCost: 4`, `ac: 5`, `range: "Melee, 1 Target, Dash, Recoil 1/3"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Take Down flows through the standard [[damage-flow-pipeline]] with DB 9 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 5 is required via the [[evasion-and-accuracy-system]].

## Effect

You may perform a Trip Maneuver against the target as a Free Action. The user takes recoil damage equal to 1/3 of the damage dealt.

## Trait Interactions

Flagged for Tough Claws, Reckless in the [[moves-csv-source-file]].
