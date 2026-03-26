Focus Blast is stored in [[movedata-reference-table]] with `damageClass: "Special"`, `type: "Fighting"`, `damageBase: 12`, `energyCost: 4`, `ac: 7`, `range: "6, 1 Target, Smite, Aura"`.

## Energy

Energy cost 4 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Focus Blast flows through the standard [[damage-flow-pipeline]] with DB 12 as the base. The [[nine-step-damage-formula]] applies STAB for Fighting-type users and type effectiveness.
An accuracy roll against AC 7 is required via the [[evasion-and-accuracy-system]].

## Effect

Focus Blast lowers the target's Special Defense 1 Combat Stage on 18+, applied through the [[combat-stage-system]].

## Trait Interactions

Flagged for Sheer Force in the [[moves-csv-source-file]].
