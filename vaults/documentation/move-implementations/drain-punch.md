Drain Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 8`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target, Aura"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Drain Punch flows through the standard [[damage-flow-pipeline]] with DB 8 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

After the target takes damage, the user gains HP equal to half of the damage dealt.

## Trait Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].
