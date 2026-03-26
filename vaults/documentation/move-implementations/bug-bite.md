Bug Bite is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 6`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Bug Bite flows through the standard [[damage-flow-pipeline]] with DB 6 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

If the target has a stored Digestion Buff or has traded in a Digestion Buff this Scene, the user may gain the effects of the Digestion Buff. This does not count towards the usual limit on the user's Digestion Buffs.

## Trait Interactions

Flagged for Tough Claws, Technician, Strong Jaw in the [[moves-csv-source-file]].
