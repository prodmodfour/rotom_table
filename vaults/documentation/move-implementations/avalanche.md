Avalanche is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Ice"`, `damageBase: 6`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Avalanche flows through the standard [[damage-flow-pipeline]] with DB 6 as the base (DB 12 if the target damaged the user this round). The [[nine-step-damage-formula]] applies STAB for Ice-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

When declaring Avalanche, the user does nothing and may not Shift. At the end of the round, the user Shifts and uses Avalanche on any legal target. If the target damaged the user this round, Avalanche has a Damage Base of 12 instead.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
