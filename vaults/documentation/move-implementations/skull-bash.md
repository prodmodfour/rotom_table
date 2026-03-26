Skull Bash is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 13`, `energyCost: 5`, `ac: 2`, `range: "Melee, 1 Target, Dash, Push, Set-Up"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Skull Bash flows through the standard [[damage-flow-pipeline]] with DB 13 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Set-Up Effect: The user gains +1 Defense CS per the [[combat-stage-system]]. Resolution Effect: The user may attack with Skull Bash. The target is pushed 3 meters.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
