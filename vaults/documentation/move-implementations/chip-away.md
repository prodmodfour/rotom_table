Chip Away is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 7`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Chip Away flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Ignore any Armor, Damage Reduction, or changes in the target's Defense or Special Defense (such as from Combat Stages) when calculating damage. Reduces the target's Defense and Special Defense Combat Stages by 1, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
