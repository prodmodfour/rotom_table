Fury Cutter is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 4`, `energyCost: 1`, `ac: 3`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Fury Cutter flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 3 is required via the [[evasion-and-accuracy-system]].

## Effect

If Fury Cutter is used successfully and consecutively on the same target, the Damage Base increases by +4 to a maximum of 16 (4→8→12→16). If Fury Cutter misses or fails to damage its target, its Damage Base resets.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
