Explosion is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 25`, `energyCost: 8`, `ac: 2`, `range: "Burst 2"`.

## Energy

Energy cost 8 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Explosion flows through the standard [[damage-flow-pipeline]] with DB 25 as the base. The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

The user's Hit Points are set to -50% of their full HP value. This HP loss cannot be prevented or reduced in any way. The user's loyalty toward its trainer may be lowered. The user's Explosive Trait is not triggered.

## Range and Targeting

The area of effect is visualized by the [[measurement-aoe-modes]] system.

## Trait Interactions

No trait-interaction flags are set in the [[moves-csv-source-file]].
