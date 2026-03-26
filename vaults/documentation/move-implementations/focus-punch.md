Focus Punch is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Fighting"`, `damageBase: 15`, `energyCost: 5`, `ac: 2`, `range: "Melee, 1 Target, Priority (Limited), Aura"`.

## Energy

Energy cost 5 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Focus Punch flows through the standard [[damage-flow-pipeline]] with DB 15 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Use of Focus Punch must be declared as a Priority (Limited) action at the beginning of the round. Nothing happens at that time. At the end of the round, if the user hasn't been hit by an attack dealing at least 25% of their Max HP, the user may Shift and use Focus Punch. Energy is not expended if Focus Punch is negated by an attack.

## Timing

Focus Punch has the Priority keyword, placing it in the [[hold-priority-interrupt-system|Priority Window]] before normal actions.

## Trait Interactions

Flagged for Tough Claws, Iron Fist in the [[moves-csv-source-file]].
