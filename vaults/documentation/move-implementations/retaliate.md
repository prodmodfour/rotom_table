Retaliate is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Normal"`, `damageBase: 7`, `energyCost: 3`, `ac: 2`, `range: "Melee, 1 Target"`.

## Energy

Energy cost 3 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

Retaliate flows through the standard [[damage-flow-pipeline]] with DB 7 as the base (or 14 if the condition is met). The [[nine-step-damage-formula]] applies STAB for Normal-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

Retaliate's Damage Base is doubled to DB 14 if an ally has been Fainted by a Damaging Move used by the target in the last 2 rounds of Combat.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].
