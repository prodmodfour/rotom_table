Charge Beam is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Electric"`, `damageBase: 5`, `energyCost: 1`, `ac: 4`, `range: "6, 1 Target"`.

## Energy

Energy cost 1 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Charge Beam flows through the standard [[damage-flow-pipeline]] with DB 5 as the base. The [[nine-step-damage-formula]] applies STAB for Electric-type users and type effectiveness. An accuracy roll against AC 4 is required via the [[evasion-and-accuracy-system]].

## Effect

If Charge Beam successfully hits, roll 1d20. On 7+, the user's Special Attack is raised by +1 Combat Stage (applied through the [[combat-stage-system]]).

## Trait Interactions

Flagged for Technician in the [[moves-csv-source-file]].
