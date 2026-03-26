Payback is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Dark"`, `damageBase: 5`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Payback flows through the standard [[damage-flow-pipeline]] with DB 5 as the base (or 10 if the condition is met). The [[nine-step-damage-formula]] applies STAB for Dark-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

If the target hit the user with a Damaging Move on the previous turn, Payback has a Damage Base of 10 instead.

## Trait Interactions

Flagged for Tough Claws, Technician in the [[moves-csv-source-file]].
