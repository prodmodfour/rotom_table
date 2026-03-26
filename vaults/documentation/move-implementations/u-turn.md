U-Turn is stored in [[movedata-reference-table]] with `damageClass: "Physical"`, `type: "Bug"`, `damageBase: 7`, `energyCost: 2`, `ac: 2`, `range: "Melee, 1 Target, Dash"`.

## Energy

Energy cost 2 is deducted from the user's Energy pool per [[move-energy-system]].

## Resolution

U-Turn flows through the standard [[damage-flow-pipeline]] with DB 7 as the base. The [[nine-step-damage-formula]] applies STAB for Bug-type users and type effectiveness. An accuracy roll against AC 2 is required via the [[evasion-and-accuracy-system]].

## Effect

If U-Turn successfully hits its target, the user deals damage and then immediately is returned to its Poke Ball in the same turn. A new Pokemon may immediately be sent out. Using U-Turn lets a Trapped user be recalled.

## Trait Interactions

Flagged for Tough Claws in the [[moves-csv-source-file]].

## See also

- [[status-capture-bonus-hierarchy]] — status conditions modify capture rate
