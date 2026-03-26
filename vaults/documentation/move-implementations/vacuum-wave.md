Vacuum Wave is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fighting"`, `damageBase: 4`, `energyCost: 1`, `ac: 2`, `range: "4, 1 Target, Priority, Aura"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Vacuum Wave flows through the standard [[damage-flow-pipeline]] with DB 4 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Timing

Vacuum Wave has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
